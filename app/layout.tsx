// import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "./providers";
import type { Metadata } from "next";
// import { Analytics } from "@vercel/analytics/react";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ClerkProvider } from "@clerk/nextjs";
import { SITE_URL } from "@/lib/siteUrl";

export function generateViewport() {
  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    //themeColor: "#18181b",
  };
}

const inter = Inter({ subsets: ["latin"] });

// @clerk/nextjs v7 no longer reads NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL / _AFTER_SIGN_UP_URL,
// so hand them to ClerkProvider as the fallback redirects (used when there is no redirect_url).
const afterSignInUrl = process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || "/dashboard";
const afterSignUpUrl = process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || "/dashboard";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "C7 Personal Fitness Studio",
  description: "Track, Analyze & Optimize Your Workouts",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="min-h-dvh flex flex-col"
      suppressHydrationWarning
    >
      <body
        className={`${inter.className} flex flex-col grow overflow-x-hidden`}
      >
        {/* Clerk Core 3 (@clerk/nextjs v7) requires ClerkProvider inside <body>, not around <html>. */}
        <ClerkProvider
          signInFallbackRedirectUrl={afterSignInUrl}
          signUpFallbackRedirectUrl={afterSignUpUrl}
        >
          <Providers>
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: "#18181b",
                  border: "none",
                  color: "white",
                },
              }}
            />
            {children}
          </Providers>
        </ClerkProvider>
        {/* <SpeedInsights /> */}
        {/* <Analytics /> */}
      </body>
    </html>
  );
}
