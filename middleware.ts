import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';

// Initialize Prisma client for middleware
const prisma = new PrismaClient();

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
    // Skip lock check for public routes and locked page
    if (req.nextUrl.pathname === "/" ||
        req.nextUrl.pathname === "/sign-in" ||
        req.nextUrl.pathname === "/sign-up" ||
        req.nextUrl.pathname === "/locked" ||
        req.nextUrl.pathname === "/privacy-policy" ||
        req.nextUrl.pathname === "/terms" ||
        req.nextUrl.pathname.startsWith("/api/webhooks/") ||
        req.nextUrl.pathname.startsWith("/api/admin/users/check-lock")) {
      return NextResponse.next();
    }

    // If user is authenticated, check if they're locked in our database
    if (auth.userId) {
      try {
        // Check our database directly for lock status (this is the source of truth)
        const userInfo = await prisma.userInfo.findUnique({
          where: { userId: auth.userId },
          select: { locked: true }
        });

        if (userInfo?.locked) {
          // User is locked in our database - redirect to locked page
          const lockedUrl = new URL('/locked', req.url);
          return NextResponse.redirect(lockedUrl);
        }
      } catch (error) {
        console.error('Error checking lock status:', error);
        // If we can't check, allow the request to proceed (fail-safe)
      }
    }

    return NextResponse.next();
  },
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
