import type { ComponentType } from "react";
import type { GuestMenuTemplate } from "@/lib/guestMenuTemplates";
import type { GuestMenuSectionsProps } from "./types";

type SectionsModule = { default: ComponentType<GuestMenuSectionsProps> };

/**
 * Server-side counterpart of `registry.tsx`, used by the guest page (a Server Component).
 *
 * The page awaits the hotel's loader and passes the resulting client reference to
 * `GuestMenuClient` as a prop. Because the reference is part of the RSC payload, its chunk is in
 * the page's initial script list and is loaded before hydration starts.
 *
 * Bundle trade-off: Turbopack puts every client reference reachable from this route into one
 * chunk group, so the 13 templates ship as a single ~75 KB chunk (~18 KB gzip, ~16 KB brotli)
 * even with per-template `import()`. The `next/dynamic` registry split them (~9 KB each) but
 * caused the flash below. The ~15 KB gzip difference is well inside the 2 s splash hold.
 *
 * Why not render the `next/dynamic` entry from `registry.tsx` on first load: that is a
 * `React.lazy` whose promise is still pending when hydration runs, so its Suspense boundary stays
 * dehydrated, and React client-renders a dehydrated boundary — server HTML out, `loading` skeleton
 * in, content back a few ms later — the moment any update or context change reaches it (the splash
 * finishing, the first scroll-spy `setActiveCategory`, a new provider value). A resolved component
 * reference has nothing pending, so the menu hydrates in place.
 */
export const GUEST_MENU_TEMPLATE_LOADERS: Record<GuestMenuTemplate, () => Promise<SectionsModule>> = {
    classic: () => import("./classic"),
    gallery: () => import("./gallery"),
    showcase: () => import("./showcase"),
    editorial: () => import("./editorial"),
    board: () => import("./board"),
    heritage: () => import("./heritage"),
    compact: () => import("./compact"),
    serene: () => import("./serene"),
    bistro: () => import("./bistro"),
    bold: () => import("./bold"),
    carousel: () => import("./carousel"),
    spotlight: () => import("./spotlight"),
    mosaic: () => import("./mosaic"),
};

export async function loadGuestMenuTemplateSections(template: GuestMenuTemplate) {
    return (await GUEST_MENU_TEMPLATE_LOADERS[template]()).default;
}
