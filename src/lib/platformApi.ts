const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function useProxy(): boolean {
    if (typeof window === "undefined") return process.env.NEXT_PUBLIC_USE_PROXY === "true";
    const host = window.location.hostname;
    const isLocal = host === "localhost" || host === "127.0.0.1";
    return !isLocal || process.env.NEXT_PUBLIC_USE_PROXY === "true";
}

/** Base URL for platform API calls (matches login verification fetch). */
export function getPlatformRequestBase(): string {
    return useProxy() ? "/api" : API_URL;
}

function getKey(): string {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem("platform_key") || "";
}

async function request<T>(path: string): Promise<T> {
    const base = useProxy() ? `/api` : API_URL;
    const url = `${base}${path.startsWith("/") ? path : "/" + path}`;

    const res = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            "x-platform-key": getKey(),
        },
    });

    if (!res.ok) {
        if (res.status === 401) {
            sessionStorage.removeItem("platform_key");
            if (typeof window !== "undefined" && !window.location.pathname.includes("/superadmin/login")) {
                window.location.href = "/superadmin/login";
            }
        }
        const err = await res.json().catch(() => ({ message: "Request failed" }));
        throw new Error(err.message || `HTTP ${res.status}`);
    }

    return res.json();
}

export interface PlatformOverview {
    hotels: number;
    admins: number;
    totalOrders: number;
    totalRevenue: number;
    ordersToday: number;
    revenueToday: number;
    serviceRequests: number;
    unresolvedComplaints: number;
}

export interface PlatformHotel {
    id: string;
    name: string;
    slug: string;
    address: string | null;
    phone: string | null;
    createdAt: string;
    _count: {
        admins: number;
        rooms: number;
        menuItems: number;
        orders: number;
        serviceRequests: number;
    };
    revenue: number;
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
}

/**
 * Start hotel admin session as OWNER (platform key).
 * Always uses the Next.js route so `auth_token` is set on the app origin (required on localhost and when API is on another host).
 */
export async function enterHotelAsAdmin(hotelId: string): Promise<void> {
    const res = await fetch("/api/platform/impersonate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-platform-key": getKey(),
        },
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
    enterHotelAsAdmin,
};
