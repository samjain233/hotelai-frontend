import { NextRequest } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/** Allow long-lived SSE (Vercel Pro: up to 300s; Hobby: 10s) */
export const maxDuration = 60;

export async function GET(request: NextRequest) {
    const cookie = request.headers.get('cookie') || '';
    const hasAuth = cookie.includes('auth_token=');
    const res = await fetch(`${API_URL}/activity/stream`, {
        headers: { Cookie: cookie },
        credentials: 'include',
    });

    if (!res.ok) {
        // Log in production for debugging (remove later)
        if (process.env.NODE_ENV === 'production' && res.status === 401) {
            console.warn('[activity/stream] 401 - cookie present:', hasAuth);
        }
        return new Response(res.statusText, { status: res.status });
    }

    return new Response(res.body, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
        },
    });
}
