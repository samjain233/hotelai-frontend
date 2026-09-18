import { NextRequest } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const hotelSlug = searchParams.get('hotelSlug');
    const roomId = searchParams.get('roomId');
    const stayToken = searchParams.get('stayToken');

    if (!hotelSlug || !roomId) {
        return new Response('hotelSlug and roomId required', { status: 400 });
    }

    const upstreamUrl = new URL(`${API_URL}/activity/guest/stream`);
    upstreamUrl.searchParams.set('hotelSlug', hotelSlug);
    upstreamUrl.searchParams.set('roomId', roomId);
    if (stayToken) {
        upstreamUrl.searchParams.set('stayToken', stayToken);
    }

    const res = await fetch(upstreamUrl.toString());

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
