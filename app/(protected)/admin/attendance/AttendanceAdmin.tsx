"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, ButtonGroup, Input, Tab, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tabs } from "@nextui-org/react";
import { IconChevronLeft, IconChevronRight, IconChecks, IconDeviceFloppy, IconSearch } from "@tabler/icons-react";
import { toast } from "sonner";
import { useC7Api } from "@/lib/c7Api";
import { LoadState, monthIST, monthLabel, PageHeader, PersonCell, shiftMonth, Stat, todayIST, useC7, type Person } from "../_c7/shared";

type Status = "PRESENT" | "ABSENT" | "LEAVE";
type Day = { date: string; members: (Person & { memberId: string | null; membershipStatus: string; attendance: { status: Status; notes: string | null } | null })[]; stats: { present: number; absent: number; leave: number; unmarked: number } };
const shiftDay = (d: string, n: number) => new Date(new Date(`${d}T12:00:00Z`).getTime() + n * 86400000).toISOString().slice(0, 10);

export default function AttendanceAdmin() {
  return (
    <>
      <PageHeader title="Attendance" description="Mark who trained at the studio. Members see their visits, attendance rate and streak in the C7 app." />
      <Tabs aria-label="Attendance" color="primary" variant="underlined" classNames={{ panel: "pt-4" }}>
        <Tab key="day" title="Mark a day"><DayPanel /></Tab>
        <Tab key="month" title="Monthly report"><MonthPanel /></Tab>
      </Tabs>
    </>
  );
}

function DayPanel() {
  const api = useC7Api();
  const [date, setDate] = useState(todayIST());
  const q = useC7<Day>(`/admin/attendance?date=${date}`);
  const [draft, setDraft] = useState<Record<string, Status | null>>({});
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => setDraft({}), [date, q.data]);

  const value = (id: string): Status | null => (id in draft ? draft[id]! : q.data?.members.find((m) => m.userId === id)?.attendance?.status ?? null);
  const dirty = Object.keys(draft).length;
  const members = useMemo(() => (q.data?.members ?? []).filter((m) => !search || m.name.toLowerCase().includes(search.toLowerCase()) || (m.memberId ?? "").toLowerCase().includes(search.toLowerCase())), [q.data, search]);
  const isFuture = date > todayIST();

  const save = async () => {
    setBusy(true);
    try {
      await api("/admin/attendance", { method: "PUT", body: JSON.stringify({ date, entries: Object.entries(draft).map(([userId, status]) => ({ userId, status })) }) });
      toast.success(`Saved ${dirty} change${dirty === 1 ? "" : "s"}`);
      q.reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const allPresent = () => setDraft(Object.fromEntries((q.data?.members ?? []).filter((m) => !value(m.userId)).map((m) => [m.userId, "PRESENT" as Status]).concat(Object.entries(draft) as [string, Status][])));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button isIconOnly size="sm" variant="flat" aria-label="Previous day" onPress={() => setDate(shiftDay(date, -1))}><IconChevronLeft size={16} /></Button>
        <Input type="date" size="sm" className="max-w-[170px]" value={date} max={todayIST()} onValueChange={(v) => v && setDate(v)} aria-label="Date" />
        <Button isIconOnly size="sm" variant="flat" aria-label="Next day" isDisabled={date >= todayIST()} onPress={() => setDate(shiftDay(date, 1))}><IconChevronRight size={16} /></Button>
        <Input size="sm" className="max-w-[240px] ml-auto" placeholder="Search name or member ID" startContent={<IconSearch size={14} />} value={search} onValueChange={setSearch} aria-label="Search members" />
      </div>
      {q.data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Present" value={q.data.stats.present} tone="success" />
          <Stat label="Absent" value={q.data.stats.absent} />
          <Stat label="Leave" value={q.data.stats.leave} />
          <Stat label="Not marked" value={q.data.stats.unmarked} tone={q.data.stats.unmarked ? "warning" : undefined} />
        </div>
      )}
      <LoadState loading={q.loading} error={q.error} onRetry={q.reload}>
        <Table aria-label="Mark attendance" removeWrapper>
          <TableHeader>
            <TableColumn>MEMBER</TableColumn>
            <TableColumn>MEMBERSHIP</TableColumn>
            <TableColumn>ATTENDANCE</TableColumn>
          </TableHeader>
          <TableBody emptyContent={search ? "No member matches that search." : "No members yet."}>
            {members.map((m) => {
              const v = value(m.userId);
              const set = (s: Status) => setDraft({ ...draft, [m.userId]: v === s ? null : s });
              return (
                <TableRow key={m.userId}>
                  <TableCell><PersonCell p={m} sub={m.memberId ?? m.email ?? ""} /></TableCell>
                  <TableCell className="text-sm text-foreground-500 capitalize">{m.membershipStatus.toLowerCase()}</TableCell>
                  <TableCell>
                    <ButtonGroup size="sm" variant="flat" isDisabled={isFuture}>
                      <Button aria-label={`${m.name} present`} color={v === "PRESENT" ? "success" : "default"} variant={v === "PRESENT" ? "solid" : "flat"} onPress={() => set("PRESENT")}>Present</Button>
                      <Button aria-label={`${m.name} absent`} color={v === "ABSENT" ? "danger" : "default"} variant={v === "ABSENT" ? "solid" : "flat"} onPress={() => set("ABSENT")}>Absent</Button>
                      <Button aria-label={`${m.name} leave`} color={v === "LEAVE" ? "primary" : "default"} variant={v === "LEAVE" ? "solid" : "flat"} onPress={() => set("LEAVE")}>Leave</Button>
                    </ButtonGroup>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </LoadState>
      <div className="sticky bottom-4 flex justify-end gap-2">
        <Button variant="flat" startContent={<IconChecks size={16} />} onPress={allPresent} isDisabled={!q.data || isFuture}>Mark everyone else present</Button>
        <Button color="primary" startContent={<IconDeviceFloppy size={16} />} isDisabled={!dirty} isLoading={busy} onPress={save}>{dirty ? `Save ${dirty} change${dirty === 1 ? "" : "s"}` : "Saved"}</Button>
      </div>
    </div>
  );
}

function MonthPanel() {
  const [month, setMonth] = useState(monthIST());
  const q = useC7<{ daily: { date: string; present: number }[]; members: (Person & { present: number; absent: number; leave: number; rate: number })[] }>(`/admin/attendance/summary?month=${month}`);
  const max = Math.max(1, ...(q.data?.daily.map((d) => d.present) ?? []));
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1">
        <Button isIconOnly variant="flat" size="sm" aria-label="Previous month" onPress={() => setMonth(shiftMonth(month, -1))}><IconChevronLeft size={16} /></Button>
        <span className="text-sm font-medium w-36 text-center">{monthLabel(month)}</span>
        <Button isIconOnly variant="flat" size="sm" aria-label="Next month" isDisabled={month >= monthIST()} onPress={() => setMonth(shiftMonth(month, 1))}><IconChevronRight size={16} /></Button>
      </div>
      <LoadState loading={q.loading} error={q.error} onRetry={q.reload}>
        {q.data && (
          <div className="space-y-6">
            <div className="flex items-end gap-1 h-28 border-b border-divider" aria-label="Daily check-ins">
              {q.data.daily.map((d) => (
                <div key={d.date} className="flex-1 bg-primary/80 rounded-t" style={{ height: `${(d.present / max) * 100}%` }} title={`${d.date}: ${d.present}`} />
              ))}
              {q.data.daily.length === 0 && <p className="text-sm text-foreground-500 pb-4">No attendance marked this month.</p>}
            </div>
            <Table aria-label="Member attendance" removeWrapper>
              <TableHeader>
                <TableColumn>MEMBER</TableColumn>
                <TableColumn className="text-right">PRESENT</TableColumn>
                <TableColumn className="text-right">ABSENT</TableColumn>
                <TableColumn className="text-right">LEAVE</TableColumn>
                <TableColumn className="text-right">RATE</TableColumn>
              </TableHeader>
              <TableBody emptyContent="Nothing marked yet.">
                {q.data.members.map((m) => (
                  <TableRow key={m.userId}>
                    <TableCell><PersonCell p={m} /></TableCell>
                    <TableCell className="text-right tabular-nums">{m.present}</TableCell>
                    <TableCell className="text-right tabular-nums">{m.absent}</TableCell>
                    <TableCell className="text-right tabular-nums">{m.leave}</TableCell>
                    <TableCell className={`text-right tabular-nums ${m.rate < 50 ? "text-warning" : ""}`}>{m.rate}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </LoadState>
    </div>
  );
}
