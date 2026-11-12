"use client";

import { useState } from "react";
import { Button, Chip, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, Switch, Textarea } from "@nextui-org/react";
import { IconEdit, IconPin, IconPlus, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";
import { useC7Api } from "@/lib/c7Api";
import { dateIN, LoadState, PageHeader, useC7, type Person, type PersonFull } from "../_c7/shared";

type Kind = "GENERAL" | "EVENT" | "OFFER" | "PAYMENT" | "CLOSURE";
type Audience = "ALL" | "MEMBERS" | "GUESTS" | "USER";
type Ann = { id: string; title: string; body: string; kind: Kind; audience: Audience; targetUserId: string | null; pinned: boolean; publishedAt: string; expiresAt: string | null; reads: number; target: Person | null };
const KIND: Record<Kind, string> = { GENERAL: "Update", EVENT: "Event", OFFER: "Offer", PAYMENT: "Payment", CLOSURE: "Timings / closure" };
const AUD: Record<Audience, string> = { ALL: "Everyone", MEMBERS: "Members", GUESTS: "Guests (not enrolled)", USER: "One member" };
type Form = { id?: string; title: string; body: string; kind: Kind; audience: Audience; targetUserId: string; pinned: boolean; expiresAt: string };

export default function AnnouncementsAdmin() {
  const api = useC7Api();
  const q = useC7<{ announcements: Ann[] }>("/admin/announcements");
  const people = useC7<{ people: PersonFull[] }>("/admin/people");
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!form) return;
    if (form.title.trim().length < 2 || form.body.trim().length < 2) return toast.error("Add a title and a message");
    if (form.audience === "USER" && !form.targetUserId) return toast.error("Pick the member");
    setBusy(true);
    try {
      const body = JSON.stringify({ title: form.title, body: form.body, kind: form.kind, audience: form.audience, targetUserId: form.audience === "USER" ? form.targetUserId : null, pinned: form.pinned, expiresAt: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59+05:30`).toISOString() : null });
      if (form.id) await api(`/admin/announcements/${form.id}`, { method: "PUT", body });
      else await api("/admin/announcements", { method: "POST", body });
      toast.success(form.id ? "Updated" : "Posted — it's in the app now");
      setForm(null);
      q.reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const remove = async (a: Ann) => {
    if (!confirm(`Delete "${a.title}"?`)) return;
    await api(`/admin/announcements/${a.id}`, { method: "DELETE" }).then(() => (toast.success("Deleted"), q.reload())).catch((e) => toast.error((e as Error).message));
  };
  const now = Date.now();
  return (
    <>
      <PageHeader
        title="Announcements"
        description="Post timings, events, offers and closures. They appear in the app's Announcements screen, on Home and in notifications. Payment reminders sent from Billing show up here too."
        actions={<Button color="primary" startContent={<IconPlus size={16} />} onPress={() => setForm({ title: "", body: "", kind: "GENERAL", audience: "MEMBERS", targetUserId: "", pinned: false, expiresAt: "" })}>New announcement</Button>}
      />
      <LoadState loading={q.loading} error={q.error} onRetry={q.reload}>
        <div className="divide-y divide-divider rounded-lg border border-divider bg-content1">
          {(q.data?.announcements ?? []).length === 0 && <p className="p-6 text-sm text-foreground-500">Nothing posted yet.</p>}
          {(q.data?.announcements ?? []).map((a) => {
            const expired = !!a.expiresAt && new Date(a.expiresAt).getTime() < now;
            return (
              <div key={a.id} className={`flex gap-4 p-4 ${expired ? "opacity-50" : ""}`}>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {a.pinned && <IconPin size={14} className="text-primary" aria-label="Pinned" />}
                    <p className="font-medium">{a.title}</p>
                    <Chip size="sm" variant="flat">{KIND[a.kind]}</Chip>
                    <Chip size="sm" variant="dot" color={a.audience === "USER" ? "warning" : "default"}>{a.audience === "USER" ? a.target?.name ?? "One member" : AUD[a.audience]}</Chip>
                    {expired && <Chip size="sm" variant="flat">Expired</Chip>}
                  </div>
                  <p className="text-sm text-foreground-500 line-clamp-2">{a.body}</p>
                  <p className="text-xs text-foreground-400">{dateIN(a.publishedAt)}{a.expiresAt ? ` · until ${dateIN(a.expiresAt)}` : ""} · read by {a.reads}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button isIconOnly size="sm" variant="light" aria-label={`Edit ${a.title}`} onPress={() => setForm({ id: a.id, title: a.title, body: a.body, kind: a.kind, audience: a.audience, targetUserId: a.targetUserId ?? "", pinned: a.pinned, expiresAt: a.expiresAt ? a.expiresAt.slice(0, 10) : "" })}><IconEdit size={16} /></Button>
                  <Button isIconOnly size="sm" variant="light" aria-label={`Delete ${a.title}`} onPress={() => remove(a)}><IconTrash size={16} /></Button>
                </div>
              </div>
            );
          })}
        </div>
      </LoadState>

      <Modal isOpen={!!form} onClose={() => setForm(null)} size="2xl">
        <ModalContent>
          <ModalHeader>{form?.id ? "Edit announcement" : "New announcement"}</ModalHeader>
          <ModalBody>
            {form && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Title" className="md:col-span-2" value={form.title} onValueChange={(title) => setForm({ ...form, title })} maxLength={120} />
                <Textarea label="Message" className="md:col-span-2" value={form.body} onValueChange={(body) => setForm({ ...form, body })} minRows={4} maxLength={4000} />
                <Select label="Type" selectedKeys={[form.kind]} onSelectionChange={(k) => setForm({ ...form, kind: Array.from(k)[0] as Kind })}>
                  {(Object.keys(KIND) as Kind[]).map((k) => <SelectItem key={k}>{KIND[k]}</SelectItem>)}
                </Select>
                <Select label="Who sees it" selectedKeys={[form.audience]} onSelectionChange={(k) => setForm({ ...form, audience: Array.from(k)[0] as Audience })}>
                  {(Object.keys(AUD) as Audience[]).map((k) => <SelectItem key={k}>{AUD[k]}</SelectItem>)}
                </Select>
                {form.audience === "USER" && (
                  <Select label="Member" className="md:col-span-2" selectedKeys={form.targetUserId ? [form.targetUserId] : []} onSelectionChange={(k) => setForm({ ...form, targetUserId: String(Array.from(k)[0] ?? "") })}>
                    {(people.data?.people ?? []).filter((p) => p.role === "USER").map((p) => <SelectItem key={p.userId} textValue={p.name}>{p.name}{p.memberId ? ` · ${p.memberId}` : ""}</SelectItem>)}
                  </Select>
                )}
                <Input type="date" label="Hide after (optional)" value={form.expiresAt} onValueChange={(expiresAt) => setForm({ ...form, expiresAt })} />
                <Switch isSelected={form.pinned} onValueChange={(pinned) => setForm({ ...form, pinned })}>Pin to the top</Switch>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setForm(null)}>Cancel</Button>
            <Button color="primary" isLoading={busy} onPress={save}>{form?.id ? "Save" : "Post"}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
