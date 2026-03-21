/**
 * Public guest menu: default is browse-only (no cart / place order).
 * Set NEXT_PUBLIC_ENABLE_GUEST_ORDERING=true to turn on ordering from the guest menu.
 */
export const ENABLE_GUEST_ORDERING = process.env.NEXT_PUBLIC_ENABLE_GUEST_ORDERING === "true";
