import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function POST(request: Request): Promise<NextResponse> {
    const body = (await request.json()) as HandleUploadBody;

    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (_pathname, clientPayload) => {
                const payload =
                    typeof clientPayload === 'string'
                        ? (JSON.parse(clientPayload || '{}') as { token?: string })
                        : (clientPayload as { token?: string } | null) ?? {};

                const token = payload.token;
                if (!token || typeof token !== 'string') {
                    throw new Error('Upload token required');
                }

                const res = await fetch(`${API_URL}/admin/menu/upload-token/consume`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });

                if (!res.ok) {
                    const err = await res.json().catch(() => ({ message: 'Token invalid or already used' }));
                    throw new Error(err.message || 'Token invalid or already used');
                }

                await res.json(); // consume validates token

                return {
                    allowedContentTypes: [...ALLOWED_TYPES],
                    maximumSizeInBytes: MAX_SIZE,
                    addRandomSuffix: true,
                    validUntil: Date.now() + 60_000,
                };
            },
        });

        return NextResponse.json(jsonResponse);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
