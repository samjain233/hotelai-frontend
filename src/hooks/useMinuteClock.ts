"use client";

import { useSyncExternalStore } from "react";

const MINUTE = 60_000;

/** Current minute as epoch ms, floored. Changing once a minute keeps "is open?" re-renders to one per minute. */
function currentMinute(): number {
    return Math.floor(Date.now() / MINUTE) * MINUTE;
}

const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | null = null;

function scheduleTick() {
    if (timer != null) return;
    const msToNextMinute = MINUTE - (Date.now() % MINUTE);
    timer = setTimeout(() => {
        timer = null;
        listeners.forEach((l) => l());
        if (listeners.size > 0) scheduleTick();
    }, msToNextMinute + 20);
}

// A tab that slept past a minute boundary gets a fresh value as soon as it is visible again.
function onVisible() {
    if (document.visibilityState === "visible") listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
    if (listeners.size === 0) document.addEventListener("visibilitychange", onVisible);
    listeners.add(listener);
    scheduleTick();
    return () => {
        listeners.delete(listener);
        if (listeners.size > 0) return;
        document.removeEventListener("visibilitychange", onVisible);
        if (timer != null) { clearTimeout(timer); timer = null; }
    };
}

/**
 * Minute-granular "now" that is safe to use in server-rendered output.
 *
 * `renderedAt` is the instant the Server Component rendered (passed as a prop). It is used for the
 * server render and for the client's hydration pass, so markup matches even when the ISR page is
 * an hour old; React then re-renders once with the device clock and keeps ticking every minute.
 */
export function useMinuteClock(renderedAt: number): number {
    const serverMinute = Math.floor(renderedAt / MINUTE) * MINUTE;
    return useSyncExternalStore(subscribe, currentMinute, () => serverMinute);
}
