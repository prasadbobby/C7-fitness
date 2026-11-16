import { SignIn } from "@clerk/nextjs";

interface PageProps {
  // Next.js 15 passes searchParams as a Promise.
  searchParams: Promise<{
    error?: string;
  }>;
}

// This page is designed light. Clerk's components (@clerk/nextjs v7) follow the CSS color-scheme,
// which the app's default dark theme sets to "dark" on <html>, so pin this page to light.
const lightScheme = { colorScheme: "light" } as const;

export default async function Page({ searchParams }: PageProps) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4" style={lightScheme}>
      <div className="w-full max-w-md space-y-4 mx-auto">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">
              {error === "invitation_required" && (
                <>
                  <strong>Invitation Required:</strong> This application is invitation-only.
                  Please contact an administrator to receive an invitation.
                </>
              )}
              {error === "invalid_invitation" && (
                <>
                  <strong>Invalid Invitation:</strong> The invitation link is invalid or has expired.
                  Please request a new invitation.
                </>
              )}
              {error !== "invitation_required" && error !== "invalid_invitation" && (
                <>
                  <strong>Error:</strong> {error}
                </>
              )}
            </div>
          </div>
        )}
        <SignIn
          appearance={{
            elements: {
              formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
              card: "shadow-lg"
            }
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
        />
        {!error && (
          <div className="text-center text-sm text-gray-600">
            <p>Don't have an account? This application is invitation-only.</p>
            <p>Contact an administrator to receive an invitation.</p>
          </div>
        )}
      </div>
    </div>
  );
}