import {
    Admin,
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
} from './types';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/** Use same-origin /api proxy when not on localhost (e.g. Vercel) so cookies work for SSE */
export function shouldUseSameOriginApiProxy(): boolean {
    if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_USE_PROXY === 'true';
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1';
    return !isLocal || process.env.NEXT_PUBLIC_USE_PROXY === 'true';
}

/** POST `/auth/refresh` (or Next proxy). Shared by API client, SSE hooks, etc. */
export async function refreshHotelSession(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    const refreshUrl = shouldUseSameOriginApiProxy()
        ? '/api/auth/refresh'
        : `${API_URL}/auth/refresh`;
    try {
        const ref = await fetch(refreshUrl, { method: 'POST', credentials: 'include' });
        return ref.ok;
    } catch {
        return false;
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
            const error = await res.json().catch(() => ({ message: 'Request failed' }));
            const message = error.message || `HTTP ${res.status}`;

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
                // Avoid redirect loop: don't redirect when already on public routes
                if (typeof window !== 'undefined') {
                    const path = window.location.pathname;
                    const isPublicRoute =
                        path === '/login' ||
                        path === '/register' ||
                        path === '/forgot-password' ||
                        path === '/reset-password' ||
                        path === '/verify-email' ||
                        path === '/verify-email/pending' ||
                        path === '/' ||
                        path === '/staff/access' ||
                        path.startsWith('/menu/') ||
                        path.startsWith('/services/') ||
                        // Platform admin uses sessionStorage + x-platform-key, not hotel JWT
                        path.startsWith('/superadmin');
                    if (!isPublicRoute) {
                        window.location.href = '/login';
                    }
                }
                throw new Error(message);
            }

            throw new Error(message);
        }

        return res.json();
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
            token: (data as AuthResponse).token,
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
            const path = window.location.pathname;
            const isPublicRoute =
                path === '/login' ||
                path === '/register' ||
                path.startsWith('/superadmin');
            if (!isPublicRoute && (await this.refreshSessionOnce())) {
                res = await fetch(url, init);
                data = await res.json().catch(() => ({}));
            }
        }

        if (!res.ok) {
            if (res.status === 401 && typeof window !== 'undefined') {
                const path = window.location.pathname;
                const isPublicRoute =
                    path === '/login' ||
                    path === '/register' ||
                    path.startsWith('/superadmin');
                if (!isPublicRoute) window.location.href = '/login';
            }
            const d = data as { message?: string; errors?: BulkMenuImportErrorRow[] };
            let msg = d.message || `HTTP ${res.status}`;
            if (Array.isArray(d.errors) && d.errors.length) {
                msg +=
                    ' — ' +
                    d.errors.map((e) => `row ${e.index + 1}: ${e.message}`).join('; ');
            }
            throw new Error(msg);
        }

        return data as { created: number; categoriesCreated: number };
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

    async checkinRoom(id: string, pin?: string): Promise<{ message: string; room: Room; pin: string }> {
        return this.request(`/admin/rooms/${id}/checkin`, {
            method: 'POST',
            body: JSON.stringify({ pin }),
        });
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

    async verifyGuestRoomPin(roomId: string, pin: string): Promise<{
        success: boolean;
        stayToken: string;
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
        stayToken?: string;
        pin?: string;
    }): Promise<Order> {
        return this.request<Order>('/guest/orders', {
            method: 'POST',
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
        stayToken?: string;
        pin?: string;
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
