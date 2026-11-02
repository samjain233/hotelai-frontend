import { NextRequest, NextResponse } from 'next/server';
import { clientIpHeaders } from '@/lib/proxyClientHeaders';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/** Verifying an email does not sign in, so no auth cookies are forwarded. */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const res = await fetch(`${API_URL}/auth/verify-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...clientIpHeaders(request) },
            body: JSON.stringify(body),
        });

        const data = await res.json().catch(() => ({}));
        return NextResponse.json(data, { status: res.status });
    } catch (err) {
        console.error('Verify-email proxy error:', err);
        return NextResponse.json({ message: 'Verification failed' }, { status: 500 });
    }
}
