/**
 * Catalog of guest menu layouts. Adding an id here widens `GuestMenuTemplate`, which
 * forces matching entries in `templates/registry.tsx` and `templates/previews.tsx`. The same id must be added to
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
    {
        id: "showcase",
        name: "Showcase",
        description: "Full-width magazine cards with the name and price set over the photo. Best for short, signature menus.",
    },
    {
        id: "editorial",
        name: "Editorial",
        description: "Printed-menu typography: serif dish names, dotted price leaders, no cards. Suits fine dining and menus without photos.",
    },
    {
        id: "board",
        name: "Board",
        description: "Café chalkboard: condensed uppercase names, big prices, dashed frame. Casual and fast to scan.",
    },
    {
        id: "heritage",
        name: "Heritage",
        description: "Palace-menu elegance: centred Garamond, double-rule frame, italic notes. For heritage and boutique properties.",
    },
    {
        id: "compact",
        name: "Compact",
        description: "Dense one-line rows, tap to expand photo and details. Built for long menus with 100+ dishes.",
    },
    {
        id: "serene",
        name: "Serene",
        description: "Calm and airy: light type, wide soft-edged photos, whitespace instead of lines. A resort and wellness feel.",
    },
    {
        id: "bistro",
        name: "Bistro",
        description: "Numbered dishes with monospace prices and thin rules. Guests can order by number; suits cafés and all-day kitchens.",
    },
    {
        id: "bold",
        name: "Bold",
        description: "Extra-heavy names, prices in a filled accent pill, round photos. Loud and youthful for rooftop bars, hostels and cafés.",
    },
    {
        id: "carousel",
        name: "Carousel",
        description: "Each category is a swipeable row of photo cards, the food-app pattern guests already know. Keeps long menus short on screen.",
    },
    {
        id: "spotlight",
        name: "Spotlight",
        description: "Chef's picks lead each category as big hero cards; the rest follow as a tight list. Built to sell your signature dishes.",
    },
    {
        id: "mosaic",
        name: "Mosaic",
        description: "Bento grid: a wide hero tile, then square photo tiles with the name and price set over the image. Dishes without photos become colour tiles. Striking for photo-rich menus.",
    },
] as const;

export type GuestMenuTemplate = (typeof GUEST_MENU_TEMPLATES)[number]["id"];

export const DEFAULT_GUEST_MENU_TEMPLATE: GuestMenuTemplate = "classic";

export function resolveGuestMenuTemplate(value: string | null | undefined): GuestMenuTemplate {
    return GUEST_MENU_TEMPLATES.some((t) => t.id === value) ? (value as GuestMenuTemplate) : DEFAULT_GUEST_MENU_TEMPLATE;
}
