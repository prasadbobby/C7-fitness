"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Avatar, Button, Card, CardBody, Chip, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader,
  Progress, Select, SelectItem, Spinner, Switch, Tab, Table, TableBody, TableCell, TableColumn, TableHeader,
  TableRow, Tabs, Textarea,
} from "@nextui-org/react";
import { IconEdit, IconPhoto, IconPlus, IconSearch, IconTrash, IconRefresh } from "@tabler/icons-react";
import { toast } from "sonner";
import { useC7Api } from "@/lib/c7Api";

const CATEGORIES = ["vegetarian", "seafood", "high-protein", "keto", "vegan", "breakfast", "snack", "other"] as const;
type Category = (typeof CATEGORIES)[number];
const label = (c: string) => c.split("-").map((w) => w[0]!.toUpperCase() + w.slice(1)).join(" ");

type Recipe = {
  id: string; title: string; description: string | null; category: Category; imageUrl: string | null;
  kcal: number; protein: number; carbs: number; fat: number; minutes: number; servings: number;
  ingredients: string[]; steps: string[]; tags: string[]; isPublished: boolean;
  authorName?: string; likes?: number; timesLogged?: number; createdAt: string;
};
type Goal = { kcal: number; protein: number; carbs: number; fat: number; waterMl: number; notes?: string | null };
type Member = {
  userId: string; memberId: string | null; name: string; email: string | null; imageUrl: string; role: string;
  membershipStatus: string | null; goal: Goal | null;
  today: { kcal: number; protein: number; carbs: number; fat: number; waterMl: number; meals: number };
};

/** Today's date in IST (the gym's timezone), as YYYY-MM-DD. */
const todayIST = () => new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10);

export default function NutritionAdmin() {
  return (
    <Tabs aria-label="Nutrition admin" color="primary" variant="underlined" classNames={{ panel: "pt-4" }}>
      <Tab key="recipes" title="Recipe library"><RecipesPanel /></Tab>
      <Tab key="members" title="Member goals"><MembersPanel /></Tab>
    </Tabs>
  );
}

/* ───────────────────────────── Recipes ───────────────────────────── */

const emptyRecipe = (): Omit<Recipe, "id" | "createdAt"> => ({
  title: "", description: "", category: "high-protein", imageUrl: null, kcal: 0, protein: 0, carbs: 0, fat: 0,
  minutes: 15, servings: 1, ingredients: [], steps: [], tags: [], isPublished: true,
});

function RecipesPanel() {
  const api = useC7Api();
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [editing, setEditing] = useState<Recipe | "new" | null>(null);
  const [deleting, setDeleting] = useState<Recipe | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setRecipes((await api<{ recipes: Recipe[] }>("/admin/recipes")).recipes);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [api]);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(
    () => (recipes ?? []).filter((r) => (category === "all" || r.category === category) && r.title.toLowerCase().includes(search.trim().toLowerCase())),
    [recipes, search, category],
  );

  const togglePublish = async (r: Recipe) => {
    try {
      const { id, createdAt, authorName, likes, timesLogged, ...rest } = r;
      await api(`/admin/recipes/${id}`, { method: "PUT", body: JSON.stringify({ ...rest, isPublished: !r.isPublished }) });
      setRecipes((list) => list?.map((x) => (x.id === r.id ? { ...x, isPublished: !r.isPublished } : x)) ?? null);
      toast.success(r.isPublished ? "Recipe hidden from the app" : "Recipe published");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(`/admin/recipes/${deleting.id}`, { method: "DELETE" });
      setRecipes((list) => list?.filter((x) => x.id !== deleting.id) ?? null);
      toast.success("Recipe deleted");
      setDeleting(null);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (error) return <ErrorCard message={error} onRetry={load} />;
  if (!recipes) return <div className="flex justify-center py-16"><Spinner label="Loading recipes…" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <Input className="md:max-w-xs" size="sm" placeholder="Search recipes" value={search} onValueChange={setSearch} startContent={<IconSearch size={16} />} aria-label="Search recipes" />
        <Select className="md:max-w-[200px]" size="sm" aria-label="Category" selectedKeys={[category]} onChange={(e) => setCategory(e.target.value || "all")}>
          {[<SelectItem key="all" value="all">All categories</SelectItem>, ...CATEGORIES.map((c) => <SelectItem key={c} value={c}>{label(c)}</SelectItem>)]}
        </Select>
        <div className="flex-1" />
        <Button color="primary" startContent={<IconPlus size={18} />} onPress={() => setEditing("new")}>New recipe</Button>
      </div>

      <Table aria-label="Recipes" removeWrapper className="bg-content1 rounded-xl p-2">
        <TableHeader>
          <TableColumn>RECIPE</TableColumn>
          <TableColumn>CATEGORY</TableColumn>
          <TableColumn>KCAL</TableColumn>
          <TableColumn>P / C / F (g)</TableColumn>
          <TableColumn>LIKES</TableColumn>
          <TableColumn>LOGGED</TableColumn>
          <TableColumn>PUBLISHED</TableColumn>
          <TableColumn align="end">ACTIONS</TableColumn>
        </TableHeader>
        <TableBody emptyContent="No recipes yet — add the first one.">
          {filtered.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  {r.imageUrl ? <img src={r.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" /> : <div className="w-12 h-12 rounded-lg bg-content2 grid place-items-center"><IconPhoto size={18} /></div>}
                  <div>
                    <p className="font-medium">{r.title}</p>
                    <p className="text-xs text-foreground-500">{r.minutes} min · by {r.authorName ?? "C7"}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell><Chip size="sm" variant="flat">{label(r.category)}</Chip></TableCell>
              <TableCell>{r.kcal}</TableCell>
              <TableCell>{r.protein} / {r.carbs} / {r.fat}</TableCell>
              <TableCell>{r.likes ?? 0}</TableCell>
              <TableCell>{r.timesLogged ?? 0}</TableCell>
              <TableCell><Switch size="sm" isSelected={r.isPublished} onValueChange={() => togglePublish(r)} aria-label="Published" /></TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button isIconOnly size="sm" variant="light" aria-label="Edit" onPress={() => setEditing(r)}><IconEdit size={18} /></Button>
                  <Button isIconOnly size="sm" variant="light" color="danger" aria-label="Delete" onPress={() => setDeleting(r)}><IconTrash size={18} /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editing && (
        <RecipeModal
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setRecipes((list) => {
              const l = list ?? [];
              return l.some((x) => x.id === saved.id) ? l.map((x) => (x.id === saved.id ? { ...x, ...saved } : x)) : [{ ...saved, likes: 0, timesLogged: 0 }, ...l];
            });
            setEditing(null);
          }}
        />
      )}

      <Modal isOpen={!!deleting} onClose={() => setDeleting(null)}>
        <ModalContent>
          <ModalHeader>Delete recipe?</ModalHeader>
          <ModalBody>
            <p>“{deleting?.title}” will be removed from the app, along with its likes, saves and comments. Meals members already logged keep their numbers. This can’t be undone.</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setDeleting(null)}>Cancel</Button>
            <Button color="danger" isLoading={busy} onPress={confirmDelete}>Delete</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

const MAX_IMAGE = 5 * 1024 * 1024;

function RecipeModal({ initial, onClose, onSaved }: { initial: Recipe | null; onClose: () => void; onSaved: (r: Recipe) => void }) {
  const api = useC7Api();
  const [f, setF] = useState(() => (initial ? { ...initial } : emptyRecipe()));
  const [ingredients, setIngredients] = useState((initial?.ingredients ?? []).join("\n"));
  const [steps, setSteps] = useState((initial?.steps ?? []).join("\n"));
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const num = (v: string) => (v === "" ? 0 : Number(v));

  const pickImage = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Choose an image file");
    if (file.size > MAX_IMAGE) return toast.error("Image must be smaller than 5MB");
    const reader = new FileReader();
    reader.onload = () => set("imageUrl", String(reader.result));
    reader.readAsDataURL(file);
  };

  const titleError = f.title.trim().length < 2 ? "Enter a title" : null;
  const save = async () => {
    if (titleError) return toast.error(titleError);
    setSaving(true);
    try {
      const payload = {
        title: f.title.trim(), description: f.description?.trim() || null, category: f.category, imageUrl: f.imageUrl,
        kcal: Math.round(f.kcal), protein: f.protein, carbs: f.carbs, fat: f.fat, minutes: Math.round(f.minutes), servings: Math.max(1, Math.round(f.servings)),
        ingredients: ingredients.split("\n").map((s) => s.trim()).filter(Boolean),
        steps: steps.split("\n").map((s) => s.trim()).filter(Boolean),
        tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
        isPublished: f.isPublished,
      };
      const { recipe } = initial
        ? await api<{ recipe: Recipe }>(`/admin/recipes/${initial.id}`, { method: "PUT", body: JSON.stringify(payload) })
        : await api<{ recipe: Recipe }>("/admin/recipes", { method: "POST", body: JSON.stringify(payload) });
      toast.success(initial ? "Recipe updated" : "Recipe added to the app");
      onSaved(recipe);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} size="3xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>{initial ? "Edit recipe" : "New recipe"}</ModalHeader>
        <ModalBody className="space-y-3">
          <div className="flex gap-4 items-start">
            <label className="w-28 h-28 shrink-0 rounded-xl bg-content2 overflow-hidden grid place-items-center cursor-pointer border border-dashed border-default-300">
              {f.imageUrl ? <img src={f.imageUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-xs text-foreground-500 flex flex-col items-center gap-1"><IconPhoto size={20} />Add photo</span>}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => pickImage(e.target.files?.[0])} />
            </label>
            <div className="flex-1 space-y-3">
              <Input label="Title" isRequired value={f.title} onValueChange={(v) => set("title", v)} isInvalid={!!titleError && f.title !== ""} errorMessage={f.title !== "" ? titleError : undefined} />
              <Select label="Category" selectedKeys={[f.category]} onChange={(e) => e.target.value && set("category", e.target.value as Category)}>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{label(c)}</SelectItem>)}
              </Select>
            </div>
          </div>
          {f.imageUrl && <Button size="sm" variant="light" color="danger" className="self-start" onPress={() => set("imageUrl", null)}>Remove photo</Button>}
          <Textarea label="Description" value={f.description ?? ""} onValueChange={(v) => set("description", v)} maxRows={4} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Input type="number" label="Calories (kcal)" min={0} value={String(f.kcal)} onValueChange={(v) => set("kcal", num(v))} />
            <Input type="number" label="Protein (g)" min={0} step="0.5" value={String(f.protein)} onValueChange={(v) => set("protein", num(v))} />
            <Input type="number" label="Carbs (g)" min={0} step="0.5" value={String(f.carbs)} onValueChange={(v) => set("carbs", num(v))} />
            <Input type="number" label="Fat (g)" min={0} step="0.5" value={String(f.fat)} onValueChange={(v) => set("fat", num(v))} />
            <Input type="number" label="Prep time (min)" min={0} value={String(f.minutes)} onValueChange={(v) => set("minutes", num(v))} />
            <Input type="number" label="Servings" min={1} value={String(f.servings)} onValueChange={(v) => set("servings", num(v))} />
            <Input className="col-span-2" label="Tags" description="Comma separated" value={tags} onValueChange={setTags} />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <Textarea label="Ingredients" description="One per line" minRows={5} value={ingredients} onValueChange={setIngredients} />
            <Textarea label="Steps" description="One per line" minRows={5} value={steps} onValueChange={setSteps} />
          </div>
          <Switch isSelected={f.isPublished} onValueChange={(v) => set("isPublished", v)}>Published in the mobile app</Switch>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>Cancel</Button>
          <Button color="primary" isLoading={saving} onPress={save}>{initial ? "Save changes" : "Add recipe"}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ───────────────────────────── Members ───────────────────────────── */

function MembersPanel() {
  const api = useC7Api();
  const [date, setDate] = useState(todayIST);
  const [data, setData] = useState<{ defaultGoal: Goal; members: Member[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Member | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await api(`/admin/members?date=${date}`));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [api, date]);
  useEffect(() => { load(); }, [load]);

  const members = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.members ?? []).filter((m) => !q || m.name.toLowerCase().includes(q) || (m.email ?? "").toLowerCase().includes(q) || (m.memberId ?? "").toLowerCase().includes(q));
  }, [data, search]);

  if (error) return <ErrorCard message={error} onRetry={load} />;
  if (!data) return <div className="flex justify-center py-16"><Spinner label="Loading members…" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <Input className="md:max-w-xs" size="sm" placeholder="Search name, email or member ID" value={search} onValueChange={setSearch} startContent={<IconSearch size={16} />} aria-label="Search members" />
        <Input className="md:max-w-[180px]" size="sm" type="date" aria-label="Day" value={date} max={todayIST()} onValueChange={(v) => v && setDate(v)} />
        <Button size="sm" variant="flat" startContent={<IconRefresh size={16} />} onPress={load}>Refresh</Button>
        <p className="text-xs text-foreground-500 md:ml-auto">
          Default goal: {data.defaultGoal.kcal} kcal · P {data.defaultGoal.protein}g · C {data.defaultGoal.carbs}g · F {data.defaultGoal.fat}g · {data.defaultGoal.waterMl / 1000}L water
        </p>
      </div>

      <Table aria-label="Member nutrition" removeWrapper className="bg-content1 rounded-xl p-2">
        <TableHeader>
          <TableColumn>MEMBER</TableColumn>
          <TableColumn>GOAL</TableColumn>
          <TableColumn>CALORIES</TableColumn>
          <TableColumn>PROTEIN</TableColumn>
          <TableColumn>WATER</TableColumn>
          <TableColumn>MEALS</TableColumn>
          <TableColumn align="end">ACTIONS</TableColumn>
        </TableHeader>
        <TableBody emptyContent="No members found.">
          {members.map((m) => {
            const g = m.goal ?? data.defaultGoal;
            return (
              <TableRow key={m.userId}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar src={m.imageUrl || undefined} name={m.name} size="sm" />
                    <div>
                      <p className="font-medium">{m.name}</p>
                      <p className="text-xs text-foreground-500">{m.memberId ?? m.email ?? ""}{m.role !== "USER" ? ` · ${m.role.replace("_", " ").toLowerCase()}` : ""}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{m.goal ? <Chip size="sm" color="primary" variant="flat">Custom</Chip> : <Chip size="sm" variant="flat">Default</Chip>}</TableCell>
                <TableCell><Meter value={m.today.kcal} target={g.kcal} unit="kcal" /></TableCell>
                <TableCell><Meter value={m.today.protein} target={g.protein} unit="g" /></TableCell>
                <TableCell><Meter value={m.today.waterMl / 1000} target={g.waterMl / 1000} unit="L" /></TableCell>
                <TableCell>{m.today.meals}</TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Button size="sm" variant="flat" color="primary" onPress={() => setEditing(m)}>Set goal</Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {editing && (
        <GoalModal
          member={editing}
          defaults={data.defaultGoal}
          onClose={() => setEditing(null)}
          onSaved={(goal) => {
            setData((d) => d && { ...d, members: d.members.map((m) => (m.userId === editing.userId ? { ...m, goal } : m)) });
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function Meter({ value, target, unit }: { value: number; target: number; unit: string }) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  const v = Math.round(value * 10) / 10;
  return (
    <div className="min-w-[110px]">
      <p className="text-xs mb-1">{v} / {target} {unit}</p>
      <Progress size="sm" aria-label={unit} value={pct} color={pct >= 100 ? "success" : "primary"} />
    </div>
  );
}

function GoalModal({ member, defaults, onClose, onSaved }: { member: Member; defaults: Goal; onClose: () => void; onSaved: (g: Goal | null) => void }) {
  const api = useC7Api();
  const [g, setG] = useState<Goal>(() => ({ ...(member.goal ?? defaults), notes: member.goal?.notes ?? "" }));
  const [saving, setSaving] = useState(false);
  const set = (k: keyof Goal, v: string) => setG((x) => ({ ...x, [k]: k === "notes" ? v : v === "" ? 0 : Math.round(Number(v)) }));

  const invalid =
    g.kcal < 800 || g.kcal > 8000 ? "Calories must be between 800 and 8000" :
    g.waterMl < 500 || g.waterMl > 8000 ? "Water must be between 500 and 8000 ml" :
    g.protein < 0 || g.carbs < 0 || g.fat < 0 ? "Macros can’t be negative" : null;

  const save = async () => {
    if (invalid) return toast.error(invalid);
    setSaving(true);
    try {
      const { goal } = await api<{ goal: Goal }>(`/admin/members/${member.userId}/nutrition-goal`, { method: "PUT", body: JSON.stringify({ ...g, notes: g.notes?.trim() || null }) });
      toast.success(`Goal saved for ${member.name}`);
      onSaved({ kcal: goal.kcal, protein: goal.protein, carbs: goal.carbs, fat: goal.fat, waterMl: goal.waterMl, notes: goal.notes });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    setSaving(true);
    try {
      await api(`/admin/members/${member.userId}/nutrition-goal`, { method: "DELETE" });
      toast.success("Reset to the default goal");
      onSaved(null);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} size="lg">
      <ModalContent>
        <ModalHeader>Nutrition goal · {member.name}</ModalHeader>
        <ModalBody>
          <div className="grid grid-cols-2 gap-3">
            <Input type="number" label="Calories (kcal)" value={String(g.kcal)} onValueChange={(v) => set("kcal", v)} />
            <Input type="number" label="Water (ml)" value={String(g.waterMl)} onValueChange={(v) => set("waterMl", v)} />
            <Input type="number" label="Protein (g)" value={String(g.protein)} onValueChange={(v) => set("protein", v)} />
            <Input type="number" label="Carbs (g)" value={String(g.carbs)} onValueChange={(v) => set("carbs", v)} />
            <Input type="number" label="Fat (g)" value={String(g.fat)} onValueChange={(v) => set("fat", v)} />
          </div>
          <p className="text-xs text-foreground-500">Macros add up to {Math.round(g.protein * 4 + g.carbs * 4 + g.fat * 9)} kcal.</p>
          <Textarea label="Coach notes" description="Shown to the member in the app" value={g.notes ?? ""} onValueChange={(v) => set("notes", v)} maxRows={4} />
          {invalid && <p className="text-sm text-danger">{invalid}</p>}
        </ModalBody>
        <ModalFooter>
          {member.goal && <Button variant="light" color="danger" className="mr-auto" isDisabled={saving} onPress={reset}>Reset to default</Button>}
          <Button variant="light" onPress={onClose}>Cancel</Button>
          <Button color="primary" isLoading={saving} onPress={save}>Save goal</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="border border-danger/30">
      <CardBody className="flex flex-row items-center gap-4">
        <div className="flex-1">
          <p className="font-medium text-danger">Couldn’t reach the C7 backend</p>
          <p className="text-sm text-foreground-500">{message}</p>
        </div>
        <Button variant="flat" onPress={onRetry}>Try again</Button>
      </CardBody>
    </Card>
  );
}
