/** Public address of this admin app. Set NEXT_PUBLIC_APP_URL per environment; staging is the main site. */
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://staging.c7personalfitness.com").replace(/\/$/, "");
