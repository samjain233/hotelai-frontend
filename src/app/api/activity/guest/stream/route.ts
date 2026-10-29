import { NextRequest } from 'next/server';
import { clientIpHeaders } from '@/lib/proxyClientHeaders';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const hotelSlug = searchParams.get('hotelSlug');
    const roomId = searchParams.get('roomId');

    if (!hotelSlug || !roomId) {
        return new Response('hotelSlug and roomId required', { status: 400 });
    }

    const upstreamUrl = new URL(`${API_URL}/activity/guest/stream`);
    upstreamUrl.searchParams.set('hotelSlug', hotelSlug);
    upstreamUrl.searchParams.set('roomId', roomId);

    const cookie = request.headers.get('cookie');
    const res = await fetch(upstreamUrl.toString(), {
        headers: { ...clientIpHeaders(request), ...(cookie ? { Cookie: cookie } : {}) },
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
