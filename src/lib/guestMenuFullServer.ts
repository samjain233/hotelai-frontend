import { cache } from "react";
import type { PublicMenuFullData } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function fetchGuestMenuFullDataUncached(hotelSlug: string): Promise<PublicMenuFullData | null> {
    try {
        const res = await fetch(`${API_URL}/guest/menu/${hotelSlug}/full`, {
            next: { revalidate: 60 },
        });
        if (res.ok) return await res.json();
    } catch {
        /* network / SSR fallback */
    }
    return null;
}

/**
 * Server-only fetch for guest menu + rooms (page + `generateMetadata`).
 * `cache()` ensures one upstream request per slug per RSC render even when both call sites run.
 */
export const fetchGuestMenuFullData = cache(fetchGuestMenuFullDataUncached);
