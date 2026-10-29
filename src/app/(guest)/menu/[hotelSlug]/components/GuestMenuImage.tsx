"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { guestMenuImageSrc } from "@/lib/guestMenuImageHosts";
import type { GuestMenuPhotoLoading } from "../templates/photoLoading";

/**
 * `sizes` values for the two common guest-menu boxes. The page content column is
 * `max-w-md` (448px) with 16px side padding, so a full-width box is at most 416 CSS px and a
 * two-column grid cell (12px gap) at most 202px. Telling the browser the real rendered width
 * lets it pick the smallest srcset candidate instead of a 2x of the intrinsic `width`.
 */
export const GUEST_MENU_IMAGE_SIZES_FULL = "(max-width: 448px) calc(100vw - 32px), 416px";
export const GUEST_MENU_IMAGE_SIZES_HALF = "(max-width: 448px) calc(50vw - 22px), 202px";

interface GuestMenuImageProps {
    src: string;
    width: number;
    height: number;
    /**
     * Rendered CSS width of the box, as a `sizes` attribute (e.g. `"60px"`, or one of the
     * constants above). Required so phones download a candidate matched to the box rather
     * than to the intrinsic `width`.
     */
    sizes: string;
    /** How to fetch (see `GuestMenuPhotoLoading`). Templates derive this from `planPhotoLoading`. Defaults to lazy. */
    loading?: GuestMenuPhotoLoading;
    /** Applied to the <img>; size it the same way you would a bare <img>. */
    className?: string;
}

/**
 * - `pending`: the server-rendered photo, before `onLoad`. The <img> stays visible the whole
 *   time — including across hydration — so it paints progressively as bytes arrive, with the
 *   placeholder sitting behind it. Never hide it: on a slow connection most photos are still
 *   downloading when React hydrates, and hiding them then makes every photo on screen blink.
 * - `loading`: `src` changed after hydration; hide the new photo and fade it in on load.
 * - `loaded` / `error`: settled.
 */
type LoadState = "pending" | "loading" | "loaded" | "error";

/**
 * Dish photo with a blur-up placeholder, served through `next/image` so the guest's phone
 * downloads a resized WebP/AVIF rather than the hotel's original upload. A soft themed
 * surface is shown while the image downloads, then the photo fades in over it, so slow hotel
 * Wi-Fi shows a calm placeholder rather than an empty box that pops.
 *
 * Each photo appears as soon as it has downloaded, independently of the JS bundle: before
 * hydration the <img> is never hidden, so progressive display works even when scripts are
 * still on the wire. The fade only applies to photos that finish after hydration.
 *
 * Only URLs on our own storage host render (see `guestMenuImageSrc`); anything else renders
 * nothing, so templates should gate the photo box on `guestMenuImageSrc(item.imageUrl)` and
 * show their no-photo fallback otherwise. The wrapper fills whatever box the template gives
 * it; pass aspect/size classes exactly as you would on a bare <img>.
 */
export function GuestMenuImage({ src, width, height, sizes, loading = "lazy", className }: GuestMenuImageProps) {
    const [state, setState] = useState<LoadState>("pending");

    // A new src starts over (adjust-state-during-render pattern). After hydration we know the
    // new image is in flight, so go straight to `loading` for a fade-in.
    const [prevSrc, setPrevSrc] = useState(src);
    if (src !== prevSrc) {
        setPrevSrc(src);
        setState("loading");
    }

    // No hydration-time `complete` check on purpose: a photo that is mid-download when React
    // mounts must stay visible (see `LoadState`). next/image fires onLoad itself for photos that
    // finished before hydration, which drops the placeholder.

    const safeSrc = guestMenuImageSrc(src);
    if (!safeSrc) return null;

    return (
        <span className="relative block h-full w-full">
            {state !== "loaded" && (
                <span
                    aria-hidden
                    className={cn(
                        "absolute inset-0 bg-gradient-to-br from-[var(--guest-surface-2)] to-[var(--guest-shimmer)]",
                        state !== "error" && "animate-pulse",
                    )}
                />
            )}
            <Image
                src={safeSrc}
                alt=""
                width={width}
                height={height}
                sizes={sizes}
                priority={loading === "priority"}
                // Next's `priority` no longer sets fetchpriority; set it ourselves so the LCP
                // candidates are fetched ahead of the other first-viewport photos.
                fetchPriority={loading === "priority" ? "high" : undefined}
                loading={loading === "lazy" ? "lazy" : "eager"}
                onLoad={() => setState("loaded")}
                onError={() => setState("error")}
                className={cn(
                    "relative transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none",
                    state === "loading" || state === "error" ? "opacity-0" : "opacity-100",
                    className,
                )}
            />
        </span>
    );
}
