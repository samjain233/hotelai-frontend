"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import type { CartItem, Order } from "@/lib/types";
import { api, guestFacingErrorMessage, swrFetcher } from "@/lib/api";
import { clearStayVerified, isStayAccessError, isStayVerified } from "@/lib/staySession";
import { useActivityStreamGuest } from "@/hooks/useActivityStream";

interface UseGuestOrderingArgs {
    hotelSlug: string;
    resolvedRoomId: string;
    isOpen: boolean;
    digitalOrderingEnabled: boolean;
    serviceRequestsEnabled: boolean;
    /** From `useStaySession`; the stay cookie only exists after PIN verification. */
    stayVerified: boolean;
    cart: CartItem[];
    clearCart: () => void;
}

/**
 * Why the PIN modal is open, i.e. what to continue with once the PIN is accepted:
 * - `SCAN`: prompted on QR scan; nothing pending, just close.
 * - `ORDER`: the guest tapped "Place order"; submit the cart.
 * - `BILL`: the guest tapped "Room bill"; open the history drawer.
 */
export type PinModalPurpose = "SCAN" | "ORDER" | "BILL";

function newIdempotencyKey(): string {
    return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `order-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Everything about placing and tracking orders for the guest's room: the PIN gate, the cart/room/
 * history drawers, order submission, and the room's past orders (SWR, refreshed by the SSE stream).
 *
 * Past orders are only fetched for a verified stay on an ordering tier; before that the backend
 * would answer `[]` anyway, so a bare room scan costs no extra requests.
 */
export function useGuestOrdering({
    hotelSlug,
    resolvedRoomId,
    isOpen,
    digitalOrderingEnabled,
    serviceRequestsEnabled,
    stayVerified,
    cart,
    clearCart,
}: UseGuestOrderingArgs) {
    const [placing, setPlacing] = useState(false);
    const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
    const [guestName, setGuestName] = useState("");
    const [notes, setNotes] = useState("");
    const [showCart, setShowCart] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinModalPurpose, setPinModalPurpose] = useState<PinModalPurpose>("SCAN");

    const canSeeRoomOrders = !!resolvedRoomId && digitalOrderingEnabled && stayVerified;

    // ── Past orders ───────────────────────────────────────────────────────────────────────────
    const { data: pastOrdersData, mutate: mutatePastOrders } = useSWR<Order[]>(
        canSeeRoomOrders ? `/guest/rooms/${resolvedRoomId}/orders` : null,
        swrFetcher,
        { revalidateOnFocus: false, dedupingInterval: 5_000, errorRetryCount: 2, onError: (err) => console.error("Failed to load past orders", err) },
    );
    const pastOrders = useMemo(() => pastOrdersData ?? [], [pastOrdersData]);

    const loadPastOrders = useCallback(async () => {
        if (!canSeeRoomOrders) return;
        await mutatePastOrders();
    }, [canSeeRoomOrders, mutatePastOrders]);

    // Opening the bill always shows fresh data.
    useEffect(() => {
        if (showHistory) void loadPastOrders();
    }, [showHistory, loadPastOrders]);

    const roomBillGrandTotal = useMemo(
        () => pastOrders.reduce((sum, o) => sum + (o.status !== "CANCELLED" ? Number(o.totalAmount || 0) : 0), 0),
        [pastOrders],
    );

    // The confirmation screen tracks the placed order; kitchen status changes arrive via the list.
    const order = useMemo(() => {
        if (!placedOrder) return null;
        return pastOrders.find((o) => o.id === placedOrder.id) ?? placedOrder;
    }, [placedOrder, pastOrders]);

    const handleOrderUpdated = useCallback(
        (updated: Order) => {
            void mutatePastOrders(
                (prev) => {
                    const list = prev ?? [];
                    const idx = list.findIndex((o) => o.id === updated.id);
                    return idx >= 0 ? list.map((o) => (o.id === updated.id ? updated : o)) : [...list, updated];
                },
                { revalidate: false },
            );
        },
        [mutatePastOrders],
    );

    useActivityStreamGuest({
        hotelSlug,
        roomId: resolvedRoomId || "",
        enabled: canSeeRoomOrders,
        onOrderNew: loadPastOrders,
        onOrderUpdated: handleOrderUpdated,
    });

    // ── PIN prompt on scan ────────────────────────────────────────────────────────────────────
    // A QR scan with a room prompts for the PIN once per room. This reads localStorage, so it must
    // run after hydration (an effect), not during render.
    const promptedRoomRef = useRef<string | null>(null);
    useEffect(() => {
        if (!resolvedRoomId) return;
        if (!digitalOrderingEnabled && !serviceRequestsEnabled) return;
        if (promptedRoomRef.current === resolvedRoomId) return;
        if (!isStayVerified(resolvedRoomId)) {
            promptedRoomRef.current = resolvedRoomId;
            // eslint-disable-next-line react-hooks/set-state-in-effect -- reacts to an external store (localStorage) after hydration
            setPinModalPurpose("SCAN");
            setShowPinModal(true);
        }
    }, [resolvedRoomId, digitalOrderingEnabled, serviceRequestsEnabled]);

    // ── Placing an order ──────────────────────────────────────────────────────────────────────
    const idempotencyKeyRef = useRef("");

    const placeOrder = useCallback(async () => {
        if (!isOpen || !resolvedRoomId || cart.length === 0) return;
        if (!isStayVerified(resolvedRoomId)) {
            setPinModalPurpose("ORDER");
            setShowPinModal(true);
            return;
        }
        if (!idempotencyKeyRef.current) idempotencyKeyRef.current = newIdempotencyKey();
        setPlacing(true);
        try {
            const result = await api.placeOrder({
                roomId: resolvedRoomId,
                items: cart.map((ci) => ({ itemId: ci.item.id, quantity: ci.quantity })),
                notes: notes || undefined,
                guestName: guestName || undefined,
                idempotencyKey: idempotencyKeyRef.current,
            });
            idempotencyKeyRef.current = newIdempotencyKey();
            setPlacedOrder(result);
            clearCart();
            setShowCart(false);
            setShowRoomModal(false);
            setShowPinModal(false);
            void loadPastOrders();
            toast.success(`Order #${result.orderNumber} placed successfully!`);
        } catch (err: unknown) {
            console.error("Place order failed", err);
            if (isStayAccessError(err)) {
                // Stay token expired / PIN rotated / room checked out: forget the local flag and re-prompt.
                clearStayVerified(resolvedRoomId);
                setPinModalPurpose("ORDER");
                setShowPinModal(true);
            }
            toast.error(guestFacingErrorMessage(err, "We couldn't place your order. Please try again."));
        } finally {
            setPlacing(false);
        }
    }, [isOpen, resolvedRoomId, cart, notes, guestName, clearCart, loadPastOrders]);

    const initiateOrder = useCallback(() => {
        if (!resolvedRoomId) {
            setShowCart(false);
            setShowRoomModal(true);
            return;
        }
        if (!isStayVerified(resolvedRoomId)) {
            setPinModalPurpose("ORDER");
            setShowPinModal(true);
            return;
        }
        void placeOrder();
    }, [resolvedRoomId, placeOrder]);

    const confirmRoomFromModal = useCallback(() => {
        if (!resolvedRoomId) return;
        setShowRoomModal(false);
        if (!isOpen) {
            setShowCart(true);
            return;
        }
        if (!isStayVerified(resolvedRoomId)) {
            setPinModalPurpose("ORDER");
            setShowPinModal(true);
            return;
        }
        void placeOrder();
    }, [resolvedRoomId, isOpen, placeOrder]);

    const openRoomBill = useCallback(() => {
        if (!isStayVerified(resolvedRoomId)) {
            setPinModalPurpose("BILL");
            setShowPinModal(true);
            return;
        }
        setShowHistory(true);
    }, [resolvedRoomId]);

    /** `StayPinModal.onSuccess`: continue whatever the PIN was asked for. */
    const onPinVerified = useCallback(() => {
        setShowPinModal(false);
        if (pinModalPurpose === "ORDER") void placeOrder();
        else if (pinModalPurpose === "BILL") setShowHistory(true);
        // SCAN: the room is now verified; past orders start loading via `canSeeRoomOrders`.
    }, [pinModalPurpose, placeOrder]);

    return {
        order,
        setOrder: setPlacedOrder,
        placing,
        pastOrders,
        roomBillGrandTotal,
        guestName,
        setGuestName,
        notes,
        setNotes,
        showCart,
        setShowCart,
        showHistory,
        setShowHistory,
        showRoomModal,
        setShowRoomModal,
        showPinModal,
        setShowPinModal,
        pinModalPurpose,
        setPinModalPurpose,
        loadPastOrders,
        placeOrder,
        initiateOrder,
        confirmRoomFromModal,
        openRoomBill,
        onPinVerified,
    };
}
