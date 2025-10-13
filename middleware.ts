import { authMiddleware } from "@clerk/nextjs";
import { NextRequest, NextResponse } from "next/server";

<<<<<<< Updated upstream
export default authMiddleware({
  publicRoutes: ["/", "/sign-in", "/sign-up", "/privacy-policy", "/terms"],
  beforeAuth: (req) => {
    // Block direct access to sign-up unless it's via invitation
    if (req.nextUrl.pathname === "/sign-up") {
      const searchParams = req.nextUrl.searchParams;
      const hasClerkTicket = searchParams.has("__clerk_ticket") && searchParams.has("__clerk_status");
      const hasInvitationToken = searchParams.has("invitation_token") && searchParams.has("email");
      const hasRoleParam = searchParams.has("role"); // New invitations will have role param
=======
export default function middleware(req: NextRequest) {
  // Skip Clerk middleware for OAuth-related routes that handle auth internally
  if (req.nextUrl.pathname === "/api/auth/google-fitness/callback") {
    return NextResponse.next();
  }
>>>>>>> Stashed changes

  // Apply Clerk middleware for all other routes (including /api/auth/google-fitness)
  return authMiddleware({
    publicRoutes: [
      "/",
      "/sign-in",
      "/sign-up"
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
  })(req);
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
