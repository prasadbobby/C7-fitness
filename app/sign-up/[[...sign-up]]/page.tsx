import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import prisma from "@/prisma/prisma";

interface PageProps {
  // Next.js 15 passes searchParams as a Promise.
  searchParams: Promise<{
    __clerk_ticket?: string;
    __clerk_status?: string;
    invitation_token?: string;
    email?: string;
    role?: string;
  }>;
}

// This page is designed light. Clerk's components (@clerk/nextjs v7) follow the CSS color-scheme,
// which the app's default dark theme sets to "dark" on <html>, so pin this page to light.
const lightScheme = { colorScheme: "light" } as const;

export default async function Page({ searchParams }: PageProps) {
  const { __clerk_ticket, __clerk_status, invitation_token, email, role } = await searchParams;

  // Check if this is an invitation-based signup
  const hasClerkInvitation = __clerk_ticket && __clerk_status === "sign_up";
  const hasCustomInvitation = invitation_token && email;
  const hasRoleInvitation = role; // Simple role-based invitation

  // If no invitation parameters, redirect to sign-in with error
  if (!hasClerkInvitation && !hasCustomInvitation && !hasRoleInvitation) {
    redirect("/sign-in?error=invitation_required");
  }

  // If this is a Clerk invitation flow, allow it through
  if (hasClerkInvitation || hasRoleInvitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4" style={lightScheme}>
        <div className="w-full max-w-md mx-auto">
          <SignUp
            appearance={{
              elements: {
                formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
                card: "shadow-lg",
                // Hide social/OAuth buttons for invitation signups
                socialButtonsBlockButton: "hidden",
                socialButtonsBlockButtonArrow: "hidden",
                dividerRow: "hidden",
                dividerLine: "hidden",
                dividerText: "hidden",
                // Make email field read-only for invitation signups
                formFieldInput__emailAddress: "bg-gray-100 cursor-not-allowed pointer-events-none",
                formFieldLabel__emailAddress: "text-gray-500",
                // Hide "Optional" text on fields
                formFieldHintText: "hidden"
              }
            }}
            fallbackRedirectUrl="/dashboard"
          />
        </div>
      </div>
    );
  }

  // Handle custom invitation-based signup
  if (hasCustomInvitation) {
    // Verify the invitation exists
    const invitation = await prisma.pendingInvitation.findUnique({
      where: { email: decodeURIComponent(email) }
    });

    if (!invitation) {
      redirect("/sign-in?error=invalid_invitation");
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4" style={lightScheme}>
        <div className="w-full max-w-md mx-auto">
          <SignUp
            appearance={{
              elements: {
                formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
                card: "shadow-lg",
                // Hide social/OAuth buttons for invitation signups
                socialButtonsBlockButton: "hidden",
                socialButtonsBlockButtonArrow: "hidden",
                dividerRow: "hidden",
                dividerLine: "hidden",
                dividerText: "hidden",
                // Make email field read-only for invitation signups
                formFieldInput__emailAddress: "bg-gray-100 cursor-not-allowed pointer-events-none",
                formFieldLabel__emailAddress: "text-gray-500",
                // Hide "Optional" text on fields
                formFieldHintText: "hidden"
              }
            }}
            fallbackRedirectUrl="/dashboard"
          />
        </div>
      </div>
    );
  }

  // This should never be reached due to the initial check, but redirect as fallback
  redirect("/sign-in?error=invitation_required");
}