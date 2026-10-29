/** Same value as API_PROXY_SECRET on the Nest API; proves x-client-ip came from this proxy, not a browser. */
const API_PROXY_SECRET = process.env.API_PROXY_SECRET?.trim() || '';

/** NextRequest or the plain Request some handlers receive. */
type IncomingRequest = Pick<Request, 'headers'>;

/**
 * The browser's address as seen by Vercel (or the dev server). Vercel sets x-forwarded-for and
 * x-real-ip itself, so a client cannot forge them; the first x-forwarded-for entry is the client.
 */
export function clientIp(request: IncomingRequest): string | null {
    const realIp = request.headers.get('x-real-ip')?.trim();
    if (realIp) return realIp;
    const forwarded = request.headers.get('x-forwarded-for');
    const first = forwarded?.split(',')[0]?.trim();
    return first || null;
}

/**
 * Headers every Next → Nest proxy call must include so the API rate-limits by the real browser,
 * not by this proxy's egress address. Spread into the upstream `fetch` headers. Browser-supplied
 * x-client-ip / x-proxy-secret are never copied through; they are always set here from scratch.
 */
export function clientIpHeaders(request: IncomingRequest): Record<string, string> {
    const ip = clientIp(request);
    if (!ip) return {};
    const headers: Record<string, string> = { 'X-Forwarded-For': ip };
    if (API_PROXY_SECRET) {
        headers['x-client-ip'] = ip;
        headers['x-proxy-secret'] = API_PROXY_SECRET;
    }
    return headers;
}
