import { clerkClient as getClerk, createClerkClient, type User } from "@clerk/nextjs/server";
import prisma from "@/prisma/prisma";

/**
 * One place for server-side Clerk user lookups (Clerk SDK v6).
 *
 * - Keeps the old synchronous shape `clerkClient.users.getUser(...)` used across the app, while
 *   v6's `clerkClient()` is async underneath.
 * - `getUserList` returns a plain array again (v6 returns `{ data, totalCount }`); `.data` and
 *   `.totalCount` are attached too, so either style works.
 * - Name fallback: a user missing from this Clerk instance is looked up in the extra instances in
 *   CLERK_DIRECTORY_SECRET_KEYS (read-only), then in the "UserProfile" snapshot table, so pages show
 *   real names instead of "Unknown User".
 */

type UserList = User[] & { data: User[]; totalCount: number };
type GetUserListParams = Parameters<Awaited<ReturnType<typeof getClerk>>["users"]["getUserList"]>[0];

const directories = (process.env.CLERK_DIRECTORY_SECRET_KEYS || "")
  .split(",")
  .map((k) => k.trim().replace(/^['"]|['"]$/g, ""))
  .filter((k) => k && k !== process.env.CLERK_SECRET_KEY)
  .map((secretKey) => createClerkClient({ secretKey }));

const listOf = (r: unknown): User[] => (Array.isArray(r) ? r : ((r as { data?: User[] })?.data ?? []));
const asList = (arr: User[], totalCount = arr.length): UserList => Object.assign([...arr], { data: arr, totalCount });

async function fromDirectories(ids: string[]): Promise<Map<string, User>> {
  const found = new Map<string, User>();
  for (const dir of directories) {
    const left = ids.filter((id) => !found.has(id));
    if (!left.length) break;
    for (let i = 0; i < left.length; i += 100) {
      try {
        for (const u of listOf(await dir.users.getUserList({ userId: left.slice(i, i + 100), limit: 100 }))) found.set(u.id, u);
      } catch {
        /* that instance unreachable — try the next */
      }
    }
  }
  return found;
}

type Profile = { userId: string; firstName: string; lastName: string; username: string; email: string | null; imageUrl: string };

async function profiles(ids: string[]): Promise<Map<string, Profile>> {
  if (!ids.length) return new Map();
  try {
    const rows = await prisma.$queryRaw<Profile[]>`SELECT "userId","firstName","lastName","username","email","imageUrl" FROM "UserProfile" WHERE "userId" = ANY(${ids})`;
    return new Map(rows.map((r) => [r.userId, r]));
  } catch {
    return new Map(); // table not present in this database
  }
}

const asClerkUser = (p: Profile) =>
  ({
    id: p.userId,
    firstName: p.firstName || null,
    lastName: p.lastName || null,
    fullName: [p.firstName, p.lastName].filter(Boolean).join(" ") || null,
    username: p.username || null,
    imageUrl: p.imageUrl || "",
    hasImage: !!p.imageUrl,
    emailAddresses: p.email ? [{ id: "snapshot", emailAddress: p.email }] : [],
    primaryEmailAddressId: p.email ? "snapshot" : null,
    primaryEmailAddress: p.email ? { id: "snapshot", emailAddress: p.email } : null,
    publicMetadata: {},
    privateMetadata: {},
    unsafeMetadata: {},
    createdAt: 0,
    updatedAt: 0,
    lastSignInAt: null,
  }) as unknown as User;

async function getUser(id: string): Promise<User> {
  const base = await getClerk();
  try {
    return await base.users.getUser(id);
  } catch (e) {
    const d = (await fromDirectories([id])).get(id);
    if (d) return d;
    const p = (await profiles([id])).get(id);
    if (p) return asClerkUser(p);
    throw e;
  }
}

async function getUserList(params: GetUserListParams = {}): Promise<UserList> {
  const base = await getClerk();
  const res = await base.users.getUserList(params);
  const list = listOf(res);
  const total = (res as { totalCount?: number })?.totalCount ?? list.length;
  const wanted = (params as { userId?: string[] })?.userId;
  if (!wanted?.length) return asList(list, total);
  const have = new Set(list.map((u) => u.id));
  const missing = wanted.filter((id) => !have.has(id));
  if (!missing.length) return asList(list, total);
  const dir = await fromDirectories(missing);
  const still = missing.filter((id) => !dir.has(id));
  const extra = [...Array.from(dir.values()), ...Array.from((await profiles(still)).values()).map(asClerkUser)];
  return asList([...list, ...extra], total + extra.length);
}

/** Any other method on a Clerk API group, resolved lazily: clerkClient.invitations.revokeInvitation(...) */
const lazyGroup = (group: string, overrides: Record<string, unknown> = {}) =>
  new Proxy(overrides, {
    get(target, method: string) {
      if (method in target) return target[method];
      return async (...args: unknown[]) => {
        const api = (await getClerk()) as unknown as Record<string, Record<string, (...a: unknown[]) => unknown>>;
        return api[group][method](...args);
      };
    },
  });

type Base = Awaited<ReturnType<typeof getClerk>>;
type Wrapped = Omit<Base, "users"> & { users: Omit<Base["users"], "getUser" | "getUserList"> & { getUser: typeof getUser; getUserList: typeof getUserList } };

const groups = new Map<string, unknown>([["users", lazyGroup("users", { getUser, getUserList })]]);

export const clerkClient = new Proxy({} as Wrapped, {
  get(_t, prop: string) {
    if (!groups.has(prop)) groups.set(prop, lazyGroup(prop));
    return groups.get(prop);
  },
});
