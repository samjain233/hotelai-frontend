"use client";

import React, { createContext, useContext, useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { MenuItem, CartItem, Order, PublicMenuFullData, Hotel, GuestPublicMenuCategory, Room } from "@/lib/types";
import { api } from "@/lib/api";
import { usePublicMenuFull } from "@/hooks/useSwrApi";
import { getStayToken, getStayPin, clearStayToken } from "@/lib/staySession";
import { GuestDietFilterKey, GuestMenuSort } from "@/lib/guestMenuSearch";

export interface GuestMenuState {
    hotelSlug: string;
    hotel: Hotel | null;
    categories: GuestPublicMenuCategory[];
    availableRooms: PublicMenuFullData["rooms"];
    isOpen: boolean;
    loading: boolean;
    error: string;
    themeStyle: React.CSSProperties;

    cart: CartItem[];
    addToCart: (item: MenuItem) => void;
    removeFromCart: (itemId: string) => void;
    getCartQuantity: (itemId: string) => number;
    cartTotal: number;
    cartCount: number;
    cartAnimKey: number;
    setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;

    showCart: boolean;
    setShowCart: React.Dispatch<React.SetStateAction<boolean>>;
    placing: boolean;
    setPlacing: React.Dispatch<React.SetStateAction<boolean>>;
    order: Order | null;
    setOrder: React.Dispatch<React.SetStateAction<Order | null>>;
    
    guestName: string;
    setGuestName: React.Dispatch<React.SetStateAction<string>>;
    notes: string;
    setNotes: React.Dispatch<React.SetStateAction<string>>;
    
    selectedRoomId: string;
    setSelectedRoomId: React.Dispatch<React.SetStateAction<string>>;
    
    searchQuery: string;
    setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
    dietFilters: GuestDietFilterKey[];
    setDietFilters: React.Dispatch<React.SetStateAction<GuestDietFilterKey[]>>;
    sortBy: GuestMenuSort;
    setSortBy: React.Dispatch<React.SetStateAction<GuestMenuSort>>;
    
    showRoomModal: boolean;
    setShowRoomModal: React.Dispatch<React.SetStateAction<boolean>>;
    showPinModal: boolean;
    setShowPinModal: React.Dispatch<React.SetStateAction<boolean>>;
    pinModalPurpose: "ORDER" | "BILL";
    setPinModalPurpose: React.Dispatch<React.SetStateAction<"ORDER" | "BILL">>;
    
    pastOrders: Order[];
    setPastOrders: React.Dispatch<React.SetStateAction<Order[]>>;
    showHistory: boolean;
    setShowHistory: React.Dispatch<React.SetStateAction<boolean>>;
    
    resolvedRoomId: string;
    roomDisplayName: string;
    guestServicesHref: string;
    guestCallNumber: string;
    digitalOrderingEnabled: boolean;
    serviceRequestsEnabled: boolean;
    
    loadPastOrders: () => Promise<void>;
    placeOrder: (stayTokenOverride?: string) => Promise<void>;
    initiateOrder: () => void;
    confirmRoomFromModal: () => void;
}

const GuestMenuContext = createContext<GuestMenuState | null>(null);

export function useGuestMenuContext() {
    const ctx = useContext(GuestMenuContext);
    if (!ctx) throw new Error("useGuestMenuContext must be used within GuestMenuProvider");
    return ctx;
}

export function GuestMenuProvider({ children, value }: { children: React.ReactNode; value: GuestMenuState }) {
    return <GuestMenuContext.Provider value={value}>{children}</GuestMenuContext.Provider>;
}
