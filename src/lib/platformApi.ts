import type { SubscriptionTier } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/** True when platform calls should go through the Next.js `/api` proxy (anything that is not plain localhost). */
function shouldUseProxy(): boolean {
    if (typeof window === "undefined") return process.env.NEXT_PUBLIC_USE_PROXY === "true";
    const host = window.location.hostname;
    const isLocal = host === "localhost" || host === "127.0.0.1";
    return !isLocal || process.env.NEXT_PUBLIC_USE_PROXY === "true";
}

/** Base URL for platform API calls (matches login verification fetch). */
export function getPlatformRequestBase(): string {
    return shouldUseProxy() ? "/api" : API_URL;
}

// ─── Platform key storage ──────────────────────────────────
// sessionStorage by default (gone when the tab closes); localStorage when the super-admin
// ticks "keep me signed in on this device". Only one of the two is ever populated.

const KEY_NAME = "platform_key";
/** Fired on `window` after the key changes in this tab, so `usePlatformKey()` re-reads it. */
export const PLATFORM_KEY_EVENT = "platform-key-change";

export function getPlatformKey(): string {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem(KEY_NAME) || localStorage.getItem(KEY_NAME) || "";
}

export function isPlatformKeyRemembered(): boolean {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(KEY_NAME);
}

export function setPlatformKey(key: string, remember: boolean): void {
    sessionStorage.removeItem(KEY_NAME);
    localStorage.removeItem(KEY_NAME);
    (remember ? localStorage : sessionStorage).setItem(KEY_NAME, key);
    window.dispatchEvent(new Event(PLATFORM_KEY_EVENT));
}

export function clearPlatformKey(): void {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(KEY_NAME);
    localStorage.removeItem(KEY_NAME);
    window.dispatchEvent(new Event(PLATFORM_KEY_EVENT));
}

function headers(): Record<string, string> {
    return { "Content-Type": "application/json", "x-platform-key": getPlatformKey() };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${getPlatformRequestBase()}${path.startsWith("/") ? path : "/" + path}`;
    const res = await fetch(url, { ...init, headers: { ...headers(), ...(init?.headers as Record<string, string> | undefined) } });

    if (!res.ok) {
        if (res.status === 401) {
            clearPlatformKey();
            if (typeof window !== "undefined" && !window.location.pathname.includes("/superadmin/login")) {
                window.location.href = "/superadmin/login";
            }
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

/**
 * Start hotel admin session as OWNER (platform key).
 * Always uses the Next.js route so `auth_token` is set on the app origin (required on localhost and when API is on another host).
 */
export async function enterHotelAsAdmin(hotelId: string): Promise<void> {
    const res = await fetch("/api/platform/impersonate", {
        method: "POST",
        headers: headers(),
        credentials: "include",
        body: JSON.stringify({ hotelId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error((data as { message?: string }).message || `HTTP ${res.status}`);
    }
}

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
