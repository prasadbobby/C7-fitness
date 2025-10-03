import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import prisma from "@/prisma/prisma";

interface PageProps {
  searchParams: {
    __clerk_ticket?: string;
    __clerk_status?: string;
    invitation_token?: string;
    email?: string;
    role?: string;
  };
}

export default async function Page({ searchParams }: PageProps) {
  const { __clerk_ticket, __clerk_status, invitation_token, email, role } = searchParams;

  // If this is a Clerk invitation flow, allow it through
  if (__clerk_ticket && __clerk_status === "sign_up") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to FitForge
            </h1>
            <p className="text-gray-600 mb-4">
              You've been invited to join FitForge. Complete your registration below.
            </p>
            {role && (
              <p className="text-sm text-blue-600 mb-6">
                Role: {role.replace('_', ' ').toUpperCase()}
              </p>
            )}
          </div>
          <SignUp
            appearance={{
              elements: {
                formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
                card: "shadow-lg"
              }
            }}
            redirectUrl="/dashboard"
          />
        </div>
      </div>
    );
  }

  // Check if this is our custom invitation-based signup
  if (!invitation_token || !email) {
    // Redirect to sign-in if no invitation
    redirect("/sign-in?error=invitation_required");
  }

  // Verify the invitation exists
  const invitation = await prisma.pendingInvitation.findUnique({
    where: { email: decodeURIComponent(email) }
  });

  if (!invitation) {
    redirect("/sign-in?error=invalid_invitation");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to FitForge
          </h1>
          <p className="text-gray-600 mb-4">
            You've been invited to join FitForge. Complete your registration below.
          </p>
          <p className="text-sm text-blue-600 mb-6">
            Invitation for: {decodeURIComponent(email)}
          </p>
        </div>
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
              card: "shadow-lg"
            }
          }}
          redirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}