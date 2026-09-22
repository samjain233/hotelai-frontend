"use client";

import { useEffect, useLayoutEffect, useState, useRef, useCallback, useMemo, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CartItem, Order, MenuItem } from "@/lib/types";
import type { PublicMenuFullData } from "@/lib/types";
import { api } from "@/lib/api";
import { usePublicMenuFull } from "@/hooks/useSwrApi";
import { useActivityStreamGuest } from "@/hooks/useActivityStream";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Utensils, X, CheckCircle2, Receipt, Clock, ChevronRight, Headset } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    type GuestDietFilterKey,
    type GuestMenuSort,
    normalizeSearchText,
    filterCategoriesByDiet,
    filterCategoriesBySearch,
    applySortToCategories,
    flattenMenuItems,
    findDidYouMeanItem,
} from "@/lib/guestMenuSearch";
import { buildGuestMenuThemeStyle } from "@/lib/guestMenuTheme";
import { AnimatedOverlays } from "./GuestMenuAnimated";
import { StayPinModal } from "@/components/guest/StayPinModal";
import { getStayToken, getStayPin, clearStayToken, useStaySession } from "@/lib/staySession";
import { toast } from "sonner";
import { GuestMenuProvider, GuestMenuState } from "./components/GuestMenuContext";
import { GuestHeader } from "./components/GuestHeader";
import { GuestMenuList } from "./components/GuestMenuList";
import { GuestCategoryNav } from "./components/GuestCategoryNav";

function formatPrice(price: number | string) {
    const n = typeof price === "number" ? price : parseFloat(String(price ?? 0)) || 0;
    const hasDecimals = n % 1 !== 0;
    return `₹${n.toLocaleString("en-IN", {
        minimumFractionDigits: hasDecimals ? 2 : 0,
        maximumFractionDigits: 2,
    })}`;
}

function UtensilsCrossed({ className }: { className?: string }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m16 2-2.3 2.3c-.4.4-.4 1 0 1.4l1.2 1.2c.4.4.4 1 0 1.4L2 21" />
            <path d="M22 2l-1.5 1.5c-1.1-1.1-2.9-1.1-4 0l-1.5 1.5" />
            <path d="M7 2h.01" />
            <path d="M7 6h.01" />
            <path d="M2.3 2.3c-.4.4-.4 1 0 1.4l1.2 1.2c.4.4.4 1 0 1.4-1.2 1.2-3 3-4.2 4.2" />
        </svg>
    );
}

interface Props {
    hotelSlug: string;
    initialData?: PublicMenuFullData | null;
}

export default function GuestMenuClient({ hotelSlug, initialData }: Props) {
    const menuRes = usePublicMenuFull(hotelSlug, { fallbackData: initialData || undefined });

    const hotel = menuRes.data?.hotel ?? null;
    const themeHotel = hotel ?? initialData?.hotel ?? null;
    const themeStyle = useMemo(() => buildGuestMenuThemeStyle(themeHotel), [themeHotel]);
    const categories = useMemo(() => menuRes.data?.categories ?? [], [menuRes.data]);
    const availableRooms = menuRes.data?.rooms ?? [];
    const isOpen = menuRes.data ? menuRes.data.isOpen !== false : true;
    const loading = menuRes.isLoading && !initialData;
    const error = menuRes.error?.message ?? "";

    const [activeCategory, setActiveCategory] = useState<string>("");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [showCart, setShowCart] = useState(false);
    const [placing, setPlacing] = useState(false);
    const [order, setOrder] = useState<Order | null>(null);
    const [guestName, setGuestName] = useState("");
    const [notes, setNotes] = useState("");
    const [selectedRoomId, setSelectedRoomId] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [dietFilters, setDietFilters] = useState<GuestDietFilterKey[]>([]);
    const [sortBy, setSortBy] = useState<GuestMenuSort>("default");
    const [cartAnimKey, setCartAnimKey] = useState(0);
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinModalPurpose, setPinModalPurpose] = useState<"ORDER" | "BILL">("ORDER");
    const [pastOrders, setPastOrders] = useState<Order[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [guestLogoFailed, setGuestLogoFailed] = useState(false);

    const [brandingBarHidden, setBrandingBarHidden] = useState(false);
    const lastScrollYForBranding = useRef(0);
    const scrollSpySuspended = useRef(false);
    const guestHeaderRef = useRef<HTMLElement | null>(null);

    const searchParams = useSearchParams();
    const roomParam = searchParams.get("room") || selectedRoomId;
    const resolvedRoomId = useMemo(() => {
        if (!roomParam || availableRooms.length === 0) return "";
        const byId = availableRooms.find((r) => r.id === roomParam);
        if (byId) return byId.id;
        const byCode = availableRooms.find((r) => r.scanCode != null && r.scanCode !== "" && r.scanCode === roomParam);
        return byCode?.id ?? "";
    }, [roomParam, availableRooms]);
    const currentRoom = availableRooms.find((r) => r.id === resolvedRoomId);
    const roomDisplayName = currentRoom?.number || "";

    const guestServicesHref = useMemo(() => {
        const base = `/services/${hotelSlug}`;
        const r = roomParam?.trim();
        if (!r) return base;
        return `${base}?room=${encodeURIComponent(r)}`;
    }, [hotelSlug, roomParam]);

    const guestCallNumber = useMemo(
        () => hotel?.roomServicePhone?.trim() || hotel?.phone?.trim() || "",
        [hotel?.roomServicePhone, hotel?.phone],
    );

    const promptedRoomRef = useRef<string | null>(null);
    const { pin: stayPin } = useStaySession(resolvedRoomId);

    const digitalOrderingEnabled = hotel?.features ? hotel.features.includes("DIGITAL_ORDERING") : true;
    const serviceRequestsEnabled = hotel?.features ? hotel.features.includes("SERVICE_REQUESTS") : true;

    useEffect(() => {
        if (!resolvedRoomId || loading) return;
        if (!digitalOrderingEnabled && !serviceRequestsEnabled) return;
        if (promptedRoomRef.current === resolvedRoomId) return;
        const token = getStayToken(resolvedRoomId);
        const pin = getStayPin(resolvedRoomId);
        if (!token || !pin) {
            promptedRoomRef.current = resolvedRoomId;
            setShowPinModal(true);
        }
    }, [resolvedRoomId, loading, digitalOrderingEnabled, serviceRequestsEnabled]);

    useEffect(() => {
        if (categories.length > 0 && !activeCategory) setActiveCategory(categories[0].id);
    }, [categories, activeCategory]);

    const dietFilterSet = useMemo(() => new Set(dietFilters), [dietFilters]);
    const searchNormalized = normalizeSearchText(searchQuery);

    const dietFilteredCategories = useMemo(
        () => filterCategoriesByDiet(categories, dietFilterSet),
        [categories, dietFilterSet],
    );

    const filteredCategories = useMemo(() => {
        const afterSearch = searchNormalized
            ? filterCategoriesBySearch(dietFilteredCategories, searchQuery)
            : dietFilteredCategories.map((c) => ({ ...c, items: [...(c.items ?? [])] }));
        return applySortToCategories(afterSearch, sortBy);
    }, [dietFilteredCategories, searchQuery, searchNormalized, sortBy]);

    const searchResultCount = useMemo(() => flattenMenuItems(filteredCategories).length, [filteredCategories]);
    const isSearchUnmatched = searchNormalized.length > 0 && searchResultCount === 0;
    const isDietUnmatched = dietFilters.length > 0 && searchResultCount === 0 && !isSearchUnmatched;

    const displayCategories = useMemo(() => {
        if (searchResultCount > 0) {
            return filteredCategories;
        }
        const fallback = applySortToCategories(dietFilteredCategories, sortBy);
        if (flattenMenuItems(fallback).length > 0) {
            return fallback;
        }
        return applySortToCategories(categories, sortBy);
    }, [searchResultCount, filteredCategories, dietFilteredCategories, categories, sortBy]);

    const didYouMeanItem = useMemo(() => {
        if (searchNormalized.length < 3) return null;
        if (searchResultCount > 0) return null;
        const pool = flattenMenuItems(dietFilteredCategories.length > 0 ? dietFilteredCategories : categories);
        return findDidYouMeanItem(searchQuery, pool);
    }, [searchQuery, searchNormalized, searchResultCount, dietFilteredCategories, categories]);

    const chipCategories = displayCategories;

    useEffect(() => {
        if (displayCategories.length === 0) return;
        if (!displayCategories.some((c) => c.id === activeCategory)) {
            setActiveCategory(displayCategories[0].id);
        }
    }, [displayCategories, activeCategory]);

    function toggleDietFilter(key: GuestDietFilterKey) {
        setDietFilters((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    }

    function removeDietFilter(key: GuestDietFilterKey) {
        setDietFilters((prev) => prev.filter((k) => k !== key));
    }

    function clearAllMenuFilters() {
        setSortBy("default");
        setDietFilters([]);
    }

    const activeSortLabel = sortBy === "name-asc" ? "Name (A–Z)" : sortBy === "name-desc" ? "Name (Z–A)" : sortBy === "price-asc" ? "Price (low to high)" : sortBy === "price-desc" ? "Price (high to low)" : "Sort";
    
    const resultCount = searchResultCount;
    const hasActiveFilters = searchNormalized.length > 0 || dietFilters.length > 0 || sortBy !== "default";
    const menuFiltersActive = sortBy !== "default" || dietFilters.length > 0;
    const chipCategoryIdsKey = useMemo(() => chipCategories.map((c) => c.id).join("|"), [chipCategories]);

    const chipCategoriesRef = useRef(chipCategories);
    chipCategoriesRef.current = chipCategories;
    const brandingBarHiddenRef = useRef(brandingBarHidden);
    brandingBarHiddenRef.current = brandingBarHidden;

    useEffect(() => {
        lastScrollYForBranding.current = typeof window !== "undefined" ? window.scrollY : 0;
        let raf = 0;
        const onScroll = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                const y = window.scrollY;
                const last = lastScrollYForBranding.current;
                const delta = y - last;
                lastScrollYForBranding.current = y;

                if (y < 20) {
                    setBrandingBarHidden(false);
                    return;
                }
                if (delta > 6 && y > 44) {
                    setBrandingBarHidden(true);
                } else if (delta < -8) {
                    setBrandingBarHidden(false);
                }
            });
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("scroll", onScroll);
        };
    }, []);

    useEffect(() => {
        if (!chipCategoryIdsKey) return;
        let raf = 0;
        const updateActiveFromScroll = () => {
            if (scrollSpySuspended.current) return;
            const list = chipCategoriesRef.current;
            if (list.length === 0) return;
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                const cats = chipCategoriesRef.current;
                if (cats.length === 0) return;
                const line = (menuFiltersActive ? 182 : 128) - (brandingBarHiddenRef.current ? 56 : 0);
                let currentId = cats[0].id;
                for (const cat of cats) {
                    const el = document.getElementById(`cat-${cat.id}`);
                    if (!el) continue;
                    const top = el.getBoundingClientRect().top;
                    if (top <= line) currentId = cat.id;
                }
                setActiveCategory((prev) => (prev === currentId ? prev : currentId));
            });
        };
        updateActiveFromScroll();
        window.addEventListener("scroll", updateActiveFromScroll, { passive: true });
        window.addEventListener("resize", updateActiveFromScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", updateActiveFromScroll);
            window.removeEventListener("resize", updateActiveFromScroll);
            cancelAnimationFrame(raf);
        };
    }, [chipCategoryIdsKey, menuFiltersActive, brandingBarHidden]);

    useLayoutEffect(() => {
        const el = guestHeaderRef.current;
        if (!el) return;
        const CSS_VAR = "--guest-menu-sticky-top";
        const update = () => {
            const h = Math.ceil(el.getBoundingClientRect().height);
            document.documentElement.style.setProperty(CSS_VAR, `${h}px`);
        };
        update();
        const ro = new ResizeObserver(() => update());
        ro.observe(el);
        window.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", update, { passive: true });
        return () => {
            ro.disconnect();
            window.removeEventListener("scroll", update);
            window.removeEventListener("resize", update);
            document.documentElement.style.removeProperty(CSS_VAR);
        };
    }, [brandingBarHidden, menuFiltersActive]);

    const MENU_TITLE_BRAND = "Dream Canvas";
    useEffect(() => {
        const hotelTitle = hotel?.name?.trim() || (loading ? "" : hotelSlug);
        if (!hotelTitle) {
            document.title = `Menu | ${MENU_TITLE_BRAND}`;
            return;
        }
        const roomTitle = roomDisplayName ? `Room ${roomDisplayName}` : "Guest";
        document.title = `${hotelTitle} | ${roomTitle} | ${MENU_TITLE_BRAND}`;
    }, [hotel?.name, hotelSlug, roomDisplayName, loading]);

    const orderRef = useRef<Order | null>(null);
    orderRef.current = order;
    
    const loadPastOrders = useCallback(async () => {
        if (!resolvedRoomId) return;
        try {
            const stayToken = getStayToken(resolvedRoomId);
            const orders = await api.getGuestRoomOrders(resolvedRoomId, stayToken || undefined);
            setPastOrders(orders);
            const tracking = orderRef.current;
            if (tracking?.id) {
                const match = orders.find((o) => o.id === tracking.id);
                if (match && match.status !== tracking.status) setOrder(match);
            }
        } catch (err) {
            console.error("Failed to load past orders", err);
        }
    }, [resolvedRoomId]);

    const roomBillGrandTotal = useMemo(
        () => pastOrders.reduce((sum, o) => sum + (o.status !== "CANCELLED" ? Number(o.totalAmount || 0) : 0), 0),
        [pastOrders],
    );

    useEffect(() => {
        if (resolvedRoomId) loadPastOrders();
    }, [resolvedRoomId, loadPastOrders]);

    useEffect(() => {
        if (showHistory && resolvedRoomId) void loadPastOrders();
    }, [showHistory, resolvedRoomId, loadPastOrders]);

    const handleOrderUpdated = useCallback((ord: Order) => {
        setPastOrders((prev) => {
            const idx = prev.findIndex((o) => o.id === ord.id);
            if (idx >= 0) return prev.map((o) => (o.id === ord.id ? ord : o));
            return [...prev, ord];
        });
        setOrder((o) => (o?.id === ord.id ? ord : o));
    }, []);

    useActivityStreamGuest({
        hotelSlug,
        roomId: resolvedRoomId || "",
        enabled: !!resolvedRoomId,
        onOrderNew: loadPastOrders,
        onOrderUpdated: handleOrderUpdated,
    });

    function addToCart(item: MenuItem) {
        setCart((prev) => {
            const existing = prev.find((ci) => ci.item.id === item.id);
            if (existing) return prev.map((ci) => (ci.item.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci));
            return [...prev, { item, quantity: 1 }];
        });
        setCartAnimKey((k) => k + 1);
    }
    function removeFromCart(itemId: string) {
        setCart((prev) => {
            const existing = prev.find((ci) => ci.item.id === itemId);
            if (existing && existing.quantity > 1) return prev.map((ci) => (ci.item.id === itemId ? { ...ci, quantity: ci.quantity - 1 } : ci));
            return prev.filter((ci) => ci.item.id !== itemId);
        });
    }
    function getCartQuantity(itemId: string) {
        return cart.find((ci) => ci.item.id === itemId)?.quantity || 0;
    }
    const cartTotal = cart.reduce((sum, ci) => sum + Number(ci.item.price) * ci.quantity, 0);
    const cartCount = cart.reduce((sum, ci) => sum + ci.quantity, 0);

    const orderIdempotencyKeyRef = useRef<string>("");
    
    function initiateOrder() {
        if (!resolvedRoomId) {
            setShowCart(false);
            setShowRoomModal(true);
            return;
        }
        const existingToken = getStayToken(resolvedRoomId);
        if (!existingToken) {
            setPinModalPurpose("ORDER");
            setShowPinModal(true);
            return;
        }
        void placeOrder(existingToken);
    }
    function confirmRoomFromModal() {
        if (!resolvedRoomId) return;
        setShowRoomModal(false);
        if (isOpen) {
            const existingToken = getStayToken(resolvedRoomId);
            if (!existingToken) {
                setPinModalPurpose("ORDER");
                setShowPinModal(true);
                return;
            }
            void placeOrder(existingToken);
            return;
        }
        setShowCart(true);
    }
    async function placeOrder(stayTokenOverride?: string) {
        if (!isOpen || !resolvedRoomId) return;
        const token = stayTokenOverride || getStayToken(resolvedRoomId);
        if (!token) {
            setPinModalPurpose("ORDER");
            setShowPinModal(true);
            return;
        }
        if (!orderIdempotencyKeyRef.current) {
            orderIdempotencyKeyRef.current = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `order-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        }
        const idempotencyKey = orderIdempotencyKeyRef.current;
        setPlacing(true);
        try {
            const result = await api.placeOrder({
                roomId: resolvedRoomId,
                items: cart.map((ci) => ({ itemId: ci.item.id, quantity: ci.quantity })),
                notes: notes || undefined,
                guestName: guestName || undefined,
                stayToken: token,
                idempotencyKey,
            });
            orderIdempotencyKeyRef.current = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `order-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            setOrder(result);
            setCart([]);
            setShowCart(false);
            setShowRoomModal(false);
            setShowPinModal(false);
            loadPastOrders();
            toast.success(`Order #${result.orderNumber} placed successfully!`);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to place order";
            if (msg.toLowerCase().includes("pin") || msg.toLowerCase().includes("vacant") || msg.toLowerCase().includes("checked out") || msg.toLowerCase().includes("stay") || msg.toLowerCase().includes("session")) {
                clearStayToken(resolvedRoomId);
                setShowPinModal(true);
            }
            toast.error(msg);
        } finally {
            setPlacing(false);
        }
    }

    function scrollToCategory(categoryId: string) {
        scrollSpySuspended.current = true;
        setActiveCategory(categoryId);
        const el = document.getElementById(`cat-${categoryId}`);
        const reduceMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        const scrollBehavior: ScrollBehavior = reduceMotion ? "auto" : "smooth";
        el?.scrollIntoView({ behavior: scrollBehavior, block: "start" });
        const resumeSpy = () => { scrollSpySuspended.current = false; };
        const onScrollEnd = () => {
            window.removeEventListener("scrollend", onScrollEnd);
            resumeSpy();
        };
        window.addEventListener("scrollend", onScrollEnd, { passive: true });
        window.setTimeout(() => {
            window.removeEventListener("scrollend", onScrollEnd);
            resumeSpy();
        }, 1200);
    }

    const guestMenuState: GuestMenuState = {
        hotelSlug,
        hotel,
        categories,
        availableRooms,
        isOpen,
        loading,
        error,
        themeStyle,
        cart,
        addToCart,
        removeFromCart,
        getCartQuantity,
        cartTotal,
        cartCount,
        cartAnimKey,
        setCart,
        showCart,
        setShowCart,
        placing,
        setPlacing,
        order,
        setOrder,
        guestName,
        setGuestName,
        notes,
        setNotes,
        selectedRoomId,
        setSelectedRoomId,
        searchQuery,
        setSearchQuery,
        dietFilters,
        setDietFilters,
        sortBy,
        setSortBy,
        showRoomModal,
        setShowRoomModal,
        showPinModal,
        setShowPinModal,
        pinModalPurpose,
        setPinModalPurpose,
        pastOrders,
        setPastOrders,
        showHistory,
        setShowHistory,
        resolvedRoomId,
        roomDisplayName,
        guestServicesHref,
        guestCallNumber,
        digitalOrderingEnabled,
        serviceRequestsEnabled,
        loadPastOrders,
        placeOrder,
        initiateOrder,
        confirmRoomFromModal,
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--guest-bg)] page-transition text-[var(--guest-text)]" style={themeStyle}>
                <div className="sticky top-0 z-30 border-b border-[var(--guest-line)] bg-[var(--guest-bg)] backdrop-blur-xl">
                    <div className="max-w-md mx-auto px-4 py-4 space-y-3">
                        <div className="flex items-center gap-2 pb-2">
                            <div className="h-9 w-9 shrink-0 rounded-lg animate-shimmer bg-[var(--guest-shimmer)]/80" />
                            <div className="min-w-0 flex-1 space-y-1.5">
                                <div className="h-3.5 w-28 animate-shimmer rounded bg-[var(--guest-shimmer)]/80" />
                                <div className="h-2.5 w-20 animate-shimmer rounded bg-[var(--guest-shimmer)]/80" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-10 min-w-0 flex-1 animate-shimmer rounded-full bg-[var(--guest-shimmer)]/80" />
                            <div className="h-10 w-10 shrink-0 rounded-full animate-shimmer bg-[var(--guest-shimmer)]/80" />
                        </div>
                    </div>
                </div>
                <div className="max-w-md mx-auto px-4 py-6 space-y-6">
                    {Array.from({ length: 3 }).map((_, s) => (
                        <div key={s} className="space-y-3">
                            <div className="h-5 w-32 animate-shimmer rounded bg-[var(--guest-shimmer)]/80" />
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={`${s}-${i}`} className="flex gap-3 border-b border-dashed border-[var(--guest-line)] pb-4" style={{ animationDelay: `${i * 0.1}s` }}>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-[70%] animate-shimmer rounded bg-[var(--guest-shimmer)]/80" />
                                        <div className="h-3 w-16 animate-shimmer rounded bg-[var(--guest-shimmer)]/80" />
                                        <div className="h-3 w-full animate-shimmer rounded bg-[var(--guest-shimmer)]/80" />
                                    </div>
                                    <div className="w-[108px] shrink-0 space-y-2">
                                        <div className="aspect-[4/3] w-full animate-shimmer rounded-lg bg-[var(--guest-shimmer)]/80" />
                                        <div className="h-9 w-full animate-shimmer rounded-md bg-[var(--guest-shimmer)]/80" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--guest-bg)] px-4 text-center text-[var(--guest-text)]" style={themeStyle}>
                <div>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--guest-accent-15)] text-[var(--guest-accent)]">
                        <UtensilsCrossed className="h-8 w-8" />
                    </div>
                    <h2 className="mb-2 text-xl font-bold text-[var(--guest-text)]">Menu unavailable</h2>
                    <p className="text-sm text-[var(--guest-muted)]">{error}</p>
                </div>
            </div>
        );
    }

    if (order) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--guest-bg)] px-6 text-[var(--guest-text)]" style={themeStyle}>
                <div className="animate-scale-in w-full max-w-sm text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 ring-4 ring-emerald-500/10">
                        <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h1 className="mb-2 text-2xl font-bold text-[var(--guest-text)]">Order confirmed</h1>
                    <p className="mb-8 text-[var(--guest-muted)]">
                        Order <span className="font-mono font-medium text-[var(--guest-text)]">#{order.orderNumber}</span> has been sent to the kitchen.
                    </p>
                    <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--guest-line)] bg-[var(--guest-surface)] text-left">
                        <div className="flex items-center justify-between border-b border-[var(--guest-line)] bg-[var(--guest-text-12)] px-4 py-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--guest-muted)]">Receipt</span>
                            <Badge variant={order.status === "DELIVERED" ? "success" : order.status === "CANCELLED" ? "danger" : "warning"}>{order.status}</Badge>
                        </div>
                        <div className="space-y-3 p-4">
                            {order.items.map((oi) => (
                                <div key={oi.id} className="flex justify-between text-sm">
                                    <span className="text-[var(--guest-muted)]">
                                        <span className="mr-2 font-semibold text-[var(--guest-text)]">{oi.quantity}x</span>
                                        {oi.itemName}
                                    </span>
                                    <span className="font-medium text-[var(--guest-text)]">{formatPrice(Number(oi.price) * oi.quantity)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center justify-between border-t border-[var(--guest-line)] bg-[var(--guest-text-12)] px-4 py-4">
                            <span className="font-semibold text-[var(--guest-text)]">Total</span>
                            <span className="text-lg font-bold text-[var(--guest-accent)]">{formatPrice(order.totalAmount)}</span>
                        </div>
                    </div>
                    <Button className="w-full border-[var(--guest-line)] bg-[var(--guest-surface-2)] text-[var(--guest-text)] hover:opacity-90" variant="secondary" onClick={() => setOrder(null)}>
                        Back to menu
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <GuestMenuProvider value={guestMenuState}>
            <div className="min-h-screen bg-[var(--guest-bg)] pb-28 font-sans text-[var(--guest-text)] page-transition" style={themeStyle}>
                <GuestHeader
                    guestHeaderRef={guestHeaderRef as React.RefObject<HTMLElement>}
                    brandingBarHidden={brandingBarHidden}
                    guestLogoFailed={guestLogoFailed}
                    setGuestLogoFailed={setGuestLogoFailed}
                    menuFiltersActive={menuFiltersActive}
                    clearAllMenuFilters={clearAllMenuFilters}
                    activeSortLabel={activeSortLabel}
                    removeDietFilter={removeDietFilter}
                    toggleDietFilter={toggleDietFilter}
                    stayPin={stayPin}
                />

                <main className="mx-auto w-full min-w-0 max-w-md space-y-8 overflow-x-clip px-4 py-5">
                    {!isOpen && (
                        <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 flex items-center gap-3 animate-fade-in-up">
                            <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-[var(--guest-text)] text-sm">Room service is currently closed</p>
                                <p className="text-xs text-[var(--guest-muted)]">Orders can be placed during operating hours.</p>
                            </div>
                        </div>
                    )}
                    {resolvedRoomId && digitalOrderingEnabled ? (
                        <button
                            type="button"
                            onClick={() => {
                                const existingToken = getStayToken(resolvedRoomId);
                                if (!existingToken) {
                                    setPinModalPurpose("BILL");
                                    setShowPinModal(true);
                                    return;
                                }
                                setShowHistory(true);
                            }}
                            className="flex w-full items-center gap-3 rounded-xl border border-[var(--guest-line)] bg-[var(--guest-text-12)] px-4 py-3 text-left transition-colors hover:border-[var(--guest-accent-35)] hover:bg-[var(--guest-surface-2)]"
                        >
                            <Receipt className="h-5 w-5 shrink-0 text-[var(--guest-accent)]" aria-hidden />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-[var(--guest-text)]">Room bill</p>
                                <p className="text-xs text-[var(--guest-muted)]">
                                    {pastOrders.length === 0
                                        ? "No orders yet — tap to view"
                                        : roomBillGrandTotal > 0
                                            ? `${formatPrice(roomBillGrandTotal)} total so far`
                                            : "No active charges — tap for history"}
                                </p>
                            </div>
                            <ChevronRight className="h-5 w-5 shrink-0 text-[var(--guest-muted)]" aria-hidden />
                        </button>
                    ) : null}
                    {serviceRequestsEnabled && (
                        <Link
                            href={guestServicesHref}
                            className="flex w-full items-center gap-3 rounded-xl border border-[var(--guest-line)] bg-[var(--guest-text-12)] px-4 py-3 text-left transition-colors hover:border-[var(--guest-accent-35)] hover:bg-[var(--guest-surface-2)]"
                        >
                            <Headset className="h-5 w-5 shrink-0 text-[var(--guest-accent)]" aria-hidden />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-[var(--guest-text)]">Guest services</p>
                                <p className="text-xs text-[var(--guest-muted)]">Complaints, housekeeping &amp; room requests</p>
                            </div>
                            <ChevronRight className="h-5 w-5 shrink-0 text-[var(--guest-muted)]" aria-hidden />
                        </Link>
                    )}
                    {hasActiveFilters && resultCount > 0 && (
                        <div className="text-xs text-[var(--guest-muted)]">
                            <span className="font-semibold text-[var(--guest-muted)]">{resultCount}</span>{" "}
                            {resultCount === 1 ? "dish" : "dishes"}
                            {searchNormalized ? (
                                <>
                                    {" "}
                                    for &ldquo;<span className="text-[var(--guest-accent-70)]">{searchQuery.trim()}</span>&rdquo;
                                </>
                            ) : null}
                            {dietFilters.length > 0 ? <span> · diet filter on</span> : null}
                            {sortBy !== "default" ? <span> · sorted</span> : null}
                        </div>
                    )}
                    {isSearchUnmatched && (
                        <div className="rounded-2xl border border-[var(--guest-accent-25)] bg-[var(--guest-accent-12)] p-4 sm:p-5 transition-all animate-fade-in-up">
                            <div className="flex items-start gap-3.5">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--guest-accent-20)] text-[var(--guest-accent)]">
                                    <Utensils className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-sm sm:text-base font-bold text-[var(--guest-text)]">
                                        Item not available
                                    </h3>
                                    <p className="mt-1 text-xs sm:text-sm text-[var(--guest-muted)] leading-relaxed">
                                        The food item &ldquo;<span className="font-semibold text-[var(--guest-text)]">{searchQuery.trim()}</span>&rdquo; is not available. You can try exploring our other delicious dishes below!
                                    </p>
                                    {didYouMeanItem && (
                                        <div className="mt-2.5 flex items-center gap-2 text-xs">
                                            <span className="text-[var(--guest-muted)]">Did you mean:</span>
                                            <button
                                                type="button"
                                                onClick={() => setSearchQuery(didYouMeanItem.name)}
                                                className="font-semibold text-[var(--guest-accent)] hover:underline"
                                            >
                                                {didYouMeanItem.name}
                                            </button>
                                        </div>
                                    )}
                                    <div className="mt-3 flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery("")}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--guest-line)] bg-[var(--guest-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--guest-text)] shadow-sm hover:bg-[var(--guest-surface-2)] transition-colors"
                                        >
                                            <X className="h-3.5 w-3.5 text-[var(--guest-muted)]" />
                                            Clear search
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {isDietUnmatched && (
                        <div className="rounded-2xl border border-[var(--guest-accent-25)] bg-[var(--guest-accent-12)] p-4 sm:p-5 transition-all animate-fade-in-up">
                            <div className="flex items-start gap-3.5">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--guest-accent-20)] text-[var(--guest-accent)]">
                                    <Utensils className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-sm sm:text-base font-bold text-[var(--guest-text)]">
                                        No matching dishes
                                    </h3>
                                    <p className="mt-1 text-xs sm:text-sm text-[var(--guest-muted)] leading-relaxed">
                                        No dishes match your selected diet filters. Exploring all other available menu options below!
                                    </p>
                                    <div className="mt-3 flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setDietFilters([])}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--guest-line)] bg-[var(--guest-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--guest-text)] shadow-sm hover:bg-[var(--guest-surface-2)] transition-colors"
                                        >
                                            <X className="h-3.5 w-3.5 text-[var(--guest-muted)]" />
                                            Clear diet filters
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <GuestMenuList
                        displayCategories={displayCategories}
                        brandingBarHidden={brandingBarHidden}
                        menuFiltersActive={menuFiltersActive}
                        searchNormalized={searchNormalized}
                    />

                </main>

                {digitalOrderingEnabled && (cartCount > 0 || showCart || showHistory || showRoomModal) && (
                    <AnimatedOverlays
                        showCart={showCart}
                        showHistory={showHistory}
                        showRoomModal={showRoomModal}
                        cartCount={cartCount}
                        cart={cart}
                        cartTotal={cartTotal}
                        cartAnimKey={cartAnimKey}
                        isOpen={isOpen}
                        guestName={guestName}
                        notes={notes}
                        placing={placing}
                        pastOrders={pastOrders}
                        availableRooms={availableRooms}
                        selectedRoomId={selectedRoomId}
                        onCloseCart={() => setShowCart(false)}
                        onCloseHistory={() => setShowHistory(false)}
                        onCloseRoomModal={() => setShowRoomModal(false)}
                        onShowCart={() => setShowCart(true)}
                        onConfirmRoom={confirmRoomFromModal}
                        onInitiateOrder={initiateOrder}
                        onRemoveFromCart={removeFromCart}
                        onAddToCart={addToCart}
                        setGuestName={setGuestName}
                        setNotes={setNotes}
                        setSelectedRoomId={setSelectedRoomId}
                    />
                )}

                <GuestCategoryNav
                    chipCategories={chipCategories}
                    activeCategory={activeCategory}
                    scrollToCategory={scrollToCategory}
                />

                <StayPinModal
                    isOpen={showPinModal}
                    onClose={() => setShowPinModal(false)}
                    roomId={resolvedRoomId}
                    roomNumber={roomDisplayName || "Your Room"}
                    onSuccess={(newToken) => {
                        setShowPinModal(false);
                        void loadPastOrders();
                        if (pinModalPurpose === "ORDER") {
                            void placeOrder(newToken);
                        } else if (pinModalPurpose === "BILL") {
                            setShowHistory(true);
                        }
                    }}
                />
            </div>
        </GuestMenuProvider>
    );
}
