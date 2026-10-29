import { cache } from "react";
import type { PublicMenuFullData } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/** Data-cache tag for one hotel's public menu payload. Purged by `POST /api/revalidate-guest-menu` after admin edits. */
export function guestMenuCacheTag(hotelSlug: string): string {
    return `guest-menu:${hotelSlug}`;
}

/** The menu API failed or was unreachable (anything other than a clean 200 or 404). */
export class GuestMenuUpstreamError extends Error {
    readonly status?: number;

    constructor(hotelSlug: string, status?: number, options?: ErrorOptions) {
        super(
            status != null
                ? `Guest menu API returned ${status} for "${hotelSlug}"`
                : `Guest menu API unreachable for "${hotelSlug}"`,
            options,
        );
        this.name = "GuestMenuUpstreamError";
        this.status = status;
    }
}

/**
 * Resolves to the payload, or `null` only when the hotel slug does not exist (404) so the page can
 * `notFound()`. Every other failure throws on purpose: the menu page is ISR, and a thrown render
 * keeps serving the last good HTML, whereas returning a fallback would cache a data-less page for
 * the whole revalidate window.
 */
async function fetchGuestMenuFullDataUncached(hotelSlug: string): Promise<PublicMenuFullData | null> {
    let res: Response;
    try {
        res = await fetch(`${API_URL}/guest/menu/${encodeURIComponent(hotelSlug)}/full`, {
            next: { revalidate: 60, tags: [guestMenuCacheTag(hotelSlug)] },
        });
    } catch (cause) {
        throw new GuestMenuUpstreamError(hotelSlug, undefined, { cause });
    }
    if (res.status === 404) return null;
    if (!res.ok) throw new GuestMenuUpstreamError(hotelSlug, res.status);
    return (await res.json()) as PublicMenuFullData;
}

/**
 * Server-only fetch for guest menu + rooms (page + `generateMetadata`).
 * `cache()` ensures one upstream request per slug per RSC render even when both call sites run.
 */
export const fetchGuestMenuFullData = cache(fetchGuestMenuFullDataUncached);
