import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { guestMenuCacheTag } from '@/lib/guestMenuFullServer';
import { clientIpHeaders } from '@/lib/proxyClientHeaders';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Purge the cached guest menu for the caller's hotel.
 *
 * `/menu/[hotelSlug]` is ISR (`revalidate = 60`), which serves the stale page once and regenerates in the
 * background, so without this an owner who saves a new template or price sees the old menu on the first
 * refresh and the new one on the second. `ApiClient` calls this after every admin mutation that feeds the
 * public menu payload. The caller is identified by forwarding their session to Nest `/auth/me`; the slug
 * comes from that response, never from the request body, so a hotel can only purge its own page.
 */
export async function POST(request: NextRequest) {
    const headers: Record<string, string> = clientIpHeaders(request);
    const cookie = request.headers.get('cookie');
    if (cookie) headers['Cookie'] = cookie;
    const authorization = request.headers.get('authorization');
    if (authorization) headers['Authorization'] = authorization;
    // Anonymous callers cannot be a hotel; answer locally instead of spending a Nest round trip per hit.
    if (!cookie && !authorization) return NextResponse.json({ message: 'Authentication required' }, { status: 401 });

    let slug: string | undefined;
    try {
        const me = await fetch(`${API_URL}/auth/me`, { headers, cache: 'no-store' });
        if (!me.ok) return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
        const profile = (await me.json()) as { hotel?: { slug?: string } };
        slug = profile.hotel?.slug?.trim() || undefined;
    } catch {
        return NextResponse.json({ message: 'Upstream unavailable' }, { status: 502 });
    }
    if (!slug) return NextResponse.json({ message: 'No hotel on session' }, { status: 400 });

    // Full Route Cache for the ISR page, plus the Data Cache entry shared with /services/[hotelSlug].
    revalidatePath(`/menu/${slug}`);
    revalidateTag(guestMenuCacheTag(slug), { expire: 0 });
    return NextResponse.json({ revalidated: true, slug });
}
