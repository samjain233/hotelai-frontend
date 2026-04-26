import { NextRequest, NextResponse } from 'next/server';
import { forwardNestSetCookies } from '@/lib/forwardNestSetCookies';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const hotelId = typeof body.hotelId === 'string' ? body.hotelId.trim() : '';
        if (!hotelId) {
            return NextResponse.json({ message: 'hotelId is required' }, { status: 400 });
        }

        const platformKey = request.headers.get('x-platform-key') || '';
        const res = await fetch(`${API_URL}/platform/hotels/${encodeURIComponent(hotelId)}/impersonate-admin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-platform-key': platformKey,
            },
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            return NextResponse.json(data, { status: res.status });
        }

        const response = NextResponse.json({
            admin: (data as { admin?: unknown }).admin,
            hotel: (data as { hotel?: unknown }).hotel,
            token: (data as { token?: string }).token,
        });
        forwardNestSetCookies(res, response);
        return response;
    } catch (err) {
        console.error('Platform impersonate proxy error:', err);
        return NextResponse.json({ message: 'Impersonation failed' }, { status: 500 });
    }
}
