import {
    AuthMeProfile,
    AuthResponse,
    Hotel,
    StaffListMember,
    MenuCategory,
    BulkMenuImportErrorRow,
    BulkMenuImportRow,
    MenuItem,
    MenuTag,
    Room,
    RoomQr,
    Order,
    PublicMenuData,
    Service,
    ServiceRequest,
    RegisterPendingResponse,
    GuestStay,
    MenuAnalytics,
    MenuAnalyticsRange,
} from './types';
import type { GuestMenuTemplate } from './guestMenuTemplates';
import { isUnauthenticatedRoute, loginUrlFor } from './routes';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Non-2xx response from the API. `status` is the HTTP status; `code` is the backend's optional
 * machine-readable error code (e.g. stay-access errors), which callers should switch on instead of
 * matching `message` text.
 */
export class ApiError extends Error {
    readonly status: number;
    readonly code?: string;

    constructor(message: string, status: number, code?: string) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
    }

    /** 4xx: the backend's message describes something the guest did or can act on. */
    get isClientError(): boolean {
        return this.status >= 400 && this.status < 500;
    }
}

/** Reads `message` (string or class-validator array) and `code` out of a Nest error body. */
function parseApiErrorBody(body: unknown, status: number): { message: string; code?: string } {
    const b = (body ?? {}) as { message?: unknown; code?: unknown };
    const message = Array.isArray(b.message)
        ? b.message.map(String).join(', ')
        : typeof b.message === 'string' && b.message
          ? b.message
          : `HTTP ${status}`;
    const code = typeof b.code === 'string' && b.code ? b.code : undefined;
    return { message, code };
}

/**
 * Message safe to show a guest for a failed action: the backend's text for 4xx (validation,
 * closed hours, unavailable items), a generic one for 5xx / network failures.
 */
export function guestFacingErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof ApiError && err.isClientError) return err.message;
    return fallback;
}

/** Use same-origin /api proxy when not on localhost (e.g. Vercel) so cookies work for SSE */
export function shouldUseSameOriginApiProxy(): boolean {
    if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_USE_PROXY === 'true';
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1';
    return !isLocal || process.env.NEXT_PUBLIC_USE_PROXY === 'true';
}

let refreshInFlight: Promise<boolean> | null = null;

/**
 * POST `/auth/refresh` (or Next proxy). Shared by API client, SSE hooks, etc.
 *
 * Single-flight: on a page load several requests can 401 at once (profile, navigation, page data).
 * Refresh tokens rotate, so letting each of them call /auth/refresh races the rotation; the server
 * tolerates one stale token, not several. All concurrent callers share one refresh here.
 */
export function refreshHotelSession(): Promise<boolean> {
    if (typeof window === 'undefined') return Promise.resolve(false);
    if (refreshInFlight) return refreshInFlight;
    const refreshUrl = shouldUseSameOriginApiProxy()
        ? '/api/auth/refresh'
        : `${API_URL}/auth/refresh`;
    refreshInFlight = fetch(refreshUrl, { method: 'POST', credentials: 'include' })
        .then((ref) => ref.ok)
        .catch(() => false)
        .finally(() => {
            refreshInFlight = null;
        });
    return refreshInFlight;
}

/** Hard-redirect to /login, remembering the current page so sign-in can return to it. */
function redirectToLoginFromCurrentPage(): void {
    if (typeof window === 'undefined') return;
    const { pathname, search } = window.location;
    if (isUnauthenticatedRoute(pathname)) return;
    window.location.href = loginUrlFor(pathname, search);
}

/**
 * Admin writes that change what `GET /guest/menu/:slug/full` returns (hotel profile/theme, categories,
 * dishes, availability, rooms, tags). Upload tokens and AI extraction do not touch the menu until a
 * follow-up write, which is matched on its own.
 */
const GUEST_MENU_MUTATION_PREFIXES = ['/auth/hotel', '/admin/menu', '/admin/categories', '/admin/rooms', '/tags'];
const GUEST_MENU_MUTATION_IGNORE = ['/upload-token', '/extract-from-image'];

export function affectsGuestMenu(path: string, method: string | undefined): boolean {
    if (!method || method.toUpperCase() === 'GET' || method.toUpperCase() === 'HEAD') return false;
    const clean = path.split('?')[0];
    if (GUEST_MENU_MUTATION_IGNORE.some((p) => clean.includes(p))) return false;
    return GUEST_MENU_MUTATION_PREFIXES.some((p) => clean === p || clean.startsWith(`${p}/`));
}

/**
 * Purge the ISR-cached guest menu for the signed-in hotel so the next scan or refresh shows the change
 * immediately instead of the stale page that `revalidate = 60` would serve once. Same-origin on purpose:
 * only the Next server can call `revalidatePath`. Awaited so "Open guest menu" right after Save is fresh;
 * failures are swallowed because the ISR window still catches up within a minute.
 */
export async function revalidateGuestMenuCache(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
        await fetch('/api/revalidate-guest-menu', { method: 'POST', credentials: 'include' });
    } catch {
        /* best effort */
    }
}

class ApiClient {
    private async refreshSessionOnce(): Promise<boolean> {
        return refreshHotelSession();
    }

    private async request<T>(path: string, options: RequestInit = {}, allowRefreshRetry = true): Promise<T> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        };

        const url = shouldUseSameOriginApiProxy()
            ? `/api${path.startsWith('/') ? path : '/' + path}`
            : `${API_URL}${path}`;
        const res = await fetch(url, {
            ...options,
            headers,
            credentials: 'include',
        });

        if (!res.ok) {
            const body: unknown = await res.json().catch(() => ({ message: 'Request failed' }));
            const { message, code } = parseApiErrorBody(body, res.status);

            if (
                res.status === 401 &&
                allowRefreshRetry &&
                typeof window !== 'undefined' &&
                !path.includes('/auth/refresh') &&
                !path.includes('/auth/login') &&
                !path.includes('/auth/register') &&
                !path.includes('/auth/verify-email') &&
                !path.includes('/auth/staff/access') &&
                !path.includes('/auth/staff-access')
            ) {
                if (await this.refreshSessionOnce()) {
                    return this.request<T>(path, options, false);
                }
            }

            if (res.status === 401) {
                // No redirect on public/auth/superadmin routes (would loop); see routes.ts.
                redirectToLoginFromCurrentPage();
            }

            throw new ApiError(message, res.status, code);
        }

        const json = (await res.json()) as T;
        if (affectsGuestMenu(path, options.method)) await revalidateGuestMenuCache();
        return json;
    }

    /** GET request for SWR fetcher. Same credentials/error handling as request. */
    async get<T>(path: string): Promise<T> {
        return this.request<T>(path);
    }

    async logout(): Promise<void> {
        await this.request('/auth/logout', { method: 'POST' });
    }

    // ─── Auth ─────────────────────────────────────────────

    async register(data: {
        hotelName: string;
        adminName: string;
        email: string;
        password: string;
        hotelPhone?: string;
    }): Promise<RegisterPendingResponse> {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async verifyEmail(token: string): Promise<AuthResponse> {
        return this.request('/auth/verify-email', {
            method: 'POST',
            body: JSON.stringify({ token }),
        });
    }

    async resendVerification(email: string): Promise<{ message: string }> {
        return this.request('/auth/resend-verification', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    async login(email: string, password: string): Promise<AuthResponse> {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    /**
     * Staff access key (no email/password). Uses dedicated Next route when proxied so httpOnly cookie is set.
     * Does not use request() — wrong keys return 401 and must not trigger a redirect to /login.
     */
    async staffAccessWithKey(key: string): Promise<AuthResponse> {
        const url = shouldUseSameOriginApiProxy()
            ? '/api/auth/staff-access'
            : `${API_URL}/auth/staff/access`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ key: key.trim() }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error((data as { message?: string }).message || 'Invalid or expired access key');
        }
        return {
            admin: (data as AuthResponse).admin,
            hotel: (data as AuthResponse).hotel,
        };
    }

    async forgotPassword(email: string): Promise<{ message: string }> {
        return this.request('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    async resetPassword(token: string, password: string): Promise<{ message: string }> {
        return this.request('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, password }),
        });
    }

    async getProfile(): Promise<AuthMeProfile> {
        return this.request('/auth/me');
    }

    async updateHotel(data: {
        name?: string;
        address?: string;
        phone?: string;
        roomServicePhone?: string;
        logoUrl?: string;
        openTime?: string;
        closeTime?: string;
        timezone?: string;
    }) {
        return this.request<Hotel>('/auth/hotel', {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    /** OWNER, GENERAL_MANAGER, or MANAGER — set hex like #RRGGBB, or "" to clear one field */
    async updateGuestMenuTheme(data: {
        guestMenuBackgroundHex?: string;
        guestMenuTextHex?: string;
        guestMenuAccentHex?: string;
        qrCodeForegroundHex?: string;
        qrCodeBackgroundHex?: string;
        guestMenuShowItemInsights?: boolean;
        guestMenuTemplate?: GuestMenuTemplate;
    }) {
        return this.request<Hotel>('/auth/hotel/guest-menu-theme', {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async getHotelLogoUploadPathname(token: string): Promise<{ pathname: string }> {
        return this.request('/admin/hotel/upload-token/pathname', {
            method: 'POST',
            body: JSON.stringify({ token }),
        });
    }

    // ─── Categories ───────────────────────────────────────

    async getCategories(): Promise<MenuCategory[]> {
        return this.request('/admin/categories');
    }

    async createCategory(data: {
        name: string;
        icon?: string;
        serveTimeStart?: string | null;
        serveTimeEnd?: string | null;
        serveDaysOfWeek?: number[];
    }): Promise<MenuCategory> {
        return this.request('/admin/categories', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateCategory(id: string, data: Partial<MenuCategory>): Promise<MenuCategory> {
        return this.request(`/admin/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteCategory(id: string): Promise<void> {
        return this.request(`/admin/categories/${id}`, { method: 'DELETE' });
    }

    // ─── Menu Items ───────────────────────────────────────

    async getTags(): Promise<MenuTag[]> {
        return this.request<MenuTag[]>('/tags');
    }

    async createTag(data: {
        name: string;
        type: 'ALLERGEN' | 'DIETARY';
    }): Promise<MenuTag> {
        return this.request<MenuTag>('/tags', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateTag(
        id: number,
        data: {
            name: string;
        },
    ): Promise<MenuTag> {
        return this.request<MenuTag>(`/tags/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async deleteTag(id: number): Promise<void> {
        return this.request<void>(`/tags/${id}`, {
            method: 'DELETE',
        });
    }

    async getMenuItems(): Promise<MenuItem[]> {
        return this.request('/admin/menu');
    }

    /** Get a single-use upload token for menu image upload. */
    async getUploadToken(): Promise<{ token: string }> {
        return this.request<{ token: string }>('/admin/menu/upload-token', {
            method: 'POST',
        });
    }

    /** Get pathname for blob upload (must use before calling upload). Does not consume token. */
    async getUploadPathname(token: string): Promise<{ pathname: string }> {
        return this.request<{ pathname: string }>('/admin/menu/upload-token/pathname', {
            method: 'POST',
            body: JSON.stringify({ token }),
        });
    }

    async createMenuItem(data: {
        name: string;
        price: number;
        categoryId: string;
        description?: string;
        imageUrl?: string;
        dietaryPreference?: string;
        available?: boolean;
        spiceLevel?: string;
        allergenTagIds?: number[];
        dietaryTagIds?: number[];
        calories?: number | null;
        portionLabel?: string | null;
        chefRecommended?: boolean;
        containsAlcohol?: boolean;
    }): Promise<MenuItem> {
        return this.request('/admin/menu', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    /**
     * Bulk create menu items from JSON. Categories are created when categoryName is used and missing.
     * Parses Nest `errors[]` on 400 for readable messages.
     */
    /**
     * Gemini vision (backend): menu photo → items JSON. Requires GEMINI_API_KEY on the API server.
     */
    async extractMenuFromImage(payload: {
        imageBase64: string;
        mimeType: string;
    }): Promise<{ items: BulkMenuImportRow[] }> {
        return this.request('/admin/menu/extract-from-image', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async bulkImportMenuItems(payload: { items: BulkMenuImportRow[] }): Promise<{
        created: number;
        categoriesCreated: number;
    }> {
        const url = shouldUseSameOriginApiProxy()
            ? `/api/admin/menu/bulk`
            : `${API_URL}/admin/menu/bulk`;
        const init: RequestInit = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload),
        };
        let res = await fetch(url, init);
        let data = await res.json().catch(() => ({}));

        if (!res.ok && res.status === 401 && typeof window !== 'undefined') {
            if (!isUnauthenticatedRoute(window.location.pathname) && (await this.refreshSessionOnce())) {
                res = await fetch(url, init);
                data = await res.json().catch(() => ({}));
            }
        }

        if (!res.ok) {
            if (res.status === 401) redirectToLoginFromCurrentPage();
            const d = data as { message?: string; errors?: BulkMenuImportErrorRow[] };
            let msg = d.message || `HTTP ${res.status}`;
            if (Array.isArray(d.errors) && d.errors.length) {
                msg +=
                    ' — ' +
                    d.errors.map((e) => `row ${e.index + 1}: ${e.message}`).join('; ');
            }
            throw new Error(msg);
        }

        await revalidateGuestMenuCache();
        return data as { created: number; categoriesCreated: number };
    }

    /** Sold out / back on the menu. Narrow endpoint usable by kitchen and front-desk roles. */
    async setMenuItemAvailability(id: string, available: boolean): Promise<MenuItem> {
        return this.request(`/admin/menu/${id}/availability`, {
            method: 'PATCH',
            body: JSON.stringify({ available }),
        });
    }

    /** Flip every item in a category at once. */
    async setCategoryAvailability(
        categoryId: string,
        available: boolean,
    ): Promise<{ categoryId: string; available: boolean; updated: number }> {
        return this.request(`/admin/categories/${categoryId}/availability`, {
            method: 'PATCH',
            body: JSON.stringify({ available }),
        });
    }

    async updateMenuItem(id: string, data: Partial<MenuItem>): Promise<MenuItem> {
        return this.request(`/admin/menu/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteMenuItem(id: string): Promise<void> {
        return this.request(`/admin/menu/${id}`, { method: 'DELETE' });
    }

    // ─── Rooms ────────────────────────────────────────────

    async getRooms(): Promise<Room[]> {
        return this.request('/admin/rooms');
    }

    async createRoom(data: { number: string; floor?: string; type?: string }): Promise<Room> {
        return this.request('/admin/rooms', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async createBulkRooms(rooms: { number: string; floor?: string; type?: string }[]): Promise<Room[]> {
        return this.request('/admin/rooms/bulk', {
            method: 'POST',
            body: JSON.stringify({ rooms }),
        });
    }

    async deleteRoom(id: string): Promise<void> {
        return this.request(`/admin/rooms/${id}`, { method: 'DELETE' });
    }

    async checkoutRoom(id: string): Promise<{ message: string; room?: Room }> {
        return this.request(`/admin/rooms/${id}/checkout`, { method: 'POST' });
    }

    async checkinRoom(
        id: string,
        data?: {
            pin?: string;
            guestName?: string;
            guestPhone?: string;
            guestEmail?: string;
            additionalRoomIds?: string[];
            groupStayId?: string;
        },
    ): Promise<{
        message: string;
        room: Room;
        pin: string;
        stayId?: string;
        groupStayId?: string;
        allStays?: { room: Room; stay: GuestStay }[];
    }> {
        return this.request(`/admin/rooms/${id}/checkin`, {
            method: 'POST',
            body: JSON.stringify(data || {}),
        });
    }

    async getRoomStays(id: string): Promise<GuestStay[]> {
        return this.request(`/admin/rooms/${id}/stays`);
    }

    async getGroupStays(groupStayId: string): Promise<GuestStay[]> {
        return this.request(`/admin/rooms/group/${groupStayId}`);
    }

    async checkoutGroup(groupStayId: string): Promise<{ message: string; checkedOutCount: number }> {
        return this.request(`/admin/rooms/group/${groupStayId}/checkout`, { method: 'POST' });
    }

    async regenerateRoomPin(id: string, pin?: string): Promise<{ message: string; room: Room; pin: string }> {
        return this.request(`/admin/rooms/${id}/regenerate-pin`, {
            method: 'POST',
            body: JSON.stringify({ pin }),
        });
    }

    async getRoomQr(id: string): Promise<RoomQr> {
        return this.request(`/admin/rooms/${id}/qr`);
    }

    async getAllRoomQrs(): Promise<RoomQr[]> {
        return this.request('/admin/rooms/qr/all');
    }

    // ─── Orders (Admin) ───────────────────────────────────

    async getOrders(status?: string): Promise<Order[]> {
        const query = status ? `?status=${status}` : '';
        return this.request(`/admin/orders${query}`);
    }

    async updateOrderStatus(id: string, status: string): Promise<Order> {
        return this.request(`/admin/orders/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    }

    // ─── Guest (Public) ───────────────────────────────────

    async getPublicMenu(hotelSlug: string): Promise<PublicMenuData> {
        return this.request<PublicMenuData>(`/guest/menu/${hotelSlug}`);
    }

    /** Combined menu + rooms: single request for faster load */
    async getPublicMenuFull(hotelSlug: string): Promise<import('./types').PublicMenuFullData> {
        return this.request<import('./types').PublicMenuFullData>(`/guest/menu/${hotelSlug}/full`);
    }

    /** On success the API sets the stay token as an httpOnly cookie for this room. */
    async verifyGuestRoomPin(roomId: string, pin: string): Promise<{
        success: boolean;
        roomNumber: string;
        hotelSlug?: string;
    }> {
        return this.request(`/guest/rooms/${roomId}/verify-pin`, {
            method: 'POST',
            body: JSON.stringify({ pin }),
        });
    }

    async getGuestRoomStatus(roomId: string): Promise<{
        id: string;
        number: string;
        isOccupied: boolean;
    }> {
        return this.request(`/guest/rooms/${roomId}/status`);
    }

    async placeOrder(data: {
        roomId: string;
        items: { itemId: string; quantity: number }[];
        notes?: string;
        guestName?: string;
        guestPhone?: string;
        idempotencyKey?: string;
    }): Promise<Order> {
        const headers: Record<string, string> = {};
        if (data.idempotencyKey) {
            headers['Idempotency-Key'] = data.idempotencyKey;
        }
        return this.request<Order>('/guest/orders', {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });
    }

    async trackOrder(id: string): Promise<Order> {
        return this.request<Order>(`/guest/orders/${id}`);
    }

    async getGuestRoomOrders(roomId: string): Promise<Order[]> {
        return this.request<Order[]>(`/guest/rooms/${roomId}/orders`);
    }

    async getPublicRooms(hotelSlug: string): Promise<{ id: string; number: string; floor?: string; type?: string }[]> {
        return this.request(`/guest/rooms/${hotelSlug}`);
    }
    
    async trackMenuView(hotelId: string): Promise<void> {
        return this.request('/analytics/menu-view', {
            method: 'POST',
            body: JSON.stringify({ hotelId }),
        });
    }

    // ─── Analytics (Admin, Starter+) ─────────────────────────

    async getMenuAnalytics(range: MenuAnalyticsRange = 7): Promise<MenuAnalytics> {
        return this.request(`/admin/analytics/menu?range=${range}`);
    }

    // ─── Services (Guest) ───────────────────────────────────
    
    async getGuestServices(hotelSlug: string): Promise<Service[]> {
        return this.request<Service[]>(`/guest/services/${hotelSlug}`);
    }

    // ─── Services (Admin) ───────────────────────────────────

    async getServices(): Promise<Service[]> {
        return this.request<Service[]>('/admin/services');
    }

    async createService(data: {
        name: string;
        description?: string;
        price?: number;
        icon?: string;
        available?: boolean;
    }): Promise<Service> {
        return this.request<Service>('/admin/services', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateService(
        id: string,
        data: {
            name?: string;
            description?: string | null;
            price?: number;
            icon?: string | null;
            available?: boolean;
        },
    ): Promise<Service> {
        return this.request<Service>(`/admin/services/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async deleteService(id: string): Promise<void> {
        return this.request(`/admin/services/${id}`, {
            method: 'DELETE',
        });
    }

    // ─── Service Requests (Guest & Admin) ────────────────────

    async createServiceRequest(data: {
        type: string;
        category: string;
        description?: string;
        priority?: string;
        roomId: string;
        guestName?: string;
        guestPhone?: string;
        serviceId?: string;
    }): Promise<ServiceRequest> {
        return this.request<ServiceRequest>('/guest/service-requests', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getGuestServiceRequests(roomId: string): Promise<ServiceRequest[]> {
        return this.request<ServiceRequest[]>(`/guest/rooms/${roomId}/service-requests`);
    }

    async getServiceRequests(type?: string, status?: string): Promise<ServiceRequest[]> {
        const params = new URLSearchParams();
        if (type) params.append('type', type);
        if (status) params.append('status', status);
        const query = params.toString() ? `?${params.toString()}` : '';
        return this.request<ServiceRequest[]>(`/admin/service-requests${query}`);
    }

    async updateServiceRequestStatus(id: string, status: string): Promise<ServiceRequest> {
        return this.request<ServiceRequest>(`/admin/service-requests/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    }

    // ─── Staff Management ─────────────────────────────────

    async getNavigation(): Promise<Array<{ name: string; href: string; iconName: string; isLocked: boolean; featureLock?: string }>> {
        return this.request<Array<{ name: string; href: string; iconName: string; isLocked: boolean; featureLock?: string }>>('/auth/navigation');
    }

    async getStaff(): Promise<StaffListMember[]> {
        return this.request<StaffListMember[]>('/auth/staff');
    }

    async getPendingStaffInvitations(): Promise<
        { id: string; name: string; role: string; expiresAt: string; createdAt: string }[]
    > {
        return this.request('/auth/staff/invitations');
    }

    async inviteStaff(data: {
        name: string;
        role: string;
        validity?: string;
    }): Promise<{
        inviteKey: string;
        expiresAt: string | null;
        validity?: string;
        name: string;
        role: string;
    }> {
        return this.request('/auth/staff', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    /** Owner revokes an access key (pending invite or key linked to an existing staff account). */
    async revokeStaffInvitation(id: string): Promise<{ message: string }> {
        return this.request(`/auth/staff/invitations/${id}`, { method: 'DELETE' });
    }

    async removeStaff(id: string): Promise<{ message: string }> {
        return this.request<{ message: string }>(`/auth/staff/${id}`, {
            method: 'DELETE',
        });
    }

}

export const api = new ApiClient();

/** GET-only fetcher for SWR. Uses same credentials/error handling as api. */
export async function swrFetcher<T>(path: string): Promise<T> {
    return api.get<T>(path);
}
