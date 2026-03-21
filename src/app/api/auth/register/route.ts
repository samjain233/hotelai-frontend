import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            return NextResponse.json(data, { status: res.status });
        }

        return NextResponse.json({
            requiresVerification: true,
            email: data.email,
            message: data.message ?? `Verification link has been sent to ${data.email}.`,
        });
    } catch (err) {
        console.error('Auth proxy error:', err);
        return NextResponse.json({ message: 'Registration failed' }, { status: 500 });
    }
}
