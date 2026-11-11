"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback } from "react";

/** Base URL of the separate C7 backend (c7-backend). */
export const C7_API_URL = (process.env.NEXT_PUBLIC_C7_API_URL ?? "").replace(/\/$/, "");

export class C7ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
  }
}

/** Fetch helper for the C7 backend that sends the signed-in admin's Clerk session token. */
export function useC7Api() {
  const { getToken } = useAuth();
  return useCallback(
    async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
      if (!C7_API_URL) throw new C7ApiError("NEXT_PUBLIC_C7_API_URL is not set", 0, "CONFIG");
      const token = await getToken();
      const res = await fetch(`${C7_API_URL}/v1${path}`, {
        ...init,
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers ?? {}) },
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new C7ApiError(data.error ?? `Request failed (${res.status})`, res.status, data.code);
      return data as T;
    },
    [getToken],
  );
}
