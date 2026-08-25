/**
 * Guest Stay Session Storage Helper
 * Keeps verified Stay Tokens in browser localStorage so in-house guests
 * only need to enter their 4-digit PIN once during their stay.
 */

const STAY_TOKEN_PREFIX = 'stay_token_';

export function getStayToken(roomId?: string | null): string | null {
    if (!roomId || typeof window === 'undefined') return null;
    try {
        return localStorage.getItem(`${STAY_TOKEN_PREFIX}${roomId}`);
    } catch {
        return null;
    }
}

export function setStayToken(roomId: string, token: string): void {
    if (!roomId || typeof window === 'undefined') return;
    try {
        localStorage.setItem(`${STAY_TOKEN_PREFIX}${roomId}`, token);
    } catch {
        // localStorage could be disabled or full
    }
}

export function clearStayToken(roomId?: string | null): void {
    if (!roomId || typeof window === 'undefined') return;
    try {
        localStorage.removeItem(`${STAY_TOKEN_PREFIX}${roomId}`);
    } catch {
        // ignore
    }
}
