import { NextRequest, NextResponse } from 'next/server';
import { forwardNestSetCookies } from '@/lib/forwardNestSetCookies';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const res = await fetch(`${API_URL}/auth/verify-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            return NextResponse.json(data, { status: res.status });
        }

        const response = NextResponse.json({
            token: data.token,
            admin: data.admin,
            hotel: data.hotel,
        });
        forwardNestSetCookies(res, response);
        return response;
    } catch (err) {
        console.error('Verify-email proxy error:', err);
        return NextResponse.json({ message: 'Verification failed' }, { status: 500 });
    }
}
