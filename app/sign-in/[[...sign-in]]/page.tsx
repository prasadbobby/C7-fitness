import { SignIn } from "@clerk/nextjs";

interface PageProps {
  searchParams: {
    error?: string;
  };
}

export default function Page({ searchParams }: PageProps) {
  const { error } = searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-4">
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