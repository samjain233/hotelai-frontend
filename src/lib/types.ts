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
    /** IANA timezone for category serving windows (default Asia/Kolkata). */
    timezone?: string;
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

export interface AuthResponse {
    token?: string;
    /** Present when JSON includes it (e.g. server flows); browser sessions use httpOnly cookies. */
    refreshToken?: string;
    accessMaxAgeMs?: number;
    refreshMaxAgeMs?: number;
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
    price: number;
    imageUrl?: string;
    /** Guest public menu lists only available items; field may be omitted (treated as true). */
    available?: boolean;
    dietaryPreference?: 'VEG' | 'NON_VEG' | 'EGGITARIAN' | 'NONE';
    spiceLevel?: 'NONE' | 'MILD' | 'MEDIUM' | 'HOT';
    allergenCodes?: string[];
    dietaryTags?: string[];
    calories?: number | null;
    portionLabel?: string | null;
    chefRecommended?: boolean;
    containsAlcohol?: boolean;
    categoryId: string;
    category?: MenuCategory;
    hotelId: string;
    createdAt: string;
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
    hotelId: string;
    _count?: { orders: number };
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
    itemId: string;
    quantity: number;
    price: number;
    itemName: string;
    item?: MenuItem;
}

export interface Order {
    id: string;
    orderNumber: number;
    roomId: string;
    room?: Room;
    hotelId: string;
    status: OrderStatus;
    totalAmount: number;
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
/** Slim category shape returned by guest public menu APIs (no schedule/sort metadata). */
export interface GuestPublicMenuCategory {
    id: string;
    name: string;
    icon?: string;
    items: MenuItem[];
}

export interface PublicMenuData {
    hotel: Hotel;
    categories: GuestPublicMenuCategory[];
    isOpen?: boolean;
}

export interface PublicMenuFullData extends PublicMenuData {
    rooms: { id: string; number: string; floor?: string; type?: string; scanCode?: string | null }[];
}

// ─── Service Request ──────────────────────────────────────
export type ServiceRequestType = 'COMPLAINT' | 'ROOM_SERVICE' | 'HOUSEKEEPING';
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
    guestName?: string;
    guestPhone?: string;
    createdAt: string;
    updatedAt: string;
}
