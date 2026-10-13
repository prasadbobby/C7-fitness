// import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "./providers";
import type { Metadata } from "next";
// import { Analytics } from "@vercel/analytics/react";
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
  metadataBase: new URL('https://c7personalfitness.com'),
  title: "C7 Personal Fitness Studio",
  description: "Track, Analyze & Optimize Your Workouts",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
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
          {/* <SpeedInsights /> */}
          {/* <Analytics /> */}
        </body>
      </html>
    </ClerkProvider>
  );
}
