"use client";

import { useState } from "react";
import {
  Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, Tab, Table, TableBody,
  TableCell, TableColumn, TableHeader, TableRow, Tabs, Textarea,
} from "@nextui-org/react";
import { IconBellRinging, IconChevronLeft, IconChevronRight, IconFileInvoice, IconPlus, IconPrinter } from "@tabler/icons-react";
import { toast } from "sonner";
import { useC7Api } from "@/lib/c7Api";
import { dateIN, inr, inr2, LoadState, monthIST, monthLabel, PageHeader, PersonCell, shiftMonth, Stat, StatusChip, todayIST, useC7, type Person, type PersonFull } from "../_c7/shared";

type Monthly = {
  month: string;
  summary: { collected: number; payments: number; outstanding: number; dueMembers: number; expiring: number };
  payments: { id: string; amount: number; paymentDate: string; paymentMethod: string; userId: string; person: Person; invoice: { id: string; number: string } | null }[];
  dues: { userId: string; nextPaymentDue: string | null; remainingAmount: number | null; person: Person; overdue: boolean }[];
  expiring: { userId: string; membershipEndDate: string; membershipStatus: string; person: Person }[];
};
type InvoiceRow = { id: string; number: string; userId: string; description: string; total: number; amountPaid: number; status: string; issuedAt: string; dueDate: string | null; person: Person };
type Invoice = InvoiceRow & { subtotal: number; taxPercent: number; taxAmount: number; discount: number; balance: number; paymentMethod: string | null; periodStart: string | null; periodEnd: string | null; notes: string | null; billTo: { name: string; email: string | null; memberId: string | null }; gym: { name: string; address: string; phone: string; email: string; gstin: string } };

export default function BillingAdmin() {
  const [month, setMonth] = useState(monthIST());
  return (
    <>
      <PageHeader
        title="Billing"
        description="Monthly collections, dues and renewals, with numbered invoices members can open and download in the C7 app. Payments are still recorded in Payment info."
        actions={
          <div className="flex items-center gap-1">
            <Button isIconOnly variant="flat" size="sm" aria-label="Previous month" onPress={() => setMonth(shiftMonth(month, -1))}><IconChevronLeft size={16} /></Button>
            <span className="text-sm font-medium w-36 text-center">{monthLabel(month)}</span>
            <Button isIconOnly variant="flat" size="sm" aria-label="Next month" isDisabled={month >= monthIST()} onPress={() => setMonth(shiftMonth(month, 1))}><IconChevronRight size={16} /></Button>
          </div>
        }
      />
      <Tabs aria-label="Billing" color="primary" variant="underlined" classNames={{ panel: "pt-4" }}>
        <Tab key="month" title="This month"><MonthPanel month={month} /></Tab>
        <Tab key="invoices" title="Invoices"><InvoicesPanel month={month} /></Tab>
      </Tabs>
    </>
  );
}

function MonthPanel({ month }: { month: string }) {
  const api = useC7Api();
  const q = useC7<Monthly>(`/admin/payments/monthly?month=${month}`);
  const [gst, setGst] = useState("0");
  const [busy, setBusy] = useState<string | null>(null);
  const run = async (key: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(key);
    try {
      await fn();
      toast.success(ok);
      q.reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };
  const d = q.data;
  return (
    <LoadState loading={q.loading} error={q.error} onRetry={q.reload}>
      {d && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Collected" value={inr(d.summary.collected)} hint={`${d.summary.payments} payments`} tone="success" />
            <Stat label="Outstanding" value={inr(d.summary.outstanding)} hint={`${d.summary.dueMembers} members`} tone={d.summary.outstanding ? "warning" : undefined} />
            <Stat label="Packages ending" value={d.summary.expiring} hint="this month" />
            <Stat label="Invoiced" value={`${d.payments.filter((p) => p.invoice).length}/${d.payments.length}`} hint="payments with an invoice" />
          </div>

          <section className="space-y-3">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-semibold">Payments received</h2>
              <Select size="sm" label="GST on new invoices" className="max-w-[180px]" selectedKeys={[gst]} onSelectionChange={(k) => setGst(String(Array.from(k)[0]))}>
                <SelectItem key="0">No GST</SelectItem>
                <SelectItem key="5">5%</SelectItem>
                <SelectItem key="12">12%</SelectItem>
                <SelectItem key="18">18%</SelectItem>
              </Select>
            </div>
            <Table aria-label="Payments" removeWrapper>
              <TableHeader>
                <TableColumn>MEMBER</TableColumn>
                <TableColumn>DATE</TableColumn>
                <TableColumn>METHOD</TableColumn>
                <TableColumn className="text-right">AMOUNT</TableColumn>
                <TableColumn>INVOICE</TableColumn>
              </TableHeader>
              <TableBody emptyContent="No payments recorded this month.">
                {d.payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell><PersonCell p={p.person} /></TableCell>
                    <TableCell className="text-sm">{dateIN(p.paymentDate)}</TableCell>
                    <TableCell className="text-sm">{p.paymentMethod.replace(/_/g, " ").toLowerCase()}</TableCell>
                    <TableCell className="text-right tabular-nums">{inr(p.amount)}</TableCell>
                    <TableCell>
                      {p.invoice ? (
                        <span className="text-sm text-foreground-500">{p.invoice.number}</span>
                      ) : (
                        <Button size="sm" variant="flat" startContent={<IconFileInvoice size={14} />} isLoading={busy === p.id} onPress={() => run(p.id, () => api(`/admin/invoices/from-payment/${p.id}`, { method: "POST", body: JSON.stringify({ taxPercent: Number(gst) }) }), "Invoice created — visible in the member's app")}>
                          Generate
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold">Dues</h2>
            <Table aria-label="Dues" removeWrapper>
              <TableHeader>
                <TableColumn>MEMBER</TableColumn>
                <TableColumn>DUE DATE</TableColumn>
                <TableColumn className="text-right">BALANCE</TableColumn>
                <TableColumn> </TableColumn>
              </TableHeader>
              <TableBody emptyContent="No outstanding balances.">
                {d.dues.map((x) => (
                  <TableRow key={x.userId}>
                    <TableCell><PersonCell p={x.person} /></TableCell>
                    <TableCell className={`text-sm ${x.overdue ? "text-danger" : ""}`}>{x.nextPaymentDue ? `${dateIN(x.nextPaymentDue)}${x.overdue ? " · overdue" : ""}` : "Not set"}</TableCell>
                    <TableCell className="text-right tabular-nums">{inr(x.remainingAmount)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button size="sm" variant="flat" startContent={<IconBellRinging size={14} />} isLoading={busy === `pay-${x.userId}`} onPress={() => run(`pay-${x.userId}`, () => api(`/admin/payments/remind/${x.userId}`, { method: "POST", body: JSON.stringify({ kind: "PAYMENT" }) }), `Reminder sent to ${x.person.name}`)}>
                          Remind
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold">Packages ending this month</h2>
            <Table aria-label="Renewals" removeWrapper>
              <TableHeader>
                <TableColumn>MEMBER</TableColumn>
                <TableColumn>ENDS</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn> </TableColumn>
              </TableHeader>
              <TableBody emptyContent="No packages end this month.">
                {d.expiring.map((x) => (
                  <TableRow key={x.userId}>
                    <TableCell><PersonCell p={x.person} /></TableCell>
                    <TableCell className="text-sm">{dateIN(x.membershipEndDate)}</TableCell>
                    <TableCell><StatusChip s={x.membershipStatus} /></TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button size="sm" variant="flat" startContent={<IconBellRinging size={14} />} isLoading={busy === `ren-${x.userId}`} onPress={() => run(`ren-${x.userId}`, () => api(`/admin/payments/remind/${x.userId}`, { method: "POST", body: JSON.stringify({ kind: "RENEWAL" }) }), `Renewal reminder sent to ${x.person.name}`)}>
                          Renewal reminder
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
          <p className="text-xs text-foreground-400">When a package ends, the member's app switches to a renew screen automatically — they keep access to packages, invoices and announcements.</p>
        </div>
      )}
    </LoadState>
  );
}

function InvoicesPanel({ month }: { month: string }) {
  const api = useC7Api();
  const q = useC7<{ invoices: InvoiceRow[] }>(`/admin/invoices?month=${month}`);
  const people = useC7<{ people: PersonFull[] }>("/admin/people");
  const [form, setForm] = useState<null | { userId: string; description: string; subtotal: string; taxPercent: string; discount: string; amountPaid: string; paymentMethod: string; dueDate: string; notes: string }>(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<Invoice | null>(null);

  const create = async () => {
    if (!form) return;
    if (!form.userId) return toast.error("Pick a member");
    if (!Number(form.subtotal)) return toast.error("Enter the amount");
    setBusy(true);
    try {
      const r = await api<{ number: string }>("/admin/invoices", {
        method: "POST",
        body: JSON.stringify({ userId: form.userId, description: form.description || "C7 membership", subtotal: Number(form.subtotal), taxPercent: Number(form.taxPercent) || 0, discount: Number(form.discount) || 0, amountPaid: Number(form.amountPaid) || 0, paymentMethod: form.paymentMethod || null, dueDate: form.dueDate || null, notes: form.notes || null }),
      });
      toast.success(`Invoice ${r.number} created`);
      setForm(null);
      q.reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const openInvoice = async (id: string) => {
    try {
      setView((await api<{ invoice: Invoice }>(`/admin/invoices/${id}`)).invoice);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  const settle = async (i: Invoice) => {
    try {
      await api(`/admin/invoices/${i.id}`, { method: "PATCH", body: JSON.stringify({ amountPaid: i.total }) });
      toast.success("Marked as paid");
      setView(null);
      q.reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  const voidIt = async (i: Invoice) => {
    if (!confirm(`Void ${i.number}? It disappears from the member's app.`)) return;
    await api(`/admin/invoices/${i.id}`, { method: "PATCH", body: JSON.stringify({ void: true }) }).then(() => (toast.success("Invoice voided"), setView(null), q.reload())).catch((e) => toast.error((e as Error).message));
  };
  const total = form ? Math.max(0, (Number(form.subtotal) || 0) - (Number(form.discount) || 0)) * (1 + (Number(form.taxPercent) || 0) / 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-foreground-500">{q.data?.invoices.length ?? 0} invoices issued in {monthLabel(month)}</p>
        <Button color="primary" startContent={<IconPlus size={16} />} onPress={() => setForm({ userId: "", description: "", subtotal: "", taxPercent: "0", discount: "", amountPaid: "", paymentMethod: "UPI", dueDate: todayIST(), notes: "" })}>New invoice</Button>
      </div>
      <LoadState loading={q.loading} error={q.error} onRetry={q.reload}>
        <Table aria-label="Invoices" removeWrapper selectionMode="none">
          <TableHeader>
            <TableColumn>NUMBER</TableColumn>
            <TableColumn>MEMBER</TableColumn>
            <TableColumn>FOR</TableColumn>
            <TableColumn>ISSUED</TableColumn>
            <TableColumn className="text-right">TOTAL</TableColumn>
            <TableColumn>STATUS</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No invoices this month.">
            {(q.data?.invoices ?? []).map((i) => (
              <TableRow key={i.id} className="cursor-pointer" onClick={() => openInvoice(i.id)}>
                <TableCell className="font-mono text-sm">{i.number}</TableCell>
                <TableCell><PersonCell p={i.person} /></TableCell>
                <TableCell className="text-sm">{i.description}</TableCell>
                <TableCell className="text-sm">{dateIN(i.issuedAt)}</TableCell>
                <TableCell className="text-right tabular-nums">{inr(i.total)}</TableCell>
                <TableCell><StatusChip s={i.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </LoadState>

      <Modal isOpen={!!form} onClose={() => setForm(null)} size="2xl">
        <ModalContent>
          <ModalHeader>New invoice</ModalHeader>
          <ModalBody>
            {form && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select label="Member" className="md:col-span-2" selectedKeys={form.userId ? [form.userId] : []} onSelectionChange={(k) => setForm({ ...form, userId: String(Array.from(k)[0] ?? "") })} isLoading={people.loading}>
                  {(people.data?.people ?? []).filter((p) => p.role === "USER").map((p) => (
                    <SelectItem key={p.userId} textValue={p.name}>{p.name}{p.memberId ? ` · ${p.memberId}` : ""}</SelectItem>
                  ))}
                </Select>
                <Input label="Description" className="md:col-span-2" placeholder="C7 membership — 90 days" value={form.description} onValueChange={(description) => setForm({ ...form, description })} />
                <Input label="Amount before tax (₹)" type="number" value={form.subtotal} onValueChange={(subtotal) => setForm({ ...form, subtotal })} />
                <Input label="Discount (₹)" type="number" value={form.discount} onValueChange={(discount) => setForm({ ...form, discount })} />
                <Select label="GST" selectedKeys={[form.taxPercent]} onSelectionChange={(k) => setForm({ ...form, taxPercent: String(Array.from(k)[0]) })}>
                  <SelectItem key="0">No GST</SelectItem>
                  <SelectItem key="5">5%</SelectItem>
                  <SelectItem key="12">12%</SelectItem>
                  <SelectItem key="18">18%</SelectItem>
                </Select>
                <Input label="Paid so far (₹)" type="number" value={form.amountPaid} onValueChange={(amountPaid) => setForm({ ...form, amountPaid })} />
                <Select label="Method" selectedKeys={[form.paymentMethod]} onSelectionChange={(k) => setForm({ ...form, paymentMethod: String(Array.from(k)[0]) })}>
                  {["UPI", "CASH", "CARD", "BANK_TRANSFER", "CHEQUE"].map((m) => <SelectItem key={m}>{m.replace("_", " ")}</SelectItem>)}
                </Select>
                <Input label="Due date" type="date" value={form.dueDate} onValueChange={(dueDate) => setForm({ ...form, dueDate })} />
                <Textarea label="Notes (printed on the invoice)" className="md:col-span-2" value={form.notes} onValueChange={(notes) => setForm({ ...form, notes })} minRows={2} />
                <p className="md:col-span-2 text-sm text-foreground-500">Total <span className="font-semibold text-foreground tabular-nums">{inr2(Math.round(total * 100) / 100)}</span></p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setForm(null)}>Cancel</Button>
            <Button color="primary" isLoading={busy} onPress={create}>Create invoice</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={!!view} onClose={() => setView(null)} size="2xl">
        <ModalContent>
          <ModalHeader className="flex items-center gap-3">{view?.number} {view && <StatusChip s={view.status} />}</ModalHeader>
          <ModalBody>
            {view && (
              <div id="c7-invoice" className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <div><p className="text-foreground-500">Billed to</p><p className="font-medium">{view.billTo.name}</p>{view.billTo.memberId && <p className="text-foreground-500">{view.billTo.memberId}</p>}</div>
                  <div className="text-right"><p className="text-foreground-500">Issued {dateIN(view.issuedAt)}</p>{view.dueDate && <p className="text-foreground-500">Due {dateIN(view.dueDate)}</p>}</div>
                </div>
                <div className="border-t border-divider pt-3 flex justify-between"><span>{view.description}</span><span className="tabular-nums">{inr2(view.subtotal)}</span></div>
                {!!view.discount && <div className="flex justify-between text-foreground-500"><span>Discount</span><span className="tabular-nums">− {inr2(view.discount)}</span></div>}
                {!!view.taxPercent && <div className="flex justify-between text-foreground-500"><span>GST {view.taxPercent}%</span><span className="tabular-nums">{inr2(view.taxAmount)}</span></div>}
                <div className="flex justify-between font-semibold border-t border-divider pt-3"><span>Total</span><span className="tabular-nums">{inr2(view.total)}</span></div>
                <div className="flex justify-between text-foreground-500"><span>Paid{view.paymentMethod ? ` · ${view.paymentMethod}` : ""}</span><span className="tabular-nums">{inr2(view.amountPaid)}</span></div>
                <div className="flex justify-between font-medium"><span>Balance</span><span className="tabular-nums">{inr2(view.balance)}</span></div>
                {view.notes && <p className="text-foreground-500">{view.notes}</p>}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            {view && view.status !== "VOID" && <Button variant="light" color="danger" onPress={() => voidIt(view)}>Void</Button>}
            {view && view.balance > 0 && view.status !== "VOID" && <Button variant="flat" onPress={() => settle(view)}>Mark fully paid</Button>}
            <Button variant="flat" startContent={<IconPrinter size={16} />} onPress={() => window.print()}>Print</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
