import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export default authMiddleware({
  publicRoutes: [
    "/",
    "/sign-in",
    "/sign-up",
    "/privacy-policy",
    "/terms",
    "/locked" // Add a locked page as public route
  ],
  ignoredRoutes: [
    "/api/auth/google-fitness/callback",
    "/api/admin/super-admin-auth"
  ],
  beforeAuth: (req) => {
    // Block direct access to sign-up unless it's via invitation
    if (req.nextUrl.pathname === "/sign-up") {
      const searchParams = req.nextUrl.searchParams;
      const hasClerkTicket = searchParams.has("__clerk_ticket") && searchParams.has("__clerk_status");
      const hasInvitationToken = searchParams.has("invitation_token") && searchParams.has("email");
      const hasRoleParam = searchParams.has("role"); // New invitations will have role param

      // Only allow sign-up with invitation parameters
      if (!hasClerkTicket && !hasInvitationToken && !hasRoleParam) {
        return NextResponse.redirect(new URL("/sign-in?error=invitation_required", req.url));
      }
    }
  },
  async afterAuth(auth, req) {
    // Redirect unauthenticated users to sign-in for protected routes
    if (!auth.userId && !auth.isPublicRoute) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
  },
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
