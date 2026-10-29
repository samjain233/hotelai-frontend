"use client";

import { useCallback, useMemo, useState } from "react";
import type { CartItem, MenuItem } from "@/lib/types";
import { hapticTick } from "@/lib/haptics";
import type { GuestCartState } from "../components/GuestMenuContext";

/** In-memory cart for the guest session. The returned object is stable until the cart changes. */
export function useGuestCart(): GuestCartState {
    const [cart, setCart] = useState<CartItem[]>([]);
    // Bumped on every add so the cart bar can replay its pulse animation.
    const [cartAnimKey, setCartAnimKey] = useState(0);

    const addToCart = useCallback((item: MenuItem) => {
        setCart((prev) => {
            const existing = prev.find((ci) => ci.item.id === item.id);
            if (existing) return prev.map((ci) => (ci.item.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci));
            return [...prev, { item, quantity: 1 }];
        });
        setCartAnimKey((k) => k + 1);
        hapticTick();
    }, []);

    const removeFromCart = useCallback((itemId: string) => {
        setCart((prev) => {
            const existing = prev.find((ci) => ci.item.id === itemId);
            if (existing && existing.quantity > 1) {
                return prev.map((ci) => (ci.item.id === itemId ? { ...ci, quantity: ci.quantity - 1 } : ci));
            }
            return prev.filter((ci) => ci.item.id !== itemId);
        });
    }, []);

    const clearCart = useCallback(() => setCart([]), []);

    return useMemo<GuestCartState>(() => {
        const quantities = new Map(cart.map((ci) => [ci.item.id, ci.quantity]));
        return {
            cart,
            cartTotal: cart.reduce((sum, ci) => sum + Number(ci.item.price) * ci.quantity, 0),
            cartCount: cart.reduce((sum, ci) => sum + ci.quantity, 0),
            cartAnimKey,
            addToCart,
            removeFromCart,
            getCartQuantity: (itemId: string) => quantities.get(itemId) ?? 0,
            clearCart,
        };
    }, [cart, cartAnimKey, addToCart, removeFromCart, clearCart]);
}
