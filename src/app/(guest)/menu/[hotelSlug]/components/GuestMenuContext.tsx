"use client";

import React, { createContext, useContext } from "react";
import type { CartItem, Hotel, MenuItem, Order, PublicMenuFullData, GuestPublicMenuCategory } from "@/lib/types";
import type { GuestDietFilterKey, GuestMenuSort } from "@/lib/guestMenuSearch";
import type { PinModalPurpose } from "../hooks/useGuestOrdering";

/**
 * Guest menu state is split into three contexts by how often each changes, so a search keystroke
 * or a scroll-spy tick does not re-render every dish card:
 *
 * - `GuestMenuData`: hotel, feature flags, room, open/closed. Changes on data refetch or once a minute.
 * - `GuestCart`: cart contents and mutators. Changes when the guest taps add/remove.
 * - `GuestMenuUi`: search/sort/filters, modals, ordering state. Changes constantly while interacting.
 *
 * Dish cards subscribe to the first (and `GuestMenuItemAction` to the second); only the header and
 * overlays subscribe to the third. Each provider value must be memoised by the caller.
 */

export interface GuestMenuDataState {
    hotelSlug: string;
    hotel: Hotel;
    categories: GuestPublicMenuCategory[];
    availableRooms: NonNullable<PublicMenuFullData["rooms"]>;
    isOpen: boolean;
    themeStyle: React.CSSProperties;
    digitalOrderingEnabled: boolean;
    serviceRequestsEnabled: boolean;
    resolvedRoomId: string;
    roomDisplayName: string;
    guestServicesHref: string;
    guestCallNumber: string;
}

export interface GuestCartState {
    cart: CartItem[];
    cartTotal: number;
    cartCount: number;
    cartAnimKey: number;
    addToCart: (item: MenuItem) => void;
    removeFromCart: (itemId: string) => void;
    getCartQuantity: (itemId: string) => number;
    clearCart: () => void;
}

export interface GuestMenuUiState {
    searchQuery: string;
    setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
    dietFilters: GuestDietFilterKey[];
    setDietFilters: React.Dispatch<React.SetStateAction<GuestDietFilterKey[]>>;
    sortBy: GuestMenuSort;
    setSortBy: React.Dispatch<React.SetStateAction<GuestMenuSort>>;

    showCart: boolean;
    setShowCart: React.Dispatch<React.SetStateAction<boolean>>;
    showHistory: boolean;
    setShowHistory: React.Dispatch<React.SetStateAction<boolean>>;
    showRoomModal: boolean;
    setShowRoomModal: React.Dispatch<React.SetStateAction<boolean>>;
    showPinModal: boolean;
    setShowPinModal: React.Dispatch<React.SetStateAction<boolean>>;
    pinModalPurpose: PinModalPurpose;
    setPinModalPurpose: React.Dispatch<React.SetStateAction<PinModalPurpose>>;

    order: Order | null;
    setOrder: React.Dispatch<React.SetStateAction<Order | null>>;
    placing: boolean;
    pastOrders: Order[];
    guestName: string;
    setGuestName: React.Dispatch<React.SetStateAction<string>>;
    notes: string;
    setNotes: React.Dispatch<React.SetStateAction<string>>;
    selectedRoomId: string;
    setSelectedRoomId: React.Dispatch<React.SetStateAction<string>>;

    loadPastOrders: () => Promise<void>;
    placeOrder: () => Promise<void>;
    initiateOrder: () => void;
    confirmRoomFromModal: () => void;
    /** Open the room bill, going through the PIN prompt first when the stay is not verified. */
    openRoomBill: () => void;
}

const GuestMenuDataContext = createContext<GuestMenuDataState | null>(null);
const GuestCartContext = createContext<GuestCartState | null>(null);
const GuestMenuUiContext = createContext<GuestMenuUiState | null>(null);

function useRequired<T>(ctx: React.Context<T | null>, name: string): T {
    const value = useContext(ctx);
    if (!value) throw new Error(`${name} must be used within GuestMenuProvider`);
    return value;
}

export function useGuestMenuData(): GuestMenuDataState {
    return useRequired(GuestMenuDataContext, "useGuestMenuData");
}

export function useGuestCart(): GuestCartState {
    return useRequired(GuestCartContext, "useGuestCart");
}

export function useGuestMenuUi(): GuestMenuUiState {
    return useRequired(GuestMenuUiContext, "useGuestMenuUi");
}

interface GuestMenuProviderProps {
    data: GuestMenuDataState;
    cart: GuestCartState;
    ui: GuestMenuUiState;
    children: React.ReactNode;
}

export function GuestMenuProvider({ data, cart, ui, children }: GuestMenuProviderProps) {
    return (
        <GuestMenuDataContext.Provider value={data}>
            <GuestCartContext.Provider value={cart}>
                <GuestMenuUiContext.Provider value={ui}>{children}</GuestMenuUiContext.Provider>
            </GuestCartContext.Provider>
        </GuestMenuDataContext.Provider>
    );
}
