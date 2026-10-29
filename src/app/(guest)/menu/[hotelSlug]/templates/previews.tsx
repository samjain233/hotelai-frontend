"use client";

import type { GuestMenuTemplate } from "@/lib/guestMenuTemplates";
import { bistroPreview } from "./bistro.preview";
import { boardPreview } from "./board.preview";
import { boldPreview } from "./bold.preview";
import { carouselPreview } from "./carousel.preview";
import { classicPreview } from "./classic.preview";
import { compactPreview } from "./compact.preview";
import { editorialPreview } from "./editorial.preview";
import { galleryPreview } from "./gallery.preview";
import { heritagePreview } from "./heritage.preview";
import { mosaicPreview } from "./mosaic.preview";
import { serenePreview } from "./serene.preview";
import { showcasePreview } from "./showcase.preview";
import { spotlightPreview } from "./spotlight.preview";
import type { GuestMenuTemplatePreview } from "./types";

/**
 * Admin-only half of every template (picker thumbnail + phone-mock dishes), loaded eagerly because the
 * Menu design page shows all of them at once. The guest menu never imports this file; see `registry.tsx`.
 */
export const GUEST_MENU_TEMPLATE_PREVIEWS: Record<GuestMenuTemplate, GuestMenuTemplatePreview> = {
    classic: classicPreview,
    gallery: galleryPreview,
    showcase: showcasePreview,
    editorial: editorialPreview,
    board: boardPreview,
    heritage: heritagePreview,
    compact: compactPreview,
    serene: serenePreview,
    bistro: bistroPreview,
    bold: boldPreview,
    carousel: carouselPreview,
    spotlight: spotlightPreview,
    mosaic: mosaicPreview,
};
