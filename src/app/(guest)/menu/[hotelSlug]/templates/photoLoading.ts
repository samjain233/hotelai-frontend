import type { MenuItem } from "@/lib/types";
import { guestMenuImageSrc } from "@/lib/guestMenuImageHosts";

/**
 * How a dish photo is fetched:
 * - `priority`: preloaded with `fetchpriority="high"` — reserve for the one or two photos that
 *   are likely the largest thing in the first viewport (the LCP candidates).
 * - `eager`: `loading="eager"` at default priority — for the rest of the first viewport. React
 *   still emits a `<link rel="preload">` for these during SSR (it does for every non-lazy
 *   <img>), so they start downloading from the HTML, just behind the `priority` ones.
 * - `lazy`: `loading="lazy"` — no preload; fetched only when scrolled near. Everything below
 *   the fold, which is what keeps the first paint's request count small.
 */
export type GuestMenuPhotoLoading = "priority" | "eager" | "lazy";

export interface GuestMenuPhotoBudget {
    /** Photos preloaded at high priority. */
    priority: number;
    /**
     * Photos fetched eagerly (includes the `priority` ones). Exactly what fits in a 390×844
     * phone viewport under the real header — measured per template, not a guess.
     */
    eager: number;
}

/**
 * One loading mode per item, counting only items that actually have a usable photo, so a dish
 * without a picture does not use up the first-viewport budget. When `enabled` is false (not the
 * first category, or the guest is searching) everything is lazy.
 */
export function planPhotoLoading(items: MenuItem[], enabled: boolean, budget: GuestMenuPhotoBudget): GuestMenuPhotoLoading[] {
    let photoRank = 0;
    return items.map((item) => {
        if (!enabled || !guestMenuImageSrc(item.imageUrl)) return "lazy";
        const rank = photoRank++;
        if (rank < budget.priority) return "priority";
        if (rank < budget.eager) return "eager";
        return "lazy";
    });
}
