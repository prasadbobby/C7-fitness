import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";

// Helper to construct safe URL avoiding duplicated header issues
function getSafeBaseUrl(): string {
  return "https://c7personalfitness.com";
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
        return NextResponse.redirect(new URL("/sign-in?error=invitation_required", getSafeBaseUrl()));
      }
    }
  },
  async afterAuth(auth, req) {
    // Redirect unauthenticated users to sign-in for protected routes
    if (!auth.userId && !auth.isPublicRoute) {
      // Use hardcoded base URL to avoid header duplication issues
      const signInUrl = new URL('/sign-in', getSafeBaseUrl());
      signInUrl.searchParams.set('redirect_url', req.nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
  },
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
