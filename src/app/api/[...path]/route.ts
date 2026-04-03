import { NextRequest, NextResponse } from 'next/server';

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

    const headers: Record<string, string> = {};
    const cookie = request.headers.get('cookie');
    if (cookie) headers['Cookie'] = cookie;
    const contentType = request.headers.get('content-type');
    if (contentType) headers['Content-Type'] = contentType;
    // Super-admin /platform/* routes require this; fetch sends it from the browser
    const platformKey = request.headers.get('x-platform-key');
    if (platformKey) headers['x-platform-key'] = platformKey;
    const authorization = request.headers.get('authorization');
    if (authorization) headers['Authorization'] = authorization;

    const body = request.method !== 'GET' && request.method !== 'HEAD'
        ? await request.text()
        : undefined;

    const res = await fetch(target, {
        method: request.method,
        headers,
        body,
    });

    const data = await res.text();
    return new NextResponse(data, {
        status: res.status,
        headers: {
            'Content-Type': res.headers.get('content-type') || 'application/json',
        },
    });
}
