"use client";

import { useRef, useState } from "react";
import { Button, Chip, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Progress, Select, SelectItem, Switch, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Textarea } from "@nextui-org/react";
import { IconEdit, IconPlus, IconTrash, IconUpload } from "@tabler/icons-react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { C7_API_URL, useC7Api } from "@/lib/c7Api";
import { LoadState, PageHeader, useC7 } from "../_c7/shared";

const CATS = ["warmup", "strength", "cardio", "mobility", "core", "other"] as const;
type Video = { id: string; title: string; description: string | null; category: (typeof CATS)[number]; videoUrl: string; thumbnailUrl: string | null; durationSec: number; sizeBytes: number; isAnimated: boolean; isPublished: boolean; sortOrder: number; updatedAt: string };
type Form = Omit<Video, "id" | "updatedAt"> & { id?: string };
const blank = (): Form => ({ title: "", description: "", category: "strength", videoUrl: "", thumbnailUrl: null, durationSec: 0, sizeBytes: 0, isAnimated: false, isPublished: true, sortOrder: 0 });
const mb = (b: number) => (b ? `${(b / 1048576).toFixed(1)} MB` : "—");
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** Reads duration from the file before upload so members see it in the list. */
const durationOf = (f: File) =>
  new Promise<number>((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => (resolve(Math.round(v.duration || 0)), URL.revokeObjectURL(v.src));
    v.onerror = () => resolve(0);
    v.src = URL.createObjectURL(f);
  });

export default function VideosAdmin() {
  const api = useC7Api();
  const { getToken } = useAuth();
  const q = useC7<{ videos: Video[] }>("/admin/videos");
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (f: File) => {
    if (!form) return;
    if (!["video/mp4", "video/webm", "video/quicktime"].includes(f.type)) return toast.error("Use an MP4, WebM or MOV file");
    const durationSec = await durationOf(f);
    const token = await getToken();
    setProgress(0);
    // XHR for upload progress (fetch has none).
    const res = await new Promise<{ url: string; sizeBytes: number }>((resolve, reject) => {
      const x = new XMLHttpRequest();
      x.open("POST", `${C7_API_URL}/v1/admin/videos/upload`);
      if (token) x.setRequestHeader("Authorization", `Bearer ${token}`);
      x.upload.onprogress = (e) => e.lengthComputable && setProgress(e.loaded / e.total);
      x.onload = () => {
        const j = JSON.parse(x.responseText || "{}");
        x.status < 300 ? resolve(j) : reject(new Error(j.error ?? `Upload failed (${x.status})`));
      };
      x.onerror = () => reject(new Error("Upload failed — check your connection"));
      const fd = new FormData();
      fd.append("file", f);
      x.send(fd);
    }).finally(() => setProgress(null));
    setForm((cur) => (cur ? { ...cur, videoUrl: res.url, sizeBytes: res.sizeBytes, durationSec: durationSec || cur.durationSec, title: cur.title || f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ") } : cur));
    toast.success("Uploaded");
  };
  const save = async () => {
    if (!form) return;
    if (form.title.trim().length < 2) return toast.error("Add a title");
    if (!/^https?:\/\//.test(form.videoUrl)) return toast.error("Upload a file or paste a direct video link (https://…mp4)");
    setBusy(true);
    try {
      const { id, ...rest } = form;
      const body = JSON.stringify({ ...rest, description: rest.description || null });
      if (id) await api(`/admin/videos/${id}`, { method: "PUT", body });
      else await api("/admin/videos", { method: "POST", body });
      toast.success(id ? "Saved" : "Published to the app");
      setForm(null);
      q.reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const remove = async (v: Video) => {
    if (!confirm(`Delete "${v.title}"? Members who downloaded it keep their copy until they remove it.`)) return;
    await api(`/admin/videos/${v.id}`, { method: "DELETE" }).then(() => (toast.success("Deleted"), q.reload())).catch((e) => toast.error((e as Error).message));
  };
  return (
    <>
      <PageHeader title="Workout videos" description="Form videos and animated exercise demos for the C7 app. Members can download them on their phone to watch offline at the gym." actions={<Button color="primary" startContent={<IconPlus size={16} />} onPress={() => setForm(blank())}>Add video</Button>} />
      <LoadState loading={q.loading} error={q.error} onRetry={q.reload}>
        <Table aria-label="Videos" removeWrapper>
          <TableHeader>
            <TableColumn>VIDEO</TableColumn>
            <TableColumn>CATEGORY</TableColumn>
            <TableColumn>LENGTH</TableColumn>
            <TableColumn>SIZE</TableColumn>
            <TableColumn>STATUS</TableColumn>
            <TableColumn> </TableColumn>
          </TableHeader>
          <TableBody emptyContent="No videos yet.">
            {(q.data?.videos ?? []).map((v) => (
              <TableRow key={v.id}>
                <TableCell><p className="font-medium">{v.title}</p>{v.isAnimated && <span className="text-xs text-primary">Animated demo · loops</span>}</TableCell>
                <TableCell className="capitalize text-sm">{v.category}</TableCell>
                <TableCell className="tabular-nums text-sm">{v.durationSec ? mmss(v.durationSec) : "—"}</TableCell>
                <TableCell className="tabular-nums text-sm">{mb(v.sizeBytes)}</TableCell>
                <TableCell>{v.isPublished ? <Chip size="sm" color="success" variant="flat">Published</Chip> : <Chip size="sm" variant="flat">Draft</Chip>}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button isIconOnly size="sm" variant="light" aria-label={`Edit ${v.title}`} onPress={() => setForm({ ...v })}><IconEdit size={16} /></Button>
                    <Button isIconOnly size="sm" variant="light" aria-label={`Delete ${v.title}`} onPress={() => remove(v)}><IconTrash size={16} /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </LoadState>

      <Modal isOpen={!!form} onClose={() => setForm(null)} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>{form?.id ? "Edit video" : "Add video"}</ModalHeader>
          <ModalBody>
            {form && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 rounded-lg border border-dashed border-divider p-4 space-y-2">
                  <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="text-sm" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0]).catch((err) => toast.error((err as Error).message))} aria-label="Video file" />
                  {progress != null && <Progress size="sm" value={progress * 100} aria-label="Upload progress" />}
                  <p className="text-xs text-foreground-500">Upload an MP4 (keep it under ~100 MB so members can download it on mobile data), or paste a direct link below.</p>
                </div>
                <Input label="Video link" className="md:col-span-2" value={form.videoUrl} onValueChange={(videoUrl) => setForm({ ...form, videoUrl })} placeholder="https://…/squat.mp4" />
                <Input label="Title" className="md:col-span-2" value={form.title} onValueChange={(title) => setForm({ ...form, title })} />
                <Textarea label="Coaching notes" className="md:col-span-2" value={form.description ?? ""} onValueChange={(description) => setForm({ ...form, description })} minRows={2} />
                <Select label="Category" selectedKeys={[form.category]} onSelectionChange={(k) => setForm({ ...form, category: Array.from(k)[0] as Form["category"] })}>
                  {CATS.map((c) => <SelectItem key={c} className="capitalize">{c}</SelectItem>)}
                </Select>
                <Input label="Length (seconds)" type="number" value={String(form.durationSec)} onValueChange={(v) => setForm({ ...form, durationSec: Number(v) || 0 })} />
                <Switch isSelected={form.isAnimated} onValueChange={(isAnimated) => setForm({ ...form, isAnimated })}>Animated demo (plays on loop)</Switch>
                <Switch isSelected={form.isPublished} onValueChange={(isPublished) => setForm({ ...form, isPublished })}>Published</Switch>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setForm(null)}>Cancel</Button>
            <Button color="primary" isLoading={busy} isDisabled={progress != null} startContent={!busy && <IconUpload size={16} />} onPress={save}>Save</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
