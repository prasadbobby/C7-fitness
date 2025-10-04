import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export default authMiddleware({
  publicRoutes: ["/", "/sign-in"],
  beforeAuth: (req) => {
    // Block direct access to sign-up unless it's via invitation
    if (req.nextUrl.pathname === "/sign-up") {
      const searchParams = req.nextUrl.searchParams;
      const hasClerkTicket = searchParams.has("__clerk_ticket") && searchParams.has("__clerk_status");
      const hasInvitationToken = searchParams.has("invitation_token") && searchParams.has("email");

      // Only allow sign-up with invitation parameters
      if (!hasClerkTicket && !hasInvitationToken) {
        return NextResponse.redirect(new URL("/sign-in?error=invitation_required", req.url));
      }
    }
  },
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
