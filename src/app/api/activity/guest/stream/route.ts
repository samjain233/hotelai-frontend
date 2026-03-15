import { NextRequest } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const hotelSlug = searchParams.get('hotelSlug');
    const roomId = searchParams.get('roomId');

    if (!hotelSlug || !roomId) {
        return new Response('hotelSlug and roomId required', { status: 400 });
    }

    const res = await fetch(
        `${API_URL}/activity/guest/stream?hotelSlug=${encodeURIComponent(hotelSlug)}&roomId=${encodeURIComponent(roomId)}`
    );

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
