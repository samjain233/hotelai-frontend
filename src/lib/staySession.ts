"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Guest Stay Session Storage Helper
 * Keeps verified Stay Tokens and PINs in browser localStorage so in-house guests
 * only need to enter their 4-digit PIN once during their stay.
 */

const STAY_TOKEN_PREFIX = 'stay_token_';
const STAY_PIN_PREFIX = 'stay_pin_';

export function getStayToken(roomId?: string | null): string | null {
    if (!roomId || typeof window === 'undefined') return null;
    try {
        return localStorage.getItem(`${STAY_TOKEN_PREFIX}${roomId}`);
    } catch {
        return null;
    }
}

export function getStayPin(roomId?: string | null): string | null {
    if (!roomId || typeof window === 'undefined') return null;
    try {
        return localStorage.getItem(`${STAY_PIN_PREFIX}${roomId}`);
    } catch {
        return null;
    }
}

export function setStaySession(roomId: string, token: string, pin?: string): void {
    if (!roomId || typeof window === 'undefined') return;
    try {
        localStorage.setItem(`${STAY_TOKEN_PREFIX}${roomId}`, token);
        if (pin) {
            localStorage.setItem(`${STAY_PIN_PREFIX}${roomId}`, pin);
        }
        window.dispatchEvent(new CustomEvent('stay_session_change', { detail: { roomId } }));
    } catch {
        // localStorage could be disabled or full
    }
}

export function setStayToken(roomId: string, token: string): void {
    setStaySession(roomId, token);
}

export function setStayPin(roomId: string, pin: string): void {
    if (!roomId || typeof window === 'undefined') return;
    try {
        localStorage.setItem(`${STAY_PIN_PREFIX}${roomId}`, pin);
        window.dispatchEvent(new CustomEvent('stay_session_change', { detail: { roomId } }));
    } catch {
        // ignore
    }
}

export function clearStayToken(roomId?: string | null): void {
    if (!roomId || typeof window === 'undefined') return;
    try {
        localStorage.removeItem(`${STAY_TOKEN_PREFIX}${roomId}`);
        localStorage.removeItem(`${STAY_PIN_PREFIX}${roomId}`);
        window.dispatchEvent(new CustomEvent('stay_session_change', { detail: { roomId } }));
    } catch {
        // ignore
    }
}

/**
 * React Hook to access reactive stay session token and verified PIN for a given room.
 */
export function useStaySession(roomId?: string | null) {
    const readSession = useCallback(() => {
        return {
            token: getStayToken(roomId),
            pin: getStayPin(roomId),
        };
    }, [roomId]);

    const [session, setSession] = useState<{ token: string | null; pin: string | null }>(() => readSession());

    useEffect(() => {
        setSession(readSession());

        const handleUpdate = (e?: Event) => {
            const customEvent = e as CustomEvent<{ roomId?: string }> | undefined;
            if (!customEvent?.detail?.roomId || customEvent.detail.roomId === roomId) {
                setSession(readSession());
            }
        };

        window.addEventListener('stay_session_change', handleUpdate);
        window.addEventListener('storage', handleUpdate);

        return () => {
            window.removeEventListener('stay_session_change', handleUpdate);
            window.removeEventListener('storage', handleUpdate);
        };
    }, [roomId, readSession]);

    return {
        token: session.token,
        pin: session.pin,
        isVerified: !!session.token,
    };
}
