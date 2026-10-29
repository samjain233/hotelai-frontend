"use client";

import { useSyncExternalStore } from "react";
import { getPlatformKey, isPlatformKeyRemembered, PLATFORM_KEY_EVENT } from "@/lib/platformApi";

function subscribe(onChange: () => void) {
    window.addEventListener("storage", onChange); // other tabs
    window.addEventListener(PLATFORM_KEY_EVENT, onChange); // this tab (set/clear)
    return () => {
        window.removeEventListener("storage", onChange);
        window.removeEventListener(PLATFORM_KEY_EVENT, onChange);
    };
}

/**
 * Super-admin key as React state. `hydrated` is false during SSR and the first client render so
 * pages can avoid redirecting before the browser storage has been read.
 */
export function usePlatformKey(): { key: string; remembered: boolean; hydrated: boolean } {
    const key = useSyncExternalStore(subscribe, getPlatformKey, () => "");
    const remembered = useSyncExternalStore(subscribe, isPlatformKeyRemembered, () => false);
    const hydrated = useSyncExternalStore(
        subscribe,
        () => true,
        () => false,
    );
    return { key, remembered, hydrated };
}
