"use client";

import { Avatar, Button, Card, CardBody, CardHeader, Chip, Spinner } from "@nextui-org/react";
import { IconCheck, IconUserPlus, IconX } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type Request = { id: string; userId: string; requestedAt: string; challenge: { id: string; title: string }; user: { firstName: string; lastName: string; email: string; imageUrl: string } };

/** Members who tapped "Request to join" in the C7 mobile app. */
export function JoinRequests({ onChange, challengeId, compact }: { onChange?: () => void; challengeId?: string; compact?: boolean }) {
  const [list, setList] = useState<Request[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/ninety-day-challenge/requests", { cache: "no-store" });
    if (r.ok) setList(((await r.json()).requests as Request[]).filter((x) => !challengeId || x.challenge.id === challengeId));
    else setList([]);
  }, [challengeId]);
  useEffect(() => {
    load();
  }, [load]);

  const act = async (req: Request, approve: boolean) => {
    setBusy(req.id);
    const r = await fetch(`/api/admin/ninety-day-challenge/participants/${req.id}`, approve ? { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isEnabled: true }) } : { method: "DELETE" });
    setBusy(null);
    if (!r.ok) return toast.error("Couldn't update the request. Try again.");
    toast.success(approve ? `${req.user.firstName} can now post in ${req.challenge.title}` : "Request declined");
    setList((l) => l?.filter((x) => x.id !== req.id) ?? null);
    onChange?.();
    window.dispatchEvent(new Event("c7:challenge-requests"));
  };

  if (list === null) return compact ? null : <Card shadow="none" className="border border-divider"><CardBody className="py-8 flex items-center"><Spinner size="sm" /></CardBody></Card>;
  if (compact && list.length === 0) return null;

  return (
    <Card shadow="none" className="border border-divider">
      <CardHeader className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <IconUserPlus size={20} className="text-primary" />
          <div>
            <p className="font-semibold text-foreground">Join requests</p>
            <p className="text-xs text-foreground-500">Members asking to join from the mobile app</p>
          </div>
        </div>
        <Chip size="sm" variant="flat" color={list.length ? "warning" : "default"}>
          {list.length} pending
        </Chip>
      </CardHeader>
      <CardBody className="px-5 pb-5 pt-0">
        {list.length === 0 ? (
          <p className="text-sm text-foreground-500 py-2">No pending requests.</p>
        ) : (
          <ul className="divide-y divide-divider">
            {list.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-3">
                <Avatar src={r.user.imageUrl || undefined} name={`${r.user.firstName} ${r.user.lastName}`} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {r.user.firstName} {r.user.lastName}
                  </p>
                  <p className="text-xs text-foreground-500 truncate">
                    {r.challenge.title} · {new Date(r.requestedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                  </p>
                </div>
                <Button size="sm" variant="light" isIconOnly aria-label="Decline" isDisabled={busy === r.id} onPress={() => act(r, false)}>
                  <IconX size={16} />
                </Button>
                <Button size="sm" color="primary" startContent={<IconCheck size={16} />} isLoading={busy === r.id} onPress={() => act(r, true)}>
                  Approve
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
