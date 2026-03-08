"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Admin, Hotel } from '@/lib/types';
import { api } from '@/lib/api';

interface AuthContextType {
    admin: Admin | null;
    hotel: Hotel | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<Admin>;
    register: (data: {
        hotelName: string;
        adminName: string;
        email: string;
        password: string;
    }) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [admin, setAdmin] = useState<Admin | null>(null);
    const [hotel, setHotel] = useState<Hotel | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem('auth');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setAdmin(parsed.admin);
                setHotel(parsed.hotel);
                setToken(parsed.token);
                api.setToken(parsed.token);
            } catch {
                localStorage.removeItem('auth');
            }
        }
        setLoading(false);
    }, []);

    async function login(email: string, password: string) {
        const res = await api.login(email, password);
        setAdmin(res.admin);
        setHotel(res.hotel);
        setToken(res.token);
        api.setToken(res.token);
        localStorage.setItem('auth', JSON.stringify(res));
        return res.admin;
    }

    async function register(data: {
        hotelName: string;
        adminName: string;
        email: string;
        password: string;
    }) {
        const res = await api.register(data);
        setAdmin(res.admin);
        setHotel(res.hotel);
        setToken(res.token);
        api.setToken(res.token);
        localStorage.setItem('auth', JSON.stringify(res));
    }

    function logout() {
        setAdmin(null);
        setHotel(null);
        setToken(null);
        api.setToken(null);
        localStorage.removeItem('auth');
    }

    return (
        <AuthContext.Provider value={{ admin, hotel, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
