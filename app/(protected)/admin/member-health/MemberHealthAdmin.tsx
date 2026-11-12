"use client";

import { useMemo, useRef, useState } from "react";
import { Button, Input, Listbox, ListboxItem, Select, SelectItem, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@nextui-org/react";
import { IconCalendarEvent, IconExternalLink, IconSearch, IconTrash, IconUpload } from "@tabler/icons-react";
import { toast } from "sonner";
import { useC7Api } from "@/lib/c7Api";
import { dateIN, LoadState, PageHeader, PersonCell, readDataUrl, todayIST, useC7, type PersonFull } from "../_c7/shared";

type Report = { id: string; title: string; category: string; fileType: string; fileSize: number; reportDate: string; notes: string | null; uploadedBy: string; createdAt: string };
type Checkup = { nextDate: string; intervalDays: number; notes: string | null; setByCoach: boolean; daysLeft: number; overdue: boolean } | null;
const CATS = [["BLOOD", "Blood test"], ["SCAN", "Scan / X-ray"], ["PRESCRIPTION", "Prescription"], ["FITNESS", "Fitness assessment"], ["OTHER", "Other"]] as const;
const kb = (b: number) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export default function MemberHealthAdmin() {
  const people = useC7<{ people: PersonFull[] }>("/admin/people");
  const [search, setSearch] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const members = useMemo(() => (people.data?.people ?? []).filter((p) => p.role === "USER" && !p.isGuest && (!search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.memberId ?? "").toLowerCase().includes(search.toLowerCase()))), [people.data, search]);
  const person = people.data?.people.find((p) => p.userId === sel);
  return (
    <>
      <PageHeader title="Member health" description="Medical reports and BMI check-up dates. Members see the reports in their app (private to them and coaches) and get a reminder before each check-up." />
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        <div className="space-y-3">
          <Input size="sm" placeholder="Search members" startContent={<IconSearch size={14} />} value={search} onValueChange={setSearch} aria-label="Search members" />
          <LoadState loading={people.loading} error={people.error} onRetry={people.reload}>
            <div className="rounded-lg border border-divider bg-content1 max-h-[70vh] overflow-auto">
              <Listbox aria-label="Members" selectionMode="single" selectedKeys={sel ? [sel] : []} onSelectionChange={(k) => setSel(String(Array.from(k)[0] ?? ""))} emptyContent="No members">
                {members.map((m) => (
                  <ListboxItem key={m.userId} textValue={m.name}>
                    <PersonCell p={m} sub={m.memberId ?? m.email ?? ""} />
                  </ListboxItem>
                ))}
              </Listbox>
            </div>
          </LoadState>
        </div>
        {person ? <MemberPanel key={person.userId} p={person} /> : <p className="text-sm text-foreground-500 pt-2">Pick a member to see their reports and check-up schedule.</p>}
      </div>
    </>
  );
}

function MemberPanel({ p }: { p: PersonFull }) {
  const api = useC7Api();
  const reports = useC7<{ reports: Report[] }>(`/admin/members/${p.userId}/reports`);
  const chk = useC7<{ checkup: Checkup }>(`/admin/members/${p.userId}/checkup`);
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState("FITNESS");
  const [date, setDate] = useState(todayIST());
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [next, setNext] = useState("");
  const [interval, setInterval] = useState("30");
  const [notes, setNotes] = useState("");

  const upload = async () => {
    if (!file) return toast.error("Choose a PDF or image");
    if (file.size > 10 * 1024 * 1024) return toast.error("Files must be under 10 MB");
    if (title.trim().length < 2) return toast.error("Name the report");
    setBusy(true);
    try {
      await api(`/admin/members/${p.userId}/reports`, { method: "POST", body: JSON.stringify({ title: title.trim(), category: cat, fileUrl: await readDataUrl(file), reportDate: date }) });
      toast.success("Report added — visible in the member's app");
      setTitle("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      reports.reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const open = async (r: Report) => {
    try {
      const { report } = await api<{ report: Report & { fileUrl: string } }>(`/admin/reports/${r.id}`);
      const blob = await (await fetch(report.fileUrl)).blob();
      window.open(URL.createObjectURL(blob), "_blank", "noopener");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  const remove = async (r: Report) => {
    if (!confirm(`Delete "${r.title}"? The member loses access too.`)) return;
    await api(`/admin/reports/${r.id}`, { method: "DELETE" }).then(() => (toast.success("Deleted"), reports.reload())).catch((e) => toast.error((e as Error).message));
  };
  const saveCheckup = async () => {
    if (!next) return toast.error("Pick the next check-up date");
    try {
      await api(`/admin/members/${p.userId}/checkup`, { method: "PUT", body: JSON.stringify({ nextDate: next, intervalDays: Number(interval) || 30, notes: notes || null }) });
      toast.success("Check-up scheduled — the member gets a reminder 3 days before");
      chk.reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  const c = chk.data?.checkup;
  return (
    <div className="space-y-8 min-w-0">
      <PersonCell p={p} sub={`${p.memberId ?? ""} ${p.membershipStatus.toLowerCase()}`} />

      <section className="space-y-3">
        <h2 className="font-semibold flex items-center gap-2"><IconCalendarEvent size={18} /> BMI check-up</h2>
        <p className="text-sm text-foreground-500">
          {c ? `Next: ${dateIN(c.nextDate)}${c.overdue ? " (overdue)" : ` · in ${c.daysLeft} days`}${c.setByCoach ? "" : " · default monthly from last weigh-in"}${c.notes ? ` · ${c.notes}` : ""}` : "No weigh-ins or schedule yet."}
        </p>
        <div className="flex flex-wrap gap-3 items-end">
          <Input type="date" size="sm" label="Next check-up" className="max-w-[180px]" value={next} min={todayIST()} onValueChange={setNext} />
          <Select size="sm" label="Then every" className="max-w-[160px]" selectedKeys={[interval]} onSelectionChange={(k) => setInterval(String(Array.from(k)[0]))}>
            {["14", "30", "45", "60", "90"].map((d) => <SelectItem key={d}>{`${d} days`}</SelectItem>)}
          </Select>
          <Input size="sm" label="Note for the member" className="max-w-xs" value={notes} onValueChange={setNotes} />
          <Button color="primary" size="sm" onPress={saveCheckup}>Save</Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Medical reports</h2>
        <div className="flex flex-wrap gap-3 items-end rounded-lg border border-divider p-3">
          <input ref={fileRef} type="file" accept="application/pdf,image/*" className="text-sm" onChange={(e) => setFile(e.target.files?.[0] ?? null)} aria-label="Report file" />
          <Input size="sm" label="Name" className="max-w-xs" value={title} onValueChange={setTitle} />
          <Select size="sm" label="Type" className="max-w-[200px]" selectedKeys={[cat]} onSelectionChange={(k) => setCat(String(Array.from(k)[0]))}>
            {CATS.map(([k, l]) => <SelectItem key={k}>{l}</SelectItem>)}
          </Select>
          <Input type="date" size="sm" label="Report date" className="max-w-[170px]" value={date} max={todayIST()} onValueChange={setDate} />
          <Button size="sm" color="primary" startContent={<IconUpload size={14} />} isLoading={busy} onPress={upload}>Add report</Button>
        </div>
        <LoadState loading={reports.loading} error={reports.error} onRetry={reports.reload}>
          <Table aria-label="Reports" removeWrapper>
            <TableHeader>
              <TableColumn>REPORT</TableColumn>
              <TableColumn>TYPE</TableColumn>
              <TableColumn>DATE</TableColumn>
              <TableColumn>ADDED BY</TableColumn>
              <TableColumn> </TableColumn>
            </TableHeader>
            <TableBody emptyContent="No reports yet.">
              {(reports.data?.reports ?? []).map((r) => (
                <TableRow key={r.id}>
                  <TableCell><p className="text-sm">{r.title}</p><p className="text-xs text-foreground-500">{r.fileType === "application/pdf" ? "PDF" : "Image"} · {kb(r.fileSize)}</p></TableCell>
                  <TableCell className="text-sm">{CATS.find(([k]) => k === r.category)?.[1]}</TableCell>
                  <TableCell className="text-sm">{dateIN(r.reportDate)}</TableCell>
                  <TableCell className="text-sm">{r.uploadedBy === p.userId ? "Member" : "Coach"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button isIconOnly size="sm" variant="light" aria-label={`Open ${r.title}`} onPress={() => open(r)}><IconExternalLink size={16} /></Button>
                      <Button isIconOnly size="sm" variant="light" aria-label={`Delete ${r.title}`} onPress={() => remove(r)}><IconTrash size={16} /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </LoadState>
      </section>
    </div>
  );
}
