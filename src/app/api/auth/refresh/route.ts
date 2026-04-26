import { NextRequest, NextResponse } from 'next/server';
import { forwardNestSetCookies } from '@/lib/forwardNestSetCookies';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
    try {
        const cookie = request.headers.get('cookie') ?? '';
        const res = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: cookie ? { Cookie: cookie } : {},
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
        console.error('Auth refresh proxy error:', err);
        return NextResponse.json({ message: 'Refresh failed' }, { status: 500 });
    }
}
