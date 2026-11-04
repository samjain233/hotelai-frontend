import type { SubscriptionTier } from "./types";

/** Full-page navigation target that starts the super-admin Google sign-in. */
export const PLATFORM_GOOGLE_SIGN_IN_URL = "/api/auth/google/superadmin";

/**
 * Always the same-origin `/api` proxy: the `platform_session` cookie is SameSite=Strict on this origin,
 * so calling the API host directly would arrive without it.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`/api${path}`, {
        ...init,
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", ...(init?.headers as Record<string, string> | undefined) },
    });

    if (!res.ok) {
        if (res.status === 401 && typeof window !== "undefined" && !window.location.pathname.startsWith("/superadmin/login")) {
            window.location.href = "/superadmin/login";
        }
        const err = (await res.json().catch(() => ({ message: "Request failed" }))) as { message?: string | string[] };
        const message = Array.isArray(err.message) ? err.message.join(", ") : err.message;
        throw new Error(message || `HTTP ${res.status}`);
    }

    return res.json();
}

// ─── Types (mirror backend PlatformService responses) ──────

export type TierCounts = Record<SubscriptionTier, number>;

export interface ExpiringSubscription {
    hotelId: string;
    hotelName: string;
    tier: SubscriptionTier;
    expiresAt: string;
}

export interface PlatformOverview {
    hotels: number;
    admins: number;
    byTier: TierCounts;
    newHotels7d: number;
    newHotels30d: number;
    billing: {
        paidHotels: number;
        /** INR per month across active paid subscriptions. */
        mrrInr: number;
        expiringSoonDays: number;
        expiringSoon: ExpiringSubscription[];
        expired: ExpiringSubscription[];
    };
    menuViews: { last7d: number; last30d: number; hotelsViewed7d: number };
    onboarding: { withoutMenu: number; withoutQr: number };
    ai: { calls30d: number; estimatedCostUsd30d: number };
    ordering: { totalOrders: number; totalRevenue: number; ordersToday: number; unresolvedComplaints: number };
}

export interface HotelSubscription {
    tier: SubscriptionTier;
    isActive: boolean;
    paidAt: string | null;
    expiresAt: string | null;
    amountPaise: number | null;
    paymentRef: string | null;
    note: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface PlatformHotel {
    id: string;
    name: string;
    slug: string;
    address: string | null;
    phone: string | null;
    roomServicePhone: string | null;
    logoUrl: string | null;
    guestMenuTemplate: string;
    createdAt: string;
    qrDownloadedAt: string | null;
    lastActiveAt: string | null;
    subscription: Pick<HotelSubscription, "tier" | "isActive" | "paidAt" | "expiresAt" | "amountPaise"> | null;
    /** Effective tier after inactive/missing subscriptions fall back to FREE. */
    tier: SubscriptionTier;
    /** Item cap for the effective tier; null = unlimited. */
    maxMenuItems: number | null;
    menuViews7d: number;
    menuViews30d: number;
    _count: {
        admins: number;
        rooms: number;
        menuItems: number;
        categories: number;
        orders: number;
        serviceRequests: number;
    };
}

export interface PlatformHotelDetail {
    id: string;
    name: string;
    slug: string;
    address: string | null;
    phone: string | null;
    logoUrl: string | null;
    openTime: string | null;
    closeTime: string | null;
    createdAt: string;
    qrDownloadedAt: string | null;
    guestMenuTemplate: string;
    /** Effective tier after inactive/missing subscriptions fall back to FREE. */
    tier: SubscriptionTier;
    maxMenuItems: number | null;
    menuViews7d: number;
    menuViews30d: number;
    _count: {
        admins: number;
        rooms: number;
        menuItems: number;
        orders: number;
        serviceRequests: number;
        categories: number;
    };
    revenue: number;
    recentOrders: {
        id: string;
        orderNumber: number;
        status: string;
        totalAmount: number;
        createdAt: string;
        room: { number: string } | null;
    }[];
    recentComplaints: {
        id: string;
        type: string;
        category: string | null;
        status: string;
        priority: string;
        description: string;
        createdAt: string;
        room: { number: string } | null;
    }[];
    admins: {
        id: string;
        name: string;
        email: string;
        role: string;
        createdAt: string;
    }[];
    subscription: HotelSubscription | null;
    aiUsage: HotelAiUsageSummary;
}

/** PATCH body. Omit a field to leave it unchanged; send `null` to clear it. */
export interface UpdateSubscriptionPayload {
    tier: SubscriptionTier;
    isActive: boolean;
    paidAt?: string | null;
    expiresAt?: string | null;
    amountPaise?: number | null;
    paymentRef?: string | null;
    note?: string | null;
}

// ─── AI usage (Gemini calls per hotel) ─────────────────────
export type AiFeature = "MENU_SCAN";
export type AiUsageStatus = "OK" | "REJECTED" | "ERROR";

export interface AiUsageTotals {
    calls: number;
    okCalls: number;
    rejectedCalls: number;
    errorCalls: number;
    promptTokens: number;
    outputTokens: number;
    totalTokens: number;
    /** Estimated from token counts and the server pricing table; not the Google invoice. */
    estimatedCostUsd: number;
}

export interface HotelAiUsageSummary {
    thisMonth: AiUsageTotals;
    allTime: AiUsageTotals;
    lastUsedAt: string | null;
    unpricedModels: string[];
    recent: {
        id: string;
        feature: AiFeature;
        model: string;
        status: AiUsageStatus;
        totalTokens: number;
        estimatedCostUsd: number;
        latencyMs: number;
        resultCount: number;
        createdAt: string;
    }[];
}

export interface PlatformAiUsage {
    totals: AiUsageTotals;
    byHotel: { hotelId: string; hotelName: string; calls: number; totalTokens: number; estimatedCostUsd: number }[];
}

export interface PlatformComplaint {
    id: string;
    type: string;
    category: string | null;
    description: string;
    priority: string;
    status: string;
    guestName: string | null;
    createdAt: string;
    updatedAt: string;
    room: { number: string } | null;
    hotel: { id: string; name: string };
}

export interface PlatformAnalytics {
    dailyOrders: { date: string; orders: number; revenue: number }[];
    topHotels: { hotelId: string; hotelName: string; orders: number; revenue: number }[];
    topItems: { itemName: string; totalQty: number }[];
    /** Gemini usage across the platform, last 30 days. */
    aiUsage: PlatformAiUsage;
}

export interface PlatformSessionInfo {
    email: string;
    signedInAt: string;
    /** Hard end of this sign-in (8 hours after it started). */
    expiresAt: string;
    idleTimeoutMinutes: number;
}

/**
 * Opens the hotel admin as its owner for up to an hour. The proxy forwards Nest's `auth_token` cookies
 * so they land on this origin.
 */
export async function enterHotelAsAdmin(hotelId: string): Promise<void> {
    await request<unknown>(`/platform/hotels/${encodeURIComponent(hotelId)}/impersonate-admin`, { method: "POST" });
}

export const platformAuth = {
    /** Rejects (and redirects to the login page) when signed out. */
    me: () => request<PlatformSessionInfo>("/platform/auth/me"),
    logout: () => request<{ message: string }>("/platform/auth/logout", { method: "POST" }),
    logoutEverywhere: () => request<{ message: string }>("/platform/auth/logout-all", { method: "POST" }),
};

export const platformApi = {
    getOverview: () => request<PlatformOverview>("/platform/overview"),
    getHotels: () => request<PlatformHotel[]>("/platform/hotels"),
    getHotelDetail: (id: string) => request<PlatformHotelDetail>(`/platform/hotels/${id}`),
    getComplaints: (params?: Record<string, string>) => {
        const qs = params ? "?" + new URLSearchParams(params).toString() : "";
        return request<PlatformComplaint[]>(`/platform/complaints${qs}`);
    },
    getAnalytics: () => request<PlatformAnalytics>("/platform/analytics"),
    updateHotelSubscription: (hotelId: string, payload: UpdateSubscriptionPayload) =>
        request<HotelSubscription>(`/platform/hotels/${hotelId}/subscription`, {
            method: "PATCH",
            body: JSON.stringify(payload),
        }),
    enterHotelAsAdmin,
};
