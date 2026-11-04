"use client";

import useSWR from "swr";
import { platformAuth, type PlatformSessionInfo } from "@/lib/platformApi";

export const PLATFORM_SESSION_KEY = "platform/auth/me";

/**
 * The signed-in super-admin, from the httpOnly session cookie. A 401 sends the browser to the login page
 * (inside `platformApi`), so `error` here means the server could not be reached.
 */
export function usePlatformSession() {
    const { data, error, isLoading, mutate } = useSWR<PlatformSessionInfo>(PLATFORM_SESSION_KEY, platformAuth.me, {
        // Re-checking on focus notices a session that idled out or was ended from another device.
        revalidateOnFocus: true,
        shouldRetryOnError: false,
    });
    return { session: data ?? null, error: error as Error | undefined, isLoading, refresh: mutate };
}
