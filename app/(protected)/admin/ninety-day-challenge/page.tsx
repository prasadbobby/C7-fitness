"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, Chip, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Progress, Spinner, Switch, Textarea, useDisclosure } from "@nextui-org/react";
import { IconChevronRight, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";
import DatePicker from "@/components/UI/DatePicker";
import { DeleteConfirmationModal } from "@/components/UI/ConfirmationModal";
import { JoinRequests } from "./_components/JoinRequests";

type Challenge = { id: string; title: string; description: string | null; startDate: string; endDate: string; isActive: boolean; participantCount: number; createdAt: string };
type Stats = { activeChallenges: number; totalParticipants: number; completionRate: number; avgProgress: number };

const DAY = 86400000;
const fmt = (d: string | Date) => new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
function statusOf(c: Challenge) {
  const now = Date.now();
  if (now > new Date(c.endDate).getTime()) return { label: "Finished", color: "default" as const };
  if (!c.isActive) return { label: "Paused", color: "warning" as const };
  if (now < new Date(c.startDate).getTime()) return { label: "Upcoming", color: "secondary" as const };
  return { label: "Live", color: "success" as const };
}

export default function NinetyDayChallengePage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [challenges, setChallenges] = useState<Challenge[] | null>(null);
  const [editing, setEditing] = useState<Challenge | null>(null);
  const [form, setForm] = useState({ title: "", description: "", startDate: new Date(), endDate: new Date(Date.now() + 90 * DAY), isActive: true });
  const [saving, setSaving] = useState(false);
  const formModal = useDisclosure();
  const deleteModal = useDisclosure();
  const [toDelete, setToDelete] = useState<Challenge | null>(null);

  const load = useCallback(async () => {
    const [s, c] = await Promise.all([fetch("/api/admin/ninety-day-challenge?stats=true"), fetch("/api/admin/ninety-day-challenge")]);
    if (s.ok) setStats((await s.json()).stats);
    setChallenges(c.ok ? (await c.json()).challenges : []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", description: "", startDate: new Date(), endDate: new Date(Date.now() + 90 * DAY), isActive: true });
    formModal.onOpen();
  };
  const openEdit = (c: Challenge) => {
    setEditing(c);
    setForm({ title: c.title, description: c.description ?? "", startDate: new Date(c.startDate), endDate: new Date(c.endDate), isActive: c.isActive });
    formModal.onOpen();
  };
  const save = async () => {
    if (!form.title.trim()) return toast.error("Give the challenge a title");
    if (form.endDate <= form.startDate) return toast.error("End date must be after the start date");
    setSaving(true);
    const r = await fetch(editing ? `/api/admin/ninety-day-challenge/${editing.id}` : "/api/admin/ninety-day-challenge", { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, title: form.title.trim() }) });
    setSaving(false);
    if (!r.ok) return toast.error("Couldn't save the challenge");
    toast.success(editing ? "Challenge updated" : "Challenge created");
    formModal.onClose();
    load();
  };
  const remove = async () => {
    if (!toDelete) return;
    const r = await fetch(`/api/admin/ninety-day-challenge/${toDelete.id}`, { method: "DELETE" });
    if (!r.ok) return toast.error("Couldn't delete the challenge");
    toast.success("Challenge deleted");
    deleteModal.onClose();
    setToDelete(null);
    load();
  };

  const tiles = [
    { label: "Live challenges", value: stats?.activeChallenges },
    { label: "Active participants", value: stats?.totalParticipants },
    { label: "Avg. check-ins", value: stats?.avgProgress, suffix: " days" },
    { label: "Completed 90 days", value: stats?.completionRate, suffix: "%" },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <nav className="flex items-center gap-1 text-sm text-foreground-500">
        <Link href="/admin" className="hover:text-foreground">Admin</Link>
        <IconChevronRight size={14} />
        <span className="text-foreground">Challenges</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground">Challenges</h1>
          <p className="text-sm text-foreground-500 mt-1">Run transformation challenges, approve members and follow their progress.</p>
        </div>
        <Button color="primary" startContent={<IconPlus size={18} />} onPress={openCreate}>
          New challenge
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <Card key={t.label} shadow="none" className="border border-divider">
            <CardBody className="p-4">
              <p className="text-xs text-foreground-500">{t.label}</p>
              <p className="text-2xl font-semibold text-foreground mt-1">{t.value == null ? "—" : `${t.value}${t.suffix ?? ""}`}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] items-start">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-500">All challenges</h2>
          {challenges === null ? (
            <div className="py-12 flex justify-center"><Spinner /></div>
          ) : challenges.length === 0 ? (
            <Card shadow="none" className="border border-dashed border-divider">
              <CardBody className="py-10 text-center">
                <p className="font-medium text-foreground">No challenges yet</p>
                <p className="text-sm text-foreground-500 mt-1">Create one and members can request to join from the app.</p>
                <Button className="mt-4 self-center" color="primary" variant="flat" onPress={openCreate}>Create challenge</Button>
              </CardBody>
            </Card>
          ) : (
            challenges.map((c) => {
              const st = statusOf(c);
              const total = Math.max(1, Math.round((new Date(c.endDate).getTime() - new Date(c.startDate).getTime()) / DAY));
              const elapsed = Math.min(total, Math.max(0, Math.ceil((Date.now() - new Date(c.startDate).getTime()) / DAY)));
              return (
                <Card key={c.id} shadow="none" isPressable onPress={() => router.push(`/admin/ninety-day-challenge/challenges/${c.id}`)} className="w-full border border-divider hover:border-primary/60 transition-colors">
                  <CardBody className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-foreground text-lg truncate">{c.title}</p>
                          <Chip size="sm" variant="flat" color={st.color}>{st.label}</Chip>
                        </div>
                        {c.description && <p className="text-sm text-foreground-500 mt-1 line-clamp-2">{c.description}</p>}
                        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-foreground-500">Dates</p>
                            <p className="text-foreground">{fmt(c.startDate)} – {fmt(c.endDate)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-foreground-500">Participants</p>
                            <p className="text-foreground">{c.participantCount}</p>
                          </div>
                          <div>
                            <p className="text-xs text-foreground-500">Day</p>
                            <p className="text-foreground">{elapsed} of {total}</p>
                          </div>
                        </div>
                        <Progress aria-label="Challenge progress" size="sm" value={(elapsed / total) * 100} className="mt-3" color={st.label === "Live" ? "primary" : "default"} />
                      </div>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button isIconOnly size="sm" variant="light" aria-label="Edit challenge" onPress={() => openEdit(c)}><IconPencil size={16} /></Button>
                        <Button isIconOnly size="sm" variant="light" color="danger" aria-label="Delete challenge" onPress={() => { setToDelete(c); deleteModal.onOpen(); }}><IconTrash size={16} /></Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })
          )}
        </section>

        <aside className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-500">Needs attention</h2>
          <JoinRequests onChange={load} />
        </aside>
      </div>

      <Modal isOpen={formModal.isOpen} onClose={formModal.onClose} size="lg">
        <ModalContent>
          <ModalHeader>{editing ? "Edit challenge" : "New challenge"}</ModalHeader>
          <ModalBody className="gap-4">
            <Input label="Title" value={form.title} onValueChange={(v) => setForm({ ...form, title: v })} isRequired />
            <Textarea label="Description" description="Shown to members in the app" value={form.description} onValueChange={(v) => setForm({ ...form, description: v })} minRows={3} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DatePicker label="Start date" value={form.startDate} onChange={(d) => d && setForm({ ...form, startDate: d })} />
              <DatePicker label="End date" value={form.endDate} onChange={(d) => d && setForm({ ...form, endDate: d })} />
            </div>
            <Switch isSelected={form.isActive} onValueChange={(v) => setForm({ ...form, isActive: v })}>Open for check-ins</Switch>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={formModal.onClose}>Cancel</Button>
            <Button color="primary" isLoading={saving} onPress={save}>{editing ? "Save changes" : "Create challenge"}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.onClose}
        onConfirm={remove}
        itemName={toDelete?.title}
        itemType="challenge"
        message={<p>Delete <strong>{toDelete?.title}</strong>? All participants, posts and comments in it are removed. This can’t be undone.</p>}
      />
    </div>
  );
}
