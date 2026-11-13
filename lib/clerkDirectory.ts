import { clerkClient as base } from "@clerk/nextjs";
import { Clerk } from "@clerk/backend";
import prisma from "@/prisma/prisma";

/**
 * Extra Clerk instances to look names up in (read-only), e.g. the live instance when running locally
 * with test keys against a database of live users. Comma-separated secret keys.
 */
const directories = (process.env.CLERK_DIRECTORY_SECRET_KEYS || "")
  .split(",")
  .map((k) => k.trim().replace(/^['"]|['"]$/g, ""))
  .filter((k) => k && k !== process.env.CLERK_SECRET_KEY)
  .map((secretKey) => Clerk({ secretKey }));

type AnyUser = Awaited<ReturnType<typeof base.users.getUser>>;

async function fromDirectories(ids: string[]): Promise<Map<string, AnyUser>> {
  const found = new Map<string, AnyUser>();
  for (const dir of directories) {
    const left = ids.filter((id) => !found.has(id));
    if (!left.length) break;
    for (let i = 0; i < left.length; i += 100) {
      try {
        const list = (await dir.users.getUserList({ userId: left.slice(i, i + 100), limit: 100 })) as unknown as AnyUser[] | { data: AnyUser[] };
        for (const u of Array.isArray(list) ? list : list.data) found.set(u.id, u);
      } catch {
        /* that instance unreachable — try the next */
      }
    }
  }
  return found;
}

/**
 * clerkClient with a name fallback. Clerk user ids belong to one Clerk instance, so a database used
 * from another environment (or holding deleted users) makes Clerk lookups fail → "Unknown User".
 * Missing users are filled from the "UserProfile" snapshot the C7 backend keeps (if that table exists).
 */
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
    username: p.username || null,
    imageUrl: p.imageUrl || "",
    emailAddresses: p.email ? [{ id: "snapshot", emailAddress: p.email }] : [],
    primaryEmailAddressId: p.email ? "snapshot" : null,
    publicMetadata: {},
    privateMetadata: {},
    unsafeMetadata: {},
    createdAt: 0,
    updatedAt: 0,
  }) as unknown as Awaited<ReturnType<typeof base.users.getUser>>;

const users = new Proxy(base.users, {
  get(target, prop, receiver) {
    if (prop === "getUser")
      return async (id: string) => {
        try {
          return await target.getUser(id);
        } catch (e) {
          const d = (await fromDirectories([id])).get(id);
          if (d) return d;
          const p = (await profiles([id])).get(id);
          if (p) return asClerkUser(p);
          throw e;
        }
      };
    if (prop === "getUserList")
      return async (params: Parameters<typeof target.getUserList>[0] = {}) => {
        const list = (await target.getUserList(params)) as unknown as { id: string }[];
        const wanted = (params as { userId?: string[] })?.userId;
        if (!wanted?.length) return list;
        const have = new Set(list.map((u) => u.id));
        const missing = wanted.filter((id) => !have.has(id));
        const dir = await fromDirectories(missing);
        const still = missing.filter((id) => !dir.has(id));
        const extra = [...Array.from(dir.values()), ...Array.from((await profiles(still)).values()).map(asClerkUser)];
        return [...list, ...extra] as unknown as Awaited<ReturnType<typeof target.getUserList>>;
      };
    return Reflect.get(target, prop, receiver);
  },
});

export const clerkClient = new Proxy(base, {
  get(target, prop, receiver) {
    return prop === "users" ? users : Reflect.get(target, prop, receiver);
  },
});
