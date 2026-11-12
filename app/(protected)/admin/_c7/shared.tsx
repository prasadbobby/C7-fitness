"use client";

import { Avatar, Button, Chip, Spinner } from "@nextui-org/react";
import { IconRefresh } from "@tabler/icons-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useC7Api } from "@/lib/c7Api";

/** Shared bits for the C7 admin pages that talk to c7-backend. Plain, dense, table-first. */

export type Person = { userId: string; name: string; email: string | null; imageUrl: string };
export type PersonFull = Person & { memberId: string | null; role: string; membershipStatus: string; membershipEndDate: string | null; nextPaymentDue: string | null; remainingAmount: number | null; isGuest: boolean };

export const inr = (n: number | null | undefined) => (n == null ? "—" : `₹${Math.round(n).toLocaleString("en-IN")}`);
export const inr2 = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const dateIN = (s: string | null | undefined) => (s ? new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");
export const todayIST = () => new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10);
export const monthIST = () => todayIST().slice(0, 7);
export const shiftMonth = (m: string, n: number) => {
  const [y, mo] = m.split("-").map(Number) as [number, number];
  const d = new Date(Date.UTC(y, mo - 1 + n, 1));
  return d.toISOString().slice(0, 7);
};
export const monthLabel = (m: string) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });

/** GET a c7-backend path with loading / error / reload state. */
export function useC7<T>(path: string | null) {
  const api = useC7Api();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    setError(null);
    try {
      setData(await api<T>(path));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [api, path]);
  useEffect(() => {
    load();
  }, [load]);
  return { data, error, loading, reload: load, setData };
}

export function PersonCell({ p, sub }: { p: Person; sub?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <Avatar src={p.imageUrl || undefined} name={p.name} size="sm" className="shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{p.name}</p>
        <p className="text-xs text-foreground-500 truncate">{sub ?? p.email ?? ""}</p>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <p className="text-sm text-foreground-500 mt-1 max-w-2xl">{description}</p>
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "warning" | "danger" | "success" }) {
  const color = tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : tone === "success" ? "text-success" : "text-foreground";
  return (
    <div className="rounded-lg border border-divider bg-content1 px-4 py-3">
      <p className="text-xs text-foreground-500">{label}</p>
      <p className={`text-2xl font-semibold tabular-nums mt-1 ${color}`}>{value}</p>
      {hint && <p className="text-xs text-foreground-400 mt-0.5">{hint}</p>}
    </div>
  );
}

export function LoadState({ loading, error, onRetry, empty, children }: { loading: boolean; error: string | null; onRetry: () => void; empty?: ReactNode; children: ReactNode }) {
  if (error)
    return (
      <div className="rounded-lg border border-danger-200 bg-danger-50/10 p-4 flex items-center justify-between gap-4">
        <p className="text-sm text-danger">{error}</p>
        <Button size="sm" variant="flat" startContent={<IconRefresh size={16} />} onPress={onRetry}>
          Retry
        </Button>
      </div>
    );
  if (loading && !children) return <Spinner className="my-8" />;
  return <>{empty ?? children}</>;
}

export const STATUS_COLOR: Record<string, "success" | "warning" | "danger" | "default" | "primary"> = {
  ACTIVE: "success", PAUSED: "warning", UPCOMING: "primary", EXPIRED: "danger", CANCELLED: "danger", SUSPENDED: "danger", INACTIVE: "default",
  NEW: "warning", CONTACTED: "primary", CONVERTED: "success", CLOSED: "default",
  PAID: "success", PARTIAL: "warning", DUE: "danger", VOID: "default",
  PRESENT: "success", ABSENT: "danger", LEAVE: "primary",
};
export const StatusChip = ({ s }: { s: string }) => (
  <Chip size="sm" variant="flat" color={STATUS_COLOR[s] ?? "default"} className="capitalize">
    {s.toLowerCase()}
  </Chip>
);

/** Reads a File as a data: URL (reports, images). */
export const readDataUrl = (f: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Couldn't read that file"));
    r.readAsDataURL(f);
  });
