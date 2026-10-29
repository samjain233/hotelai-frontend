import type { ComponentType, ReactNode } from "react";
import type { GuestPublicMenuCategory, MenuItem } from "@/lib/types";

/** Props every guest-menu template receives for one category's dishes. */
export interface GuestMenuDishListProps {
    items: MenuItem[];
    /** True for the first category while the guest is not searching. Templates decide how many images load eagerly. */
    prioritizeImages: boolean;
}

/**
 * The live guest menu half of a template (`templates/<id>.tsx`). Loaded on demand, so a guest only
 * downloads the template their hotel uses. Colours stay on the guest CSS variables; a template only owns layout.
 */
export interface GuestMenuTemplateRuntime {
    /** Wraps the whole menu. Use it for state shared across categories; otherwise render children as-is. */
    State: ComponentType<{ children: ReactNode }>;
    DishList: ComponentType<GuestMenuDishListProps>;
}

/**
 * The admin half of a template (`templates/<id>.preview.tsx`): picker thumbnail and phone-mock dishes.
 * Keep these free of guest components so the Menu design page does not pull in every template's runtime.
 */
export interface GuestMenuTemplatePreview {
    Thumbnail: ComponentType;
    PreviewDishes: ComponentType;
}

/** Props for a template's full menu renderer (all categories), produced by `templates/registry.tsx`. */
export interface GuestMenuSectionsProps {
    displayCategories: GuestPublicMenuCategory[];
    searchNormalized: string;
}
