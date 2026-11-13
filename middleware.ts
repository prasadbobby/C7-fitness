import { authMiddleware } from "@clerk/nextjs";
import { NextResponse, type NextRequest } from "next/server";

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

export default authMiddleware({
  publicRoutes: [
    "/",
    "/sign-in",
    "/sign-up",
    "/privacy-policy",
    "/terms",
    "/locked"
  ],
  ignoredRoutes: [
    "/api/auth/google-fitness/callback",
    "/api/admin/super-admin-auth",
    "/api/debug-headers"
  ],
  beforeAuth: (req) => {
    // Block direct access to sign-up unless it's via invitation
    if (req.nextUrl.pathname === "/sign-up") {
      const searchParams = req.nextUrl.searchParams;
      const hasClerkTicket = searchParams.has("__clerk_ticket") && searchParams.has("__clerk_status");
      const hasInvitationToken = searchParams.has("invitation_token") && searchParams.has("email");
      const hasRoleParam = searchParams.has("role");

      if (!hasClerkTicket && !hasInvitationToken && !hasRoleParam) {
        // Use hardcoded base URL to avoid header duplication issues
        return NextResponse.redirect(new URL("/sign-in?error=invitation_required", getSafeBaseUrl(req)));
      }
    }
  },
  async afterAuth(auth, req) {
    // Redirect unauthenticated users to sign-in for protected routes
    if (!auth.userId && !auth.isPublicRoute) {
      // Use hardcoded base URL to avoid header duplication issues
      const signInUrl = new URL('/sign-in', getSafeBaseUrl(req));
      signInUrl.searchParams.set('redirect_url', req.nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
  },
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
