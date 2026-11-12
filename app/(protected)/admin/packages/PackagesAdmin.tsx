"use client";

import { useMemo, useState } from "react";
import {
  Button, Chip, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, Switch, Tab,
  Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tabs, Textarea,
} from "@nextui-org/react";
import { IconArchive, IconEdit, IconPhoneCall, IconPlus, IconUserCheck, IconX } from "@tabler/icons-react";
import { toast } from "sonner";
import { useC7Api } from "@/lib/c7Api";
import { dateIN, inr, LoadState, PageHeader, PersonCell, Stat, StatusChip, todayIST, useC7, type Person, type PersonFull } from "../_c7/shared";

type Pkg = {
  id: string; name: string; mode: "ONLINE" | "OFFLINE"; durationDays: number; price: number; offerPrice: number | null; description: string | null;
  features: string[]; imageUrl: string | null; highlight: boolean; isActive: boolean; sortOrder: number; perMonth: number; enquiries: { open: number; converted: number };
};
type Enquiry = { id: string; userId: string; phone: string | null; message: string | null; status: string; createdAt: string; packageId: string; packageName: string; mode: string; durationDays: number; price: number; offerPrice: number | null; person: Person };

export default function PackagesAdmin() {
  const enq = useC7<{ enquiries: Enquiry[]; newCount: number }>("/admin/enquiries?status=OPEN");
  return (
    <>
      <PageHeader title="Packages & sign-ups" description="Packages shown in the C7 app. Anyone can sign up and browse them; their requests land here. Converting a request enrols the person and unlocks the full app." />
      <Tabs aria-label="Packages admin" color="primary" variant="underlined" classNames={{ panel: "pt-4" }}>
        <Tab key="packages" title="Packages"><PackagesPanel /></Tab>
        <Tab key="requests" title={<span className="flex items-center gap-2">Requests{enq.data?.newCount ? <Chip size="sm" color="warning" variant="solid">{enq.data.newCount}</Chip> : null}</span>}><RequestsPanel onChange={enq.reload} /></Tab>
        <Tab key="guests" title="Guests"><GuestsPanel /></Tab>
      </Tabs>
    </>
  );
}

const blank = (): Omit<Pkg, "id" | "perMonth" | "enquiries"> => ({ name: "", mode: "OFFLINE", durationDays: 90, price: 0, offerPrice: null, description: "", features: [], imageUrl: null, highlight: false, isActive: true, sortOrder: 0 });

function PackagesPanel() {
  const api = useC7Api();
  const q = useC7<{ packages: Pkg[] }>("/admin/packages");
  const [edit, setEdit] = useState<(Omit<Pkg, "id" | "perMonth" | "enquiries"> & { id?: string }) | null>(null);
  const [features, setFeatures] = useState("");
  const [busy, setBusy] = useState(false);

  const open = (p?: Pkg) => {
    setEdit(p ? { ...p } : blank());
    setFeatures((p?.features ?? []).join("\n"));
  };
  const save = async () => {
    if (!edit) return;
    const body = { ...edit, features: features.split("\n").map((s) => s.trim()).filter(Boolean), offerPrice: edit.offerPrice || null, description: edit.description || null };
    if (body.name.trim().length < 2) return toast.error("Give the package a name");
    if (!body.price || body.price <= 0) return toast.error("Enter a price");
    if (body.offerPrice && body.offerPrice > body.price) return toast.error("Offer price can't be higher than the price");
    setBusy(true);
    try {
      const { id, ...rest } = body as typeof body & { id?: string; perMonth?: number; enquiries?: unknown };
      delete (rest as { perMonth?: number }).perMonth;
      delete (rest as { enquiries?: unknown }).enquiries;
      if (id) await api(`/admin/packages/${id}`, { method: "PUT", body: JSON.stringify(rest) });
      else await api("/admin/packages", { method: "POST", body: JSON.stringify(rest) });
      toast.success(id ? "Package updated" : "Package created");
      setEdit(null);
      q.reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const remove = async (p: Pkg) => {
    if (!confirm(`Remove "${p.name}"? Packages with requests or invoices are archived instead of deleted.`)) return;
    try {
      const r = await api<{ archived: boolean }>(`/admin/packages/${p.id}`, { method: "DELETE" });
      toast.success(r.archived ? "Archived — hidden from the app, history kept" : "Deleted");
      q.reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  const list = q.data?.packages ?? [];
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-foreground-500">{list.filter((p) => p.isActive).length} live · {list.filter((p) => !p.isActive).length} hidden</p>
        <Button color="primary" startContent={<IconPlus size={16} />} onPress={() => open()}>New package</Button>
      </div>
      <LoadState loading={q.loading} error={q.error} onRetry={q.reload}>
        <Table aria-label="Packages" removeWrapper>
          <TableHeader>
            <TableColumn>PACKAGE</TableColumn>
            <TableColumn>TYPE</TableColumn>
            <TableColumn>DURATION</TableColumn>
            <TableColumn className="text-right">PRICE</TableColumn>
            <TableColumn>REQUESTS</TableColumn>
            <TableColumn>STATUS</TableColumn>
            <TableColumn> </TableColumn>
          </TableHeader>
          <TableBody emptyContent="No packages yet. Create one and it appears in the app straight away.">
            {list.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <p className="font-medium">{p.name}{p.highlight && <span className="ml-2 text-xs text-primary">Most chosen</span>}</p>
                  <p className="text-xs text-foreground-500 line-clamp-1">{p.features.join(" · ")}</p>
                </TableCell>
                <TableCell>{p.mode === "ONLINE" ? "Online" : "Studio"}</TableCell>
                <TableCell className="tabular-nums">{p.durationDays} days</TableCell>
                <TableCell className="text-right tabular-nums">
                  {inr(p.offerPrice ?? p.price)}
                  {p.offerPrice != null && <span className="block text-xs text-foreground-400 line-through">{inr(p.price)}</span>}
                </TableCell>
                <TableCell className="tabular-nums">{p.enquiries.open} open · {p.enquiries.converted} joined</TableCell>
                <TableCell>{p.isActive ? <Chip size="sm" color="success" variant="flat">Live</Chip> : <Chip size="sm" variant="flat">Hidden</Chip>}</TableCell>
                <TableCell>
                  <div className="flex gap-1 justify-end">
                    <Button isIconOnly size="sm" variant="light" aria-label={`Edit ${p.name}`} onPress={() => open(p)}><IconEdit size={16} /></Button>
                    <Button isIconOnly size="sm" variant="light" aria-label={`Remove ${p.name}`} onPress={() => remove(p)}><IconArchive size={16} /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </LoadState>

      <Modal isOpen={!!edit} onClose={() => setEdit(null)} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>{edit?.id ? "Edit package" : "New package"}</ModalHeader>
          <ModalBody>
            {edit && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Name" value={edit.name} onValueChange={(name) => setEdit({ ...edit, name })} className="md:col-span-2" isRequired />
                <Select label="Type" selectedKeys={[edit.mode]} onSelectionChange={(k) => setEdit({ ...edit, mode: Array.from(k)[0] as Pkg["mode"] })}>
                  <SelectItem key="OFFLINE">At the studio</SelectItem>
                  <SelectItem key="ONLINE">Online coaching</SelectItem>
                </Select>
                <Input label="Duration (days)" type="number" value={String(edit.durationDays)} onValueChange={(v) => setEdit({ ...edit, durationDays: Number(v) || 0 })} description="30 = 1 month · 90 = 3 months · 365 = 1 year" />
                <Input label="Price (₹)" type="number" value={edit.price ? String(edit.price) : ""} onValueChange={(v) => setEdit({ ...edit, price: Number(v) || 0 })} isRequired />
                <Input label="Offer price (₹)" type="number" value={edit.offerPrice ? String(edit.offerPrice) : ""} onValueChange={(v) => setEdit({ ...edit, offerPrice: v ? Number(v) : null })} description="Optional — shown with the regular price struck through" />
                <Textarea label="Description" value={edit.description ?? ""} onValueChange={(description) => setEdit({ ...edit, description })} className="md:col-span-2" minRows={2} />
                <Textarea label="What's included (one per line)" value={features} onValueChange={setFeatures} className="md:col-span-2" minRows={3} />
                <Input label="Sort order" type="number" value={String(edit.sortOrder)} onValueChange={(v) => setEdit({ ...edit, sortOrder: Number(v) || 0 })} description="Lower numbers show first" />
                <div className="flex flex-col gap-3 justify-center">
                  <Switch isSelected={edit.highlight} onValueChange={(highlight) => setEdit({ ...edit, highlight })}>Mark as “Most chosen”</Switch>
                  <Switch isSelected={edit.isActive} onValueChange={(isActive) => setEdit({ ...edit, isActive })}>Show in the app</Switch>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setEdit(null)}>Cancel</Button>
            <Button color="primary" isLoading={busy} onPress={save}>Save</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

function RequestsPanel({ onChange }: { onChange: () => void }) {
  const api = useC7Api();
  const [status, setStatus] = useState("OPEN");
  const q = useC7<{ enquiries: Enquiry[] }>(`/admin/enquiries?status=${status}`);
  const [convert, setConvert] = useState<Enquiry | null>(null);
  const [start, setStart] = useState(todayIST());
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);

  const set = async (e: Enquiry, s: string) => {
    try {
      await api(`/admin/enquiries/${e.id}`, { method: "PATCH", body: JSON.stringify({ status: s }) });
      toast.success(s === "CONTACTED" ? "Marked as contacted" : "Request closed");
      q.reload();
      onChange();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };
  const doConvert = async () => {
    if (!convert) return;
    setBusy(true);
    try {
      await api(`/admin/enquiries/${convert.id}/convert`, { method: "POST", body: JSON.stringify({ startDate: start, ...(price ? { price: Number(price) } : {}) }) });
      toast.success(`${convert.person.name} is now a member — their full app is unlocked`);
      setConvert(null);
      q.reload();
      onChange();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-4">
      <Tabs size="sm" aria-label="Request status" selectedKey={status} onSelectionChange={(k) => setStatus(String(k))}>
        <Tab key="OPEN" title="Open" />
        <Tab key="CONVERTED" title="Joined" />
        <Tab key="CLOSED" title="Closed" />
      </Tabs>
      <LoadState loading={q.loading} error={q.error} onRetry={q.reload}>
        <Table aria-label="Package requests" removeWrapper>
          <TableHeader>
            <TableColumn>PERSON</TableColumn>
            <TableColumn>PACKAGE</TableColumn>
            <TableColumn>PHONE</TableColumn>
            <TableColumn>NOTE</TableColumn>
            <TableColumn>RECEIVED</TableColumn>
            <TableColumn>STATUS</TableColumn>
            <TableColumn> </TableColumn>
          </TableHeader>
          <TableBody emptyContent={status === "OPEN" ? "No open requests. New ones from the app appear here." : "Nothing here yet."}>
            {(q.data?.enquiries ?? []).map((e) => (
              <TableRow key={e.id}>
                <TableCell><PersonCell p={e.person} /></TableCell>
                <TableCell>
                  <p className="text-sm">{e.packageName}</p>
                  <p className="text-xs text-foreground-500">{e.durationDays} days · {inr(e.offerPrice ?? e.price)}</p>
                </TableCell>
                <TableCell>{e.phone ? <a className="text-primary text-sm" href={`tel:${e.phone}`}>{e.phone}</a> : <span className="text-foreground-400 text-sm">—</span>}</TableCell>
                <TableCell><p className="text-sm max-w-xs line-clamp-2">{e.message ?? "—"}</p></TableCell>
                <TableCell className="text-sm">{dateIN(e.createdAt)}</TableCell>
                <TableCell><StatusChip s={e.status} /></TableCell>
                <TableCell>
                  {(e.status === "NEW" || e.status === "CONTACTED") && (
                    <div className="flex gap-1 justify-end">
                      {e.status === "NEW" && <Button size="sm" variant="flat" startContent={<IconPhoneCall size={14} />} onPress={() => set(e, "CONTACTED")}>Contacted</Button>}
                      <Button size="sm" color="primary" startContent={<IconUserCheck size={14} />} onPress={() => (setConvert(e), setStart(todayIST()), setPrice(""))}>Enrol</Button>
                      <Button isIconOnly size="sm" variant="light" aria-label="Close request" onPress={() => set(e, "CLOSED")}><IconX size={16} /></Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </LoadState>
      <Modal isOpen={!!convert} onClose={() => setConvert(null)}>
        <ModalContent>
          <ModalHeader>Enrol {convert?.person.name}</ModalHeader>
          <ModalBody>
            <p className="text-sm text-foreground-500">Starts a {convert?.durationDays}-day {convert?.packageName} membership and unlocks the full C7 app. Record the payment in Payment info as usual, then generate the invoice from Billing.</p>
            <Input type="date" label="Start date" value={start} onValueChange={setStart} />
            <Input type="number" label="Agreed price (₹)" placeholder={String(convert?.offerPrice ?? convert?.price ?? "")} value={price} onValueChange={setPrice} description="Leave empty to use the package price" />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setConvert(null)}>Cancel</Button>
            <Button color="primary" isLoading={busy} onPress={doConvert}>Enrol & unlock app</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

function GuestsPanel() {
  const q = useC7<{ people: PersonFull[] }>("/admin/people");
  const guests = useMemo(() => (q.data?.people ?? []).filter((p) => p.isGuest), [q.data]);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Guests" value={guests.length} hint="Signed up, not enrolled" />
      </div>
      <LoadState loading={q.loading} error={q.error} onRetry={q.reload}>
        <Table aria-label="Guests" removeWrapper>
          <TableHeader>
            <TableColumn>PERSON</TableColumn>
            <TableColumn>ACCESS</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No guests. People who sign up in the app without an invite appear here.">
            {guests.map((g) => (
              <TableRow key={g.userId}>
                <TableCell><PersonCell p={g} /></TableCell>
                <TableCell className="text-sm text-foreground-500">Packages only — enrol them from a request, or set a membership in Users.</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </LoadState>
    </div>
  );
}
