import { NextRequest, NextResponse } from 'next/server';
import { forwardNestSetCookies } from '@/lib/forwardNestSetCookies';
import { clientIpHeaders } from '@/lib/proxyClientHeaders';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Allow slow upstream calls (e.g. Gemini menu photo scan) when deployed on Vercel.
 * Hobby plan is capped at 10s — use Pro or call the API directly (no /api proxy) for long scans.
 * @see https://vercel.com/docs/functions/configuring-functions/duration
 */
export const maxDuration = 120;

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return proxyRequest(request, await params);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return proxyRequest(request, await params);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return proxyRequest(request, await params);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return proxyRequest(request, await params);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return proxyRequest(request, await params);
}

async function proxyRequest(request: NextRequest, { path }: { path: string[] }) {
    const pathStr = path.join('/');
    const url = new URL(request.url);
    const query = url.searchParams.toString();
    const target = `${API_URL}/${pathStr}${query ? `?${query}` : ''}`;

    const headers: Record<string, string> = clientIpHeaders(request);
    const cookie = request.headers.get('cookie');
    if (cookie) headers['Cookie'] = cookie;
    const contentType = request.headers.get('content-type');
    if (contentType) headers['Content-Type'] = contentType;
    // Super-admin /platform/* routes require this; fetch sends it from the browser
    const platformKey = request.headers.get('x-platform-key');
    if (platformKey) headers['x-platform-key'] = platformKey;
    const authorization = request.headers.get('authorization');
    if (authorization) headers['Authorization'] = authorization;
    // Conditional GETs: the browser revalidates `no-cache` responses with the ETag it holds; forward it so
    // Nest can answer 304 (guest menu /full and /version) instead of resending the body.
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch) headers['If-None-Match'] = ifNoneMatch;

    const body = request.method !== 'GET' && request.method !== 'HEAD'
        ? await request.text()
        : undefined;

    const res = await fetch(target, {
        method: request.method,
        headers,
        body,
    });

    const data = await res.text();
    const responseHeaders: Record<string, string> = {
        'Content-Type': res.headers.get('content-type') || 'application/json',
    };
    const retryAfter = res.headers.get('retry-after');
    if (retryAfter) responseHeaders['Retry-After'] = retryAfter;
    // Pass validators through so the browser's HTTP cache can do conditional requests against /api/*.
    const etag = res.headers.get('etag');
    if (etag) responseHeaders['ETag'] = etag;
    const cacheControl = res.headers.get('cache-control');
    if (cacheControl) responseHeaders['Cache-Control'] = cacheControl;
    // 304 must not carry a body; `undefined` keeps NextResponse from sending an empty string with a length.
    const response = new NextResponse(res.status === 304 ? undefined : data, { status: res.status, headers: responseHeaders });
    forwardNestSetCookies(res, response);
    return response;
}
