import { AuthResponse, MenuCategory, MenuItem, Room, RoomQr, Order, PublicMenuData, ServiceRequest } from './types';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class ApiClient {
    private token: string | null = null;

    setToken(token: string | null) {
        this.token = token;
    }

    private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const res = await fetch(`${API_URL}${path}`, {
            ...options,
            headers,
        });

        if (!res.ok) {
            // If token expired or unauthorized, clear auth and redirect to login
            if (res.status === 401) {
                this.token = null;
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('auth');
                    window.location.href = '/login';
                }
                throw new Error('Session expired');
            }

            const error = await res.json().catch(() => ({ message: 'Request failed' }));
            throw new Error(error.message || `HTTP ${res.status}`);
        }

        return res.json();
    }

    // ─── Auth ─────────────────────────────────────────────

    async register(data: {
        hotelName: string;
        adminName: string;
        email: string;
        password: string;
        hotelAddress?: string;
        hotelPhone?: string;
    }): Promise<AuthResponse> {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async login(email: string, password: string): Promise<AuthResponse> {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    async getProfile() {
        return this.request('/auth/me');
    }

    // ─── Categories ───────────────────────────────────────

    async getCategories(): Promise<MenuCategory[]> {
        return this.request('/admin/categories');
    }

    async createCategory(data: { name: string; icon?: string }): Promise<MenuCategory> {
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

    async getMenuItems(): Promise<MenuItem[]> {
        return this.request('/admin/menu');
    }

    async createMenuItem(data: {
        name: string;
        price: number;
        categoryId: string;
        description?: string;
        imageUrl?: string;
    }): Promise<MenuItem> {
        return this.request('/admin/menu', {
            method: 'POST',
            body: JSON.stringify(data),
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

    async deleteRoom(id: string): Promise<void> {
        return this.request(`/admin/rooms/${id}`, { method: 'DELETE' });
    }

    async checkoutRoom(id: string): Promise<{ message: string }> {
        return this.request(`/admin/rooms/${id}/checkout`, { method: 'POST' });
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

    async placeOrder(data: {
        roomId: string;
        items: { itemId: string; quantity: number }[];
        notes?: string;
        guestName?: string;
        guestPhone?: string;
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

    // ─── Service Requests (Guest & Admin) ────────────────────

    async createServiceRequest(data: {
        type: string;
        category: string;
        description?: string;
        priority?: string;
        roomId: string;
        guestName?: string;
        guestPhone?: string;
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

    async getStaff(): Promise<any[]> {
        return this.request<any[]>('/auth/staff');
    }

    async inviteStaff(data: { email: string; name: string; password: string; role: string }): Promise<any> {
        return this.request<any>('/auth/staff', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async removeStaff(id: string): Promise<any> {
        return this.request<any>(`/auth/staff/${id}`, {
            method: 'DELETE',
        });
    }
}

export const api = new ApiClient();
