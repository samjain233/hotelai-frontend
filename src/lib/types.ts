// ─── Hotel ────────────────────────────────────────────────
export interface Hotel {
    id: string;
    name: string;
    slug: string;
    address?: string;
    phone?: string;
    /** Guest menu room service tap-to-call; separate from main phone */
    roomServicePhone?: string;
    logoUrl?: string;
    openTime?: string;
    closeTime?: string;
    /** #RRGGBB — guest digital menu page background (omit/null = platform default) */
    guestMenuBackgroundHex?: string | null;
    /** #RRGGBB — primary text / emphasis on guest menu */
    guestMenuTextHex?: string | null;
    /** #RRGGBB — accent (links, prices, category icons, CTAs); null = default rose/crimson */
    guestMenuAccentHex?: string | null;
    /** Room QR PNG: module colour; unset = #000000 */
    qrCodeForegroundHex?: string | null;
    /** Room QR PNG: background; unset = #ffffff */
    qrCodeBackgroundHex?: string | null;
    /** When true, guest menu shows optional per-item insights (allergens, tags, spice, etc.). */
    guestMenuShowItemInsights?: boolean;
    /** Guest menu layout template id (see `guestMenuTemplates.ts` and `templates/registry.tsx`); unset = "classic". */
    guestMenuTemplate?: string;
    /** IANA timezone for category serving windows (default Asia/Kolkata). */
    timezone?: string;
    /** Epoch ms of the last guest-visible menu change (guest payload only). Polled via `/guest/menu/:slug/version`. */
    menuUpdatedAt?: number;
    /** Effective subscription tier; an inactive or missing subscription reports FREE. */
    tier?: SubscriptionTier;
    /** Features unlocked for the hotel based on subscription (see `Feature`). */
    features?: string[];
}

/** Mirrors the Prisma `SubscriptionTier` enum. FREE is the default. */
export type SubscriptionTier = 'FREE' | 'STARTER' | 'CORE' | 'PRO' | 'ENTERPRISE';

/** Mirrors backend `Feature` in `features.constant.ts`. Tier → features is decided server-side. */
export type Feature =
    // Starter
    | 'ITEM_PHOTOS'
    | 'GEMINI_IMPORT'
    | 'MENU_TEMPLATES'
    | 'CUSTOM_THEME'
    | 'REMOVE_BRANDING'
    | 'CATEGORY_SCHEDULES'
    | 'TAP_TO_CALL'
    | 'MENU_ANALYTICS'
    // Core and above
    | 'DIGITAL_ORDERING'
    | 'SERVICE_REQUESTS'
    | 'STAFF_MANAGEMENT'
    | 'AI_ANALYTICS';

export function hotelHasFeature(hotel: { features?: string[] } | null | undefined, feature: Feature): boolean {
    return hotel?.features?.includes(feature) ?? false;
}

// ─── Menu analytics (GET /admin/analytics/menu) ────────────
export type MenuAnalyticsRange = 7 | 30;

export interface MenuAnalytics {
    rangeDays: MenuAnalyticsRange;
    timezone: string;
    retentionDays: number;
    totals: {
        views: number;
        /** Same-length window before this one; null when it falls outside retention. */
        previousViews: number | null;
        dailyAverage: number;
        /** 0–23 hotel local time; null with no views. */
        peakHour: number | null;
        peakDay: { date: string; views: number } | null;
    };
    daily: { date: string; views: number }[];
    hourly: { hour: number; views: number }[];
}

// ─── Admin ────────────────────────────────────────────────
export interface Admin {
    id: string;
    email: string;
    name: string;
    role: 'OWNER' | 'GENERAL_MANAGER' | 'MANAGER' | 'KITCHEN' | 'FRONT_DESK';
}

/** GET /auth/me (hotel session; may include platform impersonation flag) */
export interface AuthMeProfile extends Admin {
    hotel: Hotel;
    createdAt?: string;
    impersonating?: boolean;
}

/** Row from GET /auth/staff (hotel team list) */
export interface StaffListMember {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: string;
    /** Present for admins created via access key; owner can revoke the key while the account remains. */
    staffInvitation?: {
        id: string;
        revokedAt: string | null;
    } | null;
}

/** Tokens are never in the body; the session lives in httpOnly cookies. */
export interface AuthResponse {
    admin: Admin;
    hotel: Hotel;
}

/** Email/password sign-up: verify inbox before login */
export interface RegisterPendingResponse {
    requiresVerification: true;
    email: string;
    message: string;
}

// ─── Menu ─────────────────────────────────────────────────
export interface MenuCategory {
    id: string;
    name: string;
    icon?: string;
    sortOrder: number;
    hotelId: string;
    /** HH:mm hotel local; both unset = category shown all day */
    serveTimeStart?: string | null;
    serveTimeEnd?: string | null;
    /** ISO weekday 1=Mon … 7=Sun; empty = all days */
    serveDaysOfWeek?: number[];
    _count?: { items: number };
    items?: MenuItem[];
}

/** One row for POST /admin/menu/bulk */
export interface BulkMenuImportRow {
    name: string;
    price: number;
    categoryId?: string;
    categoryName?: string;
    description?: string;
    imageUrl?: string;
    /** Optional aliases for guest search (e.g. Hindi + Latin); API may ignore until supported. */
    searchAliases?: string[];
    dietaryPreference?: 'VEG' | 'NON_VEG' | 'EGGITARIAN' | 'NONE';
    available?: boolean;
    spiceLevel?: 'NONE' | 'MILD' | 'MEDIUM' | 'HOT';
    allergenCodes?: string[];
    dietaryTags?: string[];
    calories?: number | null;
    portionLabel?: string | null;
    chefRecommended?: boolean;
    containsAlcohol?: boolean;
}

export interface BulkMenuImportErrorRow {
    index: number;
    message: string;
}

export interface MenuItem {
    id: string;
    name: string;
    description?: string;
    /** Optional Hindi/Latin aliases for guest search when hotels provide them (API may omit until supported). */
    searchAliases?: string[];
    price: number | string;
    imageUrl?: string;
    /** Guest menu includes sold-out items; omitted means orderable (`true`). */
    available?: boolean;
    dietaryPreference?: 'VEG' | 'NON_VEG' | 'EGGITARIAN' | 'NONE';
    spiceLevel?: 'NONE' | 'MILD' | 'MEDIUM' | 'HOT';
    allergens?: MenuTag[];
    dietaryTags?: MenuTag[];
    calories?: number | null;
    portionLabel?: string | null;
    chefRecommended?: boolean;
    containsAlcohol?: boolean;
    categoryId: string;
    category?: MenuCategory;
    hotelId: string;
    createdAt: string;
}

// ─── Guest Stay ───────────────────────────────────────────
export type StayStatus = 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';

export interface GuestStay {
    id: string;
    hotelId: string;
    roomId: string;
    groupStayId?: string | null;
    isPrimaryRoom?: boolean;
    guestName?: string | null;
    guestPhone?: string | null;
    guestEmail?: string | null;
    pin: string;
    status: StayStatus;
    checkInAt: string;
    checkOutAt?: string | null;
    orders?: Order[];
    serviceRequests?: ServiceRequest[];
    totalFoodCost?: number | string;
    room?: Room;
}

// ─── Room ─────────────────────────────────────────────────
export interface Room {
    id: string;
    number: string;
    floor?: string;
    /** null / omitted when not set at creation */
    type: string | null;
    /** Short public id for QR URLs; unique per hotel when set */
    scanCode?: string | null;
    isOccupied?: boolean;
    currentPin?: string | null;
    checkedInAt?: string | null;
    hotelId: string;
    _count?: { orders: number };
    activeStay?: GuestStay | null;
}

export interface RoomQr {
    roomId: string;
    roomNumber: string;
    floor?: string;
    type?: string;
    qrCode: string;
    menuUrl: string;
}

// ─── Order ────────────────────────────────────────────────
export type OrderStatus = 'PLACED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
    id: string;
    itemId?: string | null;
    quantity: number;
    price: number | string;
    itemName: string;
    portionLabel?: string | null;
    itemSnapshot?: Record<string, unknown> | null;
    item?: MenuItem | null;
}

export interface Order {
    id: string;
    orderNumber: number;
    roomId: string;
    room?: Room;
    stayId?: string | null;
    idempotencyKey?: string | null;
    hotelId: string;
    status: OrderStatus;
    totalAmount: number | string;
    notes?: string;
    guestName?: string;
    guestPhone?: string;
    items: OrderItem[];
    createdAt: string;
    updatedAt: string;
}

// ─── Cart ─────────────────────────────────────────────────
export interface CartItem {
    item: MenuItem;
    quantity: number;
}

// ─── Public Menu ──────────────────────────────────────────
/**
 * Slim category shape returned by guest public menu APIs. Schedule fields are present only when set;
 * the device decides visibility (`lib/guestMenuSchedule.ts`), the server does not filter by time.
 */
export interface GuestPublicMenuCategory {
    id: string;
    name: string;
    icon?: string;
    /** HH:mm in the hotel timezone; both present or both absent. */
    serveTimeStart?: string;
    serveTimeEnd?: string;
    /** ISO weekdays 1 = Monday … 7 = Sunday; absent = every day. */
    serveDaysOfWeek?: number[];
    items: MenuItem[];
}

/** No clock-dependent fields: `isOpen` is computed on the device from the hotel's hours. */
export interface PublicMenuData {
    hotel: Hotel;
    categories: GuestPublicMenuCategory[];
}

export interface PublicMenuFullData extends PublicMenuData {
    /** Only present for tiers with ordering or service requests; view-only hotels get no room inventory. */
    rooms?: { id: string; number: string; floor?: string; type?: string; scanCode?: string | null }[];
}

// ─── Service Request ──────────────────────────────────────
export type ServiceRequestType =
    | 'COMPLAINT'
    | 'SERVICE';
export type ServiceRequestStatus = 'SUBMITTED' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
export type ServiceRequestPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface ServiceRequest {
    id: string;
    type: ServiceRequestType;
    category: string;
    description?: string;
    priority: ServiceRequestPriority;
    status: ServiceRequestStatus;
    roomId: string;
    room?: Room;
    hotelId: string;

    serviceId?: string | null;

    guestName?: string;
    guestPhone?: string;
    createdAt: string;
    updatedAt: string;
}

export type MenuTag = {
    id: number;
    name: string;
    type: "ALLERGEN" | "DIETARY";
    hotelId?: string | null;
};
export interface Service {
    id: string;
    name: string;
    description?: string | null;
    icon?: string | null;
    price: number | string;
    available: boolean;
    createdAt?: string;
    updatedAt?: string;
}