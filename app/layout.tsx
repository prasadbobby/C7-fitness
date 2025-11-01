import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "./providers";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ClerkProvider } from "@clerk/nextjs";

export function generateViewport() {
  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    //themeColor: "#18181b",
  };
}

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://c7personal.fit'),
  title: {
    default: "C7 Personal Fitness Studio - Track, Analyze & Optimize Your Workouts",
    template: "%s | C7 Personal Fitness Studio"
  },
  description: "C7 Personal Fitness Studio: The ultimate fitness tracking app for serious athletes. Log workouts, track progress, join 90-day challenges, and optimize your gym sessions with data-driven insights.",

  keywords: [
    "C7 Personal Fitness Studio",
    "fitness tracking app",
    "workout tracker",
    "gym app",
    "fitness studio",
    "personal trainer app",
    "workout planner",
    "90 day fitness challenge",
    "fitness progress tracking",
    "bodybuilding app",
    "strength training tracker",
    "fitness analytics",
    "gym workout log",
    "fitness community",
    "C7 fitness",
    "personal fitness studio",
    "workout optimization",
    "fitness goals tracker"
  ],

  authors: [{ name: "C7 Personal Fitness Studio" }],
  creator: "C7 Personal Fitness Studio",
  publisher: "C7 Personal Fitness Studio",

  openGraph: {
    type: "website",
    locale: "en_US",
    title: "C7 Personal Fitness Studio - Premium Fitness Tracking App",
    description: "Transform your fitness journey with C7 Personal Fitness Studio. Track workouts, analyze progress, and achieve your goals with our comprehensive fitness app.",
    siteName: "C7 Personal Fitness Studio",
    images: [
      {
        url: "/og-image.jpg", // You'll need to add this image
        width: 1200,
        height: 630,
        alt: "C7 Personal Fitness Studio - Fitness Tracking App"
      }
    ]
  },

  twitter: {
    card: "summary_large_image",
    title: "C7 Personal Fitness Studio - Track Your Fitness Journey",
    description: "The ultimate fitness tracking app for serious athletes. Join challenges, track progress, and optimize your workouts.",
    images: ["/og-image.jpg"]
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  alternates: {
    canonical: "https://c7personal.fit"
  },

  category: "fitness",
  classification: "Fitness & Health",

  other: {
    "application-name": "C7 Personal Fitness Studio",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "C7 Fitness"
  }
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL?.trim() || '/sign-in'}
      signUpUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL?.trim() || '/sign-up'}
      afterSignInUrl={process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL?.trim() || '/dashboard'}
      afterSignUpUrl={process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL?.trim() || '/dashboard'}
      domain={process.env.NEXT_PUBLIC_CLERK_DOMAIN || (process.env.NODE_ENV === 'production' ? 'clerk.c7personal.fit' : undefined)}
    >
      <html
        lang="en"
        className="min-h-dvh flex flex-col"
        suppressHydrationWarning
      >
        <body
          className={`${inter.className} flex flex-col grow overflow-x-hidden`}
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
          <SpeedInsights />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
