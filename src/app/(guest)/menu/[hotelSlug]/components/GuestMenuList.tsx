"use client";

import { memo, type ComponentType } from "react";
import type { GuestMenuTemplate } from "@/lib/guestMenuTemplates";
import { GUEST_MENU_TEMPLATE_RENDERERS } from "../templates/registry";
import type { GuestMenuSectionsProps } from "../templates/types";

interface GuestMenuListProps extends GuestMenuSectionsProps {
    /** Template the hotel currently uses (live data). */
    template: GuestMenuTemplate;
    /** Template the page was server-rendered with, and its renderer shipped in the initial bundle. */
    serverTemplate?: GuestMenuTemplate;
    ServerSections?: ComponentType<GuestMenuSectionsProps>;
}

/**
 * Mounts the hotel's template renderer.
 *
 * On a normal load the page passes the renderer in as a client reference (`templates/serverRegistry.ts`),
 * so it is already loaded when hydration runs and the server HTML hydrates in place. The code-split
 * `registry.tsx` entry is only used if the hotel's template changes while the page is open (SWR
 * revalidation after an admin edit); that path shows `GuestMenuSectionsSkeleton` while the new chunk
 * downloads, which is fine post-hydration.
 *
 * Memoised so unrelated parent re-renders do not reach the renderer.
 */
export const GuestMenuList = memo(function GuestMenuList({
    template,
    serverTemplate,
    ServerSections,
    displayCategories,
    searchNormalized,
}: GuestMenuListProps) {
    const TemplateSections =
        ServerSections && template === serverTemplate ? ServerSections : GUEST_MENU_TEMPLATE_RENDERERS[template];
    return <TemplateSections displayCategories={displayCategories} searchNormalized={searchNormalized} />;
});
