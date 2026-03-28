import type { PublicMenuFullData } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/** Server-only fetch for guest menu + hotel (used by menu page and SEO metadata). */
export async function fetchGuestMenuFullData(hotelSlug: string): Promise<PublicMenuFullData | null> {
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
