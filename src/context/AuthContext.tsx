"use client";

import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from 'react';
import { Admin, AuthMeProfile, Hotel } from '@/lib/types';
import { api } from '@/lib/api';

interface AuthContextType {
    admin: Admin | null;
    hotel: Hotel | null;
    /** True when platform superadmin is acting as this hotel (JWT `imp`) */
    impersonating: boolean;
    loading: boolean;
    login: (email: string, password: string) => Promise<Admin>;
    staffAccessWithKey: (key: string) => Promise<Admin>;
    register: (data: {
        hotelName: string;
        hotelPhone?: string;
        adminName: string;
        email: string;
        password: string;
    }) => Promise<{ email: string }>;
    logout: () => void;
    refreshHotel: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [admin, setAdmin] = useState<Admin | null>(null);
    const [hotel, setHotel] = useState<Hotel | null>(null);
    const [impersonating, setImpersonating] = useState(false);
    const [loading, setLoading] = useState(true);

    const applyProfile = useCallback((profile: AuthMeProfile) => {
        setAdmin({
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role,
        });
        setHotel(profile.hotel);
        setImpersonating(profile.impersonating === true);
    }, []);

    useEffect(() => {
        api.getProfile()
            .then(applyProfile)
            .catch(() => {
                setAdmin(null);
                setHotel(null);
                setImpersonating(false);
            })
            .finally(() => setLoading(false));
    }, [applyProfile]);

    async function login(email: string, password: string) {
        const res = await api.login(email, password);
        setAdmin(res.admin);
        setHotel(res.hotel);
        // Align with /auth/me so address, phone, logo, hours are always present (login payload can lag behind).
        try {
            const profile = await api.getProfile();
            applyProfile(profile);
        } catch {
            // Keep login response if profile fetch fails
        }
        return res.admin;
    }

    async function staffAccessWithKey(key: string) {
        const res = await api.staffAccessWithKey(key);
        setAdmin(res.admin);
        setHotel(res.hotel);
        try {
            const profile = await api.getProfile();
            applyProfile(profile);
        } catch {
            // keep response
        }
        return res.admin;
    }

    async function register(data: {
        hotelName: string;
        hotelPhone?: string;
        adminName: string;
        email: string;
        password: string;
    }) {
        const res = await api.register(data);
        return { email: res.email };
    }

    async function logout() {
        try {
            await api.logout();
        } finally {
            setAdmin(null);
            setHotel(null);
            setImpersonating(false);
        }
    }

    async function refreshHotel() {
        try {
            const profile = await api.getProfile();
            setHotel(profile.hotel);
            setImpersonating(profile.impersonating === true);
        } catch {
            // Leave hotel state unchanged on refresh failure
        }
    }

    return (
        <AuthContext.Provider
            value={{
                admin,
                hotel,
                impersonating,
                loading,
                login,
                staffAccessWithKey,
                register,
                logout,
                refreshHotel,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
