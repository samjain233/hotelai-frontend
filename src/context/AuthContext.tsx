"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Admin, Hotel } from '@/lib/types';
import { api } from '@/lib/api';

interface AuthContextType {
    admin: Admin | null;
    hotel: Hotel | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<Admin>;
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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getProfile()
            .then((profile) => {
                setAdmin({
                    id: profile.id,
                    email: profile.email,
                    name: profile.name,
                    role: profile.role,
                });
                setHotel(profile.hotel);
            })
            .catch(() => {
                setAdmin(null);
                setHotel(null);
            })
            .finally(() => setLoading(false));
    }, []);

    async function login(email: string, password: string) {
        const res = await api.login(email, password);
        setAdmin(res.admin);
        setHotel(res.hotel);
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
        }
    }

    async function refreshHotel() {
        try {
            const profile = await api.getProfile();
            setHotel(profile?.hotel ?? null);
        } catch {
            // Leave hotel state unchanged on refresh failure
        }
    }

    return (
        <AuthContext.Provider value={{ admin, hotel, loading, login, register, logout, refreshHotel }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
