// ─── Hotel ────────────────────────────────────────────────
export interface Hotel {
    id: string;
    name: string;
    slug: string;
    address?: string;
    phone?: string;
    logoUrl?: string;
    openTime?: string;
    closeTime?: string;
    /** #RRGGBB — guest digital menu page background (omit/null = platform default) */
    guestMenuBackgroundHex?: string | null;
    /** #RRGGBB — primary text / emphasis on guest menu */
    guestMenuTextHex?: string | null;
    /** #RRGGBB — accent (links, prices, category icons, CTAs); null = default rose/crimson */
    guestMenuAccentHex?: string | null;
}

// ─── Admin ────────────────────────────────────────────────
export interface Admin {
    id: string;
    email: string;
    name: string;
    role: 'OWNER' | 'MANAGER' | 'KITCHEN' | 'FRONT_DESK';
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
}

export interface AuthResponse {
    token?: string;
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
    available: boolean;
    dietaryPreference?: 'VEG' | 'NON_VEG' | 'EGGITARIAN' | 'NONE';
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
export interface PublicMenuData {
    hotel: Hotel;
    categories: (MenuCategory & { items: MenuItem[] })[];
    isOpen?: boolean;
}

export interface PublicMenuFullData extends PublicMenuData {
    rooms: { id: string; number: string; floor?: string; type?: string }[];
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
