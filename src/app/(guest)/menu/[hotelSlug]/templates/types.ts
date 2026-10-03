import type { ComponentType, ReactNode } from "react";
import type { MenuItem } from "@/lib/types";

/** Props every guest-menu template receives for one category's dishes. */
export interface GuestMenuDishListProps {
    items: MenuItem[];
    /** True for the first category while the guest is not searching. Templates decide how many images load eagerly. */
    prioritizeImages: boolean;
}

/**
 * What a template must provide.
 * DishList is the real guest menu. Thumbnail and PreviewDishes are the admin picker and phone mock.
 * Colours stay on the guest CSS variables; a template only owns layout.
 */
export interface GuestMenuTemplateModule {
    /** Wraps the whole menu. Use it for state shared across categories; otherwise render children as-is. */
    State: ComponentType<{ children: ReactNode }>;
    DishList: ComponentType<GuestMenuDishListProps>;
    Thumbnail: ComponentType;
    PreviewDishes: ComponentType;
}
