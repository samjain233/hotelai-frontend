"use client";

import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { mutate as swrMutate } from 'swr';
import { Admin, AuthMeProfile, Hotel } from '@/lib/types';
import { api } from '@/lib/api';
import { isPublicRoute } from '@/lib/routes';

/**
 * Drop every cached SWR entry. SWR keys are URLs (`/admin/menu`, `/auth/navigation`, …) with no
 * tenant in them, and sign-in/out are client-side navigations, so without this the next account
 * would be served the previous account's data until the deduping window expired.
 *
 * `revalidate` matters: with `false` SWR clears the data but keeps its per-key dedupe marker, so a
 * hook that mounts within `dedupingInterval` reuses the old request and ends up with no data at all.
 * `true` also drops the marker. It only refetches keys that have a mounted hook, so it is safe on
 * sign-in (nothing admin-side is mounted on /login) but not on sign-out, where admin pages are still
 * mounted for a tick and would refetch with no cookies.
 */
function clearSwrCache(mode: 'sign-in' | 'sign-out') {
    return swrMutate(() => true, undefined, { revalidate: mode === 'sign-in', throwOnError: false });
}

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
    const pathname = usePathname();
    const skipInitialFetch = isPublicRoute(pathname);
    const [loading, setLoading] = useState(!skipInitialFetch);

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
        if (skipInitialFetch) return;
        api.getProfile()
            .then(applyProfile)
            .catch(() => {
                setAdmin(null);
                setHotel(null);
                setImpersonating(false);
            })
            .finally(() => setLoading(false));
    }, [applyProfile, skipInitialFetch]);

    async function login(email: string, password: string) {
        const res = await api.login(email, password);
        // A session can expire and be re-entered as a different account without passing through
        // logout(), so clear on sign-in as well as sign-out.
        await clearSwrCache('sign-in');
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
        await clearSwrCache('sign-in');
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
            await clearSwrCache('sign-out');
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
