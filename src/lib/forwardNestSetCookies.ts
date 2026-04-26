import { NextResponse } from 'next/server';

/**
 * Copy `Set-Cookie` headers from a Nest `fetch` response onto the outgoing Next.js response
 * so httpOnly `auth_token` + `auth_refresh` land on the app origin (same-site proxy pattern).
 */
export function forwardNestSetCookies(backendRes: Response, outgoing: NextResponse): void {
    const list =
        typeof backendRes.headers.getSetCookie === 'function'
            ? backendRes.headers.getSetCookie()
            : legacySetCookieLines(backendRes.headers.get('set-cookie'));
    for (const line of list) {
        if (line) outgoing.headers.append('Set-Cookie', line);
    }
}

function legacySetCookieLines(h: string | null): string[] {
    if (!h) return [];
    return [h];
}
