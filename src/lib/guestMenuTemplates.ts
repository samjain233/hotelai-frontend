/**
 * Catalog of guest menu layouts. Adding an id here widens `GuestMenuTemplate`, which
 * forces a matching entry in `templates/registry.tsx`. The same id must be added to
 * `GUEST_MENU_TEMPLATES` in hotel-ai `update-guest-menu-theme.dto.ts`.
 */
export const GUEST_MENU_TEMPLATES = [
    {
        id: "classic",
        name: "Classic",
        description: "A clean list with a small photo beside each dish. Fits long menus.",
    },
    {
        id: "gallery",
        name: "Gallery",
        description: "Large photo cards in a two-column grid. Best when most dishes have photos.",
    },
] as const;

export type GuestMenuTemplate = (typeof GUEST_MENU_TEMPLATES)[number]["id"];

export const DEFAULT_GUEST_MENU_TEMPLATE: GuestMenuTemplate = "classic";

export function resolveGuestMenuTemplate(value: string | null | undefined): GuestMenuTemplate {
    return GUEST_MENU_TEMPLATES.some((t) => t.id === value) ? (value as GuestMenuTemplate) : DEFAULT_GUEST_MENU_TEMPLATE;
}
