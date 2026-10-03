"use client";

import type { GuestMenuTemplate } from "@/lib/guestMenuTemplates";
import { classicTemplate } from "./classic";
import { galleryTemplate } from "./gallery";
import type { GuestMenuTemplateModule } from "./types";

/**
 * Guest menu layouts. To add a template:
 * 1. Add its id, name, and description in `src/lib/guestMenuTemplates.ts`.
 * 2. Add the same id to `GUEST_MENU_TEMPLATES` in hotel-ai `update-guest-menu-theme.dto.ts`.
 * 3. Add a module here. TypeScript fails the build if this map is missing an id.
 *
 * DishList renders the live menu. Thumbnail and PreviewDishes feed Menu design.
 * Do not branch on the template id anywhere else.
 */
export const GUEST_MENU_TEMPLATE_REGISTRY: Record<GuestMenuTemplate, GuestMenuTemplateModule> = {
    classic: classicTemplate,
    gallery: galleryTemplate,
};
