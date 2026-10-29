"use client";

import { useSyncExternalStore } from "react";
import { ApiError } from "./api";

/**
 * Backend `code` values for stay-access failures (mirrors `STAY_ACCESS_ERROR_CODES` in
 * `guest-stay.service.ts`). Both mean "this phone can no longer act for the room": clear the
 * verified flag and re-prompt for the PIN.
 */
export const STAY_ACCESS_ERROR_CODES = new Set(["ROOM_VACANT", "STAY_UNVERIFIED"]);

/** True when a failed guest action (order, service request) was rejected for lack of stay access. */
export function isStayAccessError(err: unknown): boolean {
    return err instanceof ApiError && !!err.code && STAY_ACCESS_ERROR_CODES.has(err.code);
}

/**
 * Guest stay session helper.
 * The stay token lives in an httpOnly cookie set by the API, so page scripts can never read it.
 * Here we only remember *that* this phone verified a room, to decide when to show the PIN prompt.
 * If the cookie has expired or the PIN changed, the API rejects the request and we clear the flag.
 */

const STAY_VERIFIED_PREFIX = 'stay_verified_';
const LEGACY_KEY_PREFIXES = ['stay_token_', 'stay_pin_'];

function purgeLegacyKeys(): void {
    try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && LEGACY_KEY_PREFIXES.some((p) => key.startsWith(p))) {
                localStorage.removeItem(key);
            }
        }
    } catch {
        // localStorage could be disabled
    }
}

if (typeof window !== 'undefined') purgeLegacyKeys();

function notify(roomId: string): void {
    window.dispatchEvent(new CustomEvent('stay_session_change', { detail: { roomId } }));
}

export function isStayVerified(roomId?: string | null): boolean {
    if (!roomId || typeof window === 'undefined') return false;
    try {
        return localStorage.getItem(`${STAY_VERIFIED_PREFIX}${roomId}`) === '1';
    } catch {
        return false;
    }
}

export function markStayVerified(roomId: string): void {
    if (!roomId || typeof window === 'undefined') return;
    try {
        localStorage.setItem(`${STAY_VERIFIED_PREFIX}${roomId}`, '1');
    } catch {
        // localStorage could be disabled or full
    }
    notify(roomId);
}

export function clearStayVerified(roomId?: string | null): void {
    if (!roomId || typeof window === 'undefined') return;
    try {
        localStorage.removeItem(`${STAY_VERIFIED_PREFIX}${roomId}`);
    } catch {
        // ignore
    }
    notify(roomId);
}

function subscribe(onChange: () => void): () => void {
    window.addEventListener('stay_session_change', onChange);
    window.addEventListener('storage', onChange);
    return () => {
        window.removeEventListener('stay_session_change', onChange);
        window.removeEventListener('storage', onChange);
    };
}

/**
 * React hook: whether this phone has verified the given room.
 */
export function useStaySession(roomId?: string | null) {
    const isVerified = useSyncExternalStore(subscribe, () => isStayVerified(roomId), () => false);
    return { isVerified };
}
