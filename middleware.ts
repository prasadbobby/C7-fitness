import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

// Base URL for redirects. Behind the live proxy the Host header can arrive duplicated, so production
// uses a fixed origin (NEXT_PUBLIC_APP_URL, else the staging admin). On a developer machine we stay on
// whatever localhost origin the request came from — never bounce a local login to the live website.
function getSafeBaseUrl(req: NextRequest): string {
  const host = (req.headers.get("host") ?? "").split(",")[0].trim();
  if (LOCAL_HOST.test(host)) return `http://${host}`;
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env && !/localhost|127\.0\.0\.1/.test(env)) return env.replace(/\/$/, "");
  return "https://staging.c7personalfitness.com";
}

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)", "/privacy-policy", "/terms", "/locked"]);
// Routes that skip Clerk entirely (OAuth callbacks and the super-admin password flow).
const isIgnoredRoute = createRouteMatcher(["/api/auth/google-fitness/callback", "/api/admin/super-admin-auth(.*)", "/api/debug-headers"]);

const withClerk = clerkMiddleware(async (auth, req) => {
  // Block direct access to sign-up unless it's via invitation
  if (req.nextUrl.pathname === "/sign-up") {
    const searchParams = req.nextUrl.searchParams;
    const hasClerkTicket = searchParams.has("__clerk_ticket") && searchParams.has("__clerk_status");
    const hasInvitationToken = searchParams.has("invitation_token") && searchParams.has("email");
    const hasRoleParam = searchParams.has("role");

    if (!hasClerkTicket && !hasInvitationToken && !hasRoleParam) {
      return NextResponse.redirect(new URL("/sign-in?error=invitation_required", getSafeBaseUrl(req)));
    }
  }

  // Redirect unauthenticated users to sign-in for protected routes
  if (!isPublicRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      const signInUrl = new URL("/sign-in", getSafeBaseUrl(req));
      signInUrl.searchParams.set("redirect_url", req.nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
});

export default function middleware(req: NextRequest, ev: NextFetchEvent) {
  if (isIgnoredRoute(req)) return NextResponse.next();
  return withClerk(req, ev);
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
