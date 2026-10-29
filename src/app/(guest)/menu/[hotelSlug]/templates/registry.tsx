"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { GuestMenuTemplate } from "@/lib/guestMenuTemplates";
import { GuestMenuSectionsSkeleton } from "../components/GuestMenuCategorySections";
import type { GuestMenuSectionsProps } from "./types";

/**
 * Guest menu layouts, code-split per template. A guest downloads only the chunk for their hotel's template.
 *
 * Each entry must be a direct `dynamic(() => import("./<id>"), { loading })` call with the `import()`
 * and the options object both written literally inside it. Next's compiler only recognises that shape;
 * it then preloads the chunk from the SSR HTML so it arrives with the main bundle and hydration does
 * not suspend. Wrapping the import in a helper (or a `.then()` that builds a component) silently loses
 * the preload, and on a slow network the server-rendered menu is replaced by
 * `GuestMenuSectionsSkeleton` until the chunk downloads.
 *
 * To add a template:
 * 1. Add its id, name, and description in `src/lib/guestMenuTemplates.ts`.
 * 2. Add the same id to `GUEST_MENU_TEMPLATES` in hotel-ai `update-guest-menu-theme.dto.ts`.
 * 3. Create `templates/<id>.tsx` (State + DishList + default `<Id>Sections` export) and
 *    `templates/<id>.preview.tsx` (Thumbnail + PreviewDishes).
 * 4. Register the runtime here and the preview in `previews.tsx`. TypeScript fails the build if either map is missing an id.
 *
 * Do not branch on the template id anywhere else.
 */
export const GUEST_MENU_TEMPLATE_RENDERERS: Record<GuestMenuTemplate, ComponentType<GuestMenuSectionsProps>> = {
    classic: dynamic(() => import("./classic"), { loading: GuestMenuSectionsSkeleton }),
    gallery: dynamic(() => import("./gallery"), { loading: GuestMenuSectionsSkeleton }),
    showcase: dynamic(() => import("./showcase"), { loading: GuestMenuSectionsSkeleton }),
    editorial: dynamic(() => import("./editorial"), { loading: GuestMenuSectionsSkeleton }),
    board: dynamic(() => import("./board"), { loading: GuestMenuSectionsSkeleton }),
    heritage: dynamic(() => import("./heritage"), { loading: GuestMenuSectionsSkeleton }),
    compact: dynamic(() => import("./compact"), { loading: GuestMenuSectionsSkeleton }),
    serene: dynamic(() => import("./serene"), { loading: GuestMenuSectionsSkeleton }),
    bistro: dynamic(() => import("./bistro"), { loading: GuestMenuSectionsSkeleton }),
    bold: dynamic(() => import("./bold"), { loading: GuestMenuSectionsSkeleton }),
    carousel: dynamic(() => import("./carousel"), { loading: GuestMenuSectionsSkeleton }),
    spotlight: dynamic(() => import("./spotlight"), { loading: GuestMenuSectionsSkeleton }),
    mosaic: dynamic(() => import("./mosaic"), { loading: GuestMenuSectionsSkeleton }),
};
