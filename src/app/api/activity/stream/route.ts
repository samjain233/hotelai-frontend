import { NextRequest } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function GET(request: NextRequest) {
    const cookie = request.headers.get('cookie') || '';
    const res = await fetch(`${API_URL}/activity/stream`, {
        headers: { Cookie: cookie },
        credentials: 'include',
    });

    if (!res.ok) {
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
