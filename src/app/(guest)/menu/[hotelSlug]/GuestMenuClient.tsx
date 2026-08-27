"use client";

import { useEffect, useLayoutEffect, useState, useRef, useCallback, useMemo, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MenuItem, CartItem, Order } from "@/lib/types";
import type { PublicMenuFullData } from "@/lib/types";
import { api } from "@/lib/api";
import { usePublicMenuFull } from "@/hooks/useSwrApi";
import { useActivityStreamGuest } from "@/hooks/useActivityStream";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
    Search,
    MapPin,
    Plus,
    Minus,
    Utensils,
    X,
    CheckCircle2,
    Receipt,
    Clock,
    SlidersHorizontal,
    Egg,
    Menu,
    ShoppingBag,
    ChevronRight,
    Headset,
    ShieldCheck,
    KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryIconDisplay } from "@/lib/categoryIcons";
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
import { IndianVegMark, IndianNonVegMark } from "./GuestMenuDietIcons";
import { GuestMenuItemInsights } from "./GuestMenuItemInsights";
import { buildGuestMenuThemeStyle } from "@/lib/guestMenuTheme";
import { AnimatedOverlays } from "./GuestMenuAnimated";
import { StayPinModal } from "@/components/guest/StayPinModal";
import { getStayToken, getStayPin, clearStayToken, useStaySession } from "@/lib/staySession";
import { toast } from "sonner";


const SORT_MENU_OPTIONS: { value: GuestMenuSort; label: string }[] = [
    { value: "default", label: "Menu order" },
    { value: "name-asc", label: "Name (A–Z)" },
    { value: "name-desc", label: "Name (Z–A)" },
    { value: "price-asc", label: "Price (low to high)" },
    { value: "price-desc", label: "Price (high to low)" },
];

function formatPrice(price: number) {
    return `₹${price.toLocaleString()}`;
}

interface Props {
    hotelSlug: string;
    initialData?: PublicMenuFullData | null; // null when fetch failed
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
    const [pastOrders, setPastOrders] = useState<Order[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [guestLogoFailed, setGuestLogoFailed] = useState(false);
    const [showCategoryNav, setShowCategoryNav] = useState(false);
    const [expandedDescId, setExpandedDescId] = useState<string | null>(null);
    const [showHeaderMenu, setShowHeaderMenu] = useState(false);
    /** Hide logo + hotel name + room row on scroll down; show again on scroll up / near top. */
    const [brandingBarHidden, setBrandingBarHidden] = useState(false);
    const lastScrollYForBranding = useRef(0);

    /** True while programmatic scroll-to-section is running (ignore scroll-spy updates). */
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

    /** Guest services (complaints / requests) — same slug + room hint as menu URL when known. */
    const guestServicesHref = useMemo(() => {
        const base = `/services/${hotelSlug}`;
        const r = roomParam?.trim();
        if (!r) return base;
        return `${base}?room=${encodeURIComponent(r)}`;
    }, [hotelSlug, roomParam]);

    /** Room service line: dedicated number, else main hotel phone (Settings). */
    const guestCallNumber = useMemo(
        () => hotel?.roomServicePhone?.trim() || hotel?.phone?.trim() || "",
        [hotel?.roomServicePhone, hotel?.phone],
    );

    const promptedRoomRef = useRef<string | null>(null);
    const { pin: stayPin } = useStaySession(resolvedRoomId);

    /** Auto-prompt guest for Stay PIN when scanning QR code if token is not saved yet */
    useEffect(() => {
        if (!resolvedRoomId || loading) return;
        if (promptedRoomRef.current === resolvedRoomId) return;
        const token = getStayToken(resolvedRoomId);
        const pin = getStayPin(resolvedRoomId);
        if (!token || !pin) {
            promptedRoomRef.current = resolvedRoomId;
            setShowPinModal(true);
        }
    }, [resolvedRoomId, loading]);

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

    /** Categories for scroll-spy + bottom “Menu” sheet (same as displayed list). */
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

    const activeSortLabel = SORT_MENU_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Sort";

    const resultCount = searchResultCount;
    const hasActiveFilters = searchNormalized.length > 0 || dietFilters.length > 0 || sortBy !== "default";
    /** Sort or diet chosen from menu — show strip under search + adjust scroll offsets. */
    const menuFiltersActive = sortBy !== "default" || dietFilters.length > 0;

    const chipCategoryIdsKey = useMemo(() => chipCategories.map((c) => c.id).join("|"), [chipCategories]);

    const chipCategoriesRef = useRef(chipCategories);
    chipCategoriesRef.current = chipCategories;

    const brandingBarHiddenRef = useRef(brandingBarHidden);
    brandingBarHiddenRef.current = brandingBarHidden;

    /** Collapse branding row based on scroll direction (search + filters stay visible). */
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

    /** Scroll-spy: active section for bottom Menu sheet highlight. */
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
                const line =
                    (menuFiltersActive ? 182 : 128) - (brandingBarHiddenRef.current ? 56 : 0);
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

    useEffect(() => {
        setGuestLogoFailed(false);
    }, [hotel?.logoUrl, hotel?.id]);

    useEffect(() => {
        if (!showHeaderMenu) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setShowHeaderMenu(false);
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [showHeaderMenu]);

    /** Pixel offset for sticky category titles = guest header height (updates when branding/filters change). */
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
    }, []);

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
            const orders = await api.getGuestRoomOrders(resolvedRoomId);
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
        () => pastOrders.reduce((sum, o) => sum + (o.status !== "CANCELLED" ? o.totalAmount : 0), 0),
        [pastOrders],
    );

    useEffect(() => {
        if (resolvedRoomId) loadPastOrders();
    }, [resolvedRoomId, loadPastOrders]);

    useEffect(() => {
        if (showHistory && resolvedRoomId) {
            void loadPastOrders();
        }
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

    const cartTotal = cart.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0);
    const cartCount = cart.reduce((sum, ci) => sum + ci.quantity, 0);

    function initiateOrder() {
        if (!resolvedRoomId) {
            setShowCart(false);
            setShowRoomModal(true);
            return;
        }
        const existingToken = getStayToken(resolvedRoomId);
        if (!existingToken) {
            setShowPinModal(true);
            return;
        }
        void placeOrder(existingToken);
    }

    /** Room modal primary action: persist room when closed; submit when open. */
    function confirmRoomFromModal() {
        if (!resolvedRoomId) return;
        setShowRoomModal(false);
        if (isOpen) {
            const existingToken = getStayToken(resolvedRoomId);
            if (!existingToken) {
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
            setShowPinModal(true);
            return;
        }

        setPlacing(true);
        try {
            const result = await api.placeOrder({
                roomId: resolvedRoomId,
                items: cart.map((ci) => ({ itemId: ci.item.id, quantity: ci.quantity })),
                notes: notes || undefined,
                guestName: guestName || undefined,
                stayToken: token,
            });
            setOrder(result);
            setCart([]);
            setShowCart(false);
            setShowRoomModal(false);
            setShowPinModal(false);
            loadPastOrders();
            toast.success(`Order #${result.orderNumber} placed successfully!`);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to place order";
            if (
                msg.toLowerCase().includes("pin") ||
                msg.toLowerCase().includes("vacant") ||
                msg.toLowerCase().includes("checked out") ||
                msg.toLowerCase().includes("stay") ||
                msg.toLowerCase().includes("session")
            ) {
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
        const reduceMotion =
            typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        const scrollBehavior: ScrollBehavior = reduceMotion ? "auto" : "smooth";
        el?.scrollIntoView({ behavior: scrollBehavior, block: "start" });

        const resumeSpy = () => {
            scrollSpySuspended.current = false;
        };
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
                                <div
                                    key={`${s}-${i}`}
                                    className="flex gap-3 border-b border-dashed border-[var(--guest-line)] pb-4"
                                    style={{ animationDelay: `${i * 0.1}s` }}
                                >
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
                                    <span className="font-medium text-[var(--guest-text)]">{formatPrice(oi.price * oi.quantity)}</span>
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
        <div className="min-h-screen bg-[var(--guest-bg)] pb-28 font-sans text-[var(--guest-text)] page-transition" style={themeStyle}>
            <header
                ref={guestHeaderRef}
                className="sticky top-0 z-50 w-full min-w-0 max-w-full border-b border-[var(--guest-line)] bg-[var(--guest-bg)] backdrop-blur-xl supports-[backdrop-filter]:bg-[var(--guest-bg)]"
            >
                <div
                    className={cn(
                        "mx-auto w-full min-w-0 max-w-md px-4 pb-2 transition-[padding] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none",
                        brandingBarHidden ? "pt-2" : "pt-3",
                    )}
                >
                    {/*
                      max-height + opacity animates more smoothly than grid-template-rows 0fr/1fr
                      across browsers when collapsing the hotel row above search.
                    */}
                    <div
                        className={cn(
                            "overflow-hidden transition-[max-height,opacity] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none",
                            brandingBarHidden ? "pointer-events-none max-h-0 opacity-0" : "max-h-[8rem] opacity-100",
                        )}
                        aria-hidden={brandingBarHidden}
                    >
                        <div className="flex items-center justify-between gap-2.5 pb-2.5">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                {hotel?.logoUrl?.trim() && !guestLogoFailed ? (
                                    <Image
                                        src={hotel.logoUrl.trim()}
                                        alt=""
                                        width={36}
                                        height={36}
                                        sizes="36px"
                                        priority
                                        className="h-9 w-9 shrink-0 rounded-lg bg-[var(--guest-surface)] object-cover ring-1 ring-[var(--guest-line)]"
                                        onError={() => setGuestLogoFailed(true)}
                                    />
                                ) : (
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--guest-cta)] to-[var(--guest-cta-hover)] text-sm font-bold text-[var(--guest-on-cta)] ring-1 ring-[var(--guest-line)]">
                                        {hotel?.name?.charAt(0) || "H"}
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <h1 className="truncate text-sm font-bold leading-tight text-[var(--guest-text)]">{hotel?.name}</h1>
                                    <p className="flex items-center gap-1 text-[11px] text-[var(--guest-muted)]">
                                        {roomDisplayName ? (
                                            <>
                                                <MapPin className="h-3 w-3 shrink-0 text-[var(--guest-accent)]" />
                                                <span>Room {roomDisplayName}</span>
                                            </>
                                        ) : (
                                            <span className="italic text-[var(--guest-subtle)]">Digital menu</span>
                                        )}
                                    </p>
                                    {guestCallNumber ? (
                                        <p className="mt-1 text-[11px] leading-snug text-[var(--guest-muted)]">
                                            <span className="font-medium text-[var(--guest-text)]">Room service</span>
                                            <span className="mx-1 text-[var(--guest-subtle)]">·</span>
                                            <span className="break-all font-medium tabular-nums text-[var(--guest-text)]">
                                                {guestCallNumber}
                                            </span>
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                            {stayPin ? (
                                <button
                                    type="button"
                                    onClick={() => setShowPinModal(true)}
                                    className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shadow-sm transition hover:bg-emerald-500/20 active:scale-95"
                                    title={`Room ${roomDisplayName || ""} Stay PIN: ${stayPin} (Click to re-verify)`}
                                >
                                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                    <span className="text-[10px] font-sans font-medium text-[var(--guest-muted)]">PIN</span>
                                    <span className="font-mono font-bold tracking-wider">{stayPin}</span>
                                </button>
                            ) : null}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative min-w-0 flex-1">
                            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--guest-muted)]" />
                            <input
                                type="search"
                                enterKeyHint="search"
                                placeholder='Search "biryani", "coffee"...'
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-full border border-[var(--guest-line)] bg-[var(--guest-surface)] py-2.5 pl-10 pr-10 text-sm text-[var(--guest-text)] placeholder:text-[var(--guest-muted)] focus:border-[var(--guest-accent-40)] focus:outline-none focus:ring-1 focus:ring-[var(--guest-accent-30)]"
                            />
                            {searchQuery ? (
                                <button
                                    type="button"
                                    aria-label="Clear search"
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--guest-muted)] hover:bg-[var(--guest-surface-2)] hover:text-[var(--guest-text-70)]"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            ) : null}
                        </div>
                        <div className="relative flex shrink-0 items-center gap-1.5">
                            {cartCount > 0 ? (
                                <button
                                    type="button"
                                    onClick={() => setShowCart(true)}
                                    className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[var(--guest-surface)] text-[var(--guest-accent)] ring-1 ring-[var(--guest-line)] hover:bg-[var(--guest-surface-2)]"
                                    aria-label={`View cart, ${cartCount} items`}
                                >
                                    <ShoppingBag className="h-5 w-5" strokeWidth={2} />
                                    <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--guest-cta)] px-1 text-[10px] font-bold text-[var(--guest-on-cta)] tabular-nums">
                                        {cartCount > 99 ? "99+" : cartCount}
                                    </span>
                                </button>
                            ) : null}
                            <button
                                type="button"
                                onClick={() => setShowHeaderMenu((v) => !v)}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--guest-surface)] text-[var(--guest-muted)] ring-1 ring-[var(--guest-line)] hover:bg-[var(--guest-surface-2)] hover:text-[var(--guest-text)]"
                                aria-expanded={showHeaderMenu}
                                aria-haspopup="menu"
                                aria-label={showHeaderMenu ? "Close menu" : "Menu, sort and filters"}
                            >
                                {showHeaderMenu ? <X className="h-5 w-5" strokeWidth={2.25} /> : <Menu className="h-5 w-5" strokeWidth={2} />}
                            </button>
                            {showHeaderMenu ? (
                                <div
                                    role="menu"
                                    className="absolute right-0 top-12 z-[60] w-[min(calc(100vw-1.5rem),17.5rem)] max-h-[min(72vh,28rem)] overflow-y-auto rounded-xl border border-[var(--guest-line)] bg-[var(--guest-surface)] py-2 shadow-xl shadow-black/50"
                                >
                                    {stayPin ? (
                                        <div className="mx-3 mb-2 flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs">
                                            <span className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-300">
                                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                                Room {roomDisplayName || ""} PIN
                                            </span>
                                            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 tracking-wider">{stayPin}</span>
                                        </div>
                                    ) : null}
                                    <div className="px-3 pb-1">
                                        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--guest-muted)]">
                                            <SlidersHorizontal className="h-3 w-3" aria-hidden />
                                            Sort
                                        </p>
                                    </div>
                                    <div className="px-2 pb-2">
                                        {SORT_MENU_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                role="menuitemradio"
                                                aria-checked={sortBy === opt.value}
                                                className={cn(
                                                    "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors",
                                                    sortBy === opt.value ? "bg-[var(--guest-accent-20)] text-[var(--guest-accent-90)]" : "text-[var(--guest-muted)] hover:bg-[var(--guest-surface-2)]",
                                                )}
                                                onClick={() => setSortBy(opt.value)}
                                            >
                                                <span
                                                    className={cn(
                                                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                                                        sortBy === opt.value ? "border-[var(--guest-accent-40)] bg-[var(--guest-accent-30)]" : "border-[var(--guest-border)]",
                                                    )}
                                                    aria-hidden
                                                >
                                                    {sortBy === opt.value ? <span className="h-2 w-2 rounded-full bg-[var(--guest-accent)]" /> : null}
                                                </span>
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mx-2 border-t border-[var(--guest-line)]" />
                                    <div className="px-3 pt-2 pb-1">
                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--guest-muted)]">Diet filters</p>
                                        <p className="mt-0.5 text-[11px] text-[var(--guest-subtle)]">Tap to show only matching dishes</p>
                                    </div>
                                    <div className="flex flex-col gap-1.5 px-2 pb-2">
                                        <button
                                            type="button"
                                            role="menuitemcheckbox"
                                            aria-checked={dietFilters.includes("VEG")}
                                            className={cn(
                                                "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors",
                                                dietFilters.includes("VEG")
                                                    ? "border-green-500/40 bg-green-500/10 text-green-200"
                                                    : "border-[var(--guest-line)] bg-[var(--guest-text-12)] text-[var(--guest-muted)] hover:border-[var(--guest-line)]",
                                            )}
                                            onClick={() => toggleDietFilter("VEG")}
                                        >
                                            <IndianVegMark className="h-4 w-4 shrink-0" />
                                            Vegetarian
                                        </button>
                                        <button
                                            type="button"
                                            role="menuitemcheckbox"
                                            aria-checked={dietFilters.includes("NON_VEG")}
                                            className={cn(
                                                "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors",
                                                dietFilters.includes("NON_VEG")
                                                    ? "border-red-500/40 bg-red-500/10 text-red-200"
                                                    : "border-[var(--guest-line)] bg-[var(--guest-text-12)] text-[var(--guest-muted)] hover:border-[var(--guest-line)]",
                                            )}
                                            onClick={() => toggleDietFilter("NON_VEG")}
                                        >
                                            <IndianNonVegMark className="h-4 w-4 shrink-0" />
                                            Non-vegetarian
                                        </button>
                                        <button
                                            type="button"
                                            role="menuitemcheckbox"
                                            aria-checked={dietFilters.includes("EGGITARIAN")}
                                            className={cn(
                                                "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors",
                                                dietFilters.includes("EGGITARIAN")
                                                    ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                                                    : "border-[var(--guest-line)] bg-[var(--guest-text-12)] text-[var(--guest-muted)] hover:border-[var(--guest-line)]",
                                            )}
                                            onClick={() => toggleDietFilter("EGGITARIAN")}
                                        >
                                            <Egg className="h-4 w-4 shrink-0 text-amber-400" />
                                            Egg
                                        </button>
                                    </div>
                                    <div className="mx-2 border-t border-[var(--guest-line)]" />
                                    <div className="px-2 pt-1">
                                        <Link
                                            href={guestServicesHref}
                                            role="menuitem"
                                            className="flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-left text-sm text-[var(--guest-text-70)] hover:bg-[var(--guest-surface-2)]"
                                            onClick={() => setShowHeaderMenu(false)}
                                        >
                                            <Headset className="h-4 w-4 shrink-0 text-[var(--guest-accent)]" aria-hidden />
                                            Guest services
                                        </Link>
                                    </div>
                                    {resolvedRoomId ? (
                                        <>
                                            <div className="mx-2 border-t border-[var(--guest-line)]" />
                                            <div className="px-2 pt-1">
                                                <button
                                                    type="button"
                                                    role="menuitem"
                                                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-left text-sm text-[var(--guest-text-70)] hover:bg-[var(--guest-surface-2)]"
                                                    onClick={() => {
                                                        setShowHeaderMenu(false);
                                                        setShowHistory(true);
                                                    }}
                                                >
                                                    <Receipt className="h-4 w-4 shrink-0 text-[var(--guest-accent)]" />
                                                    My bill &amp; orders
                                                </button>
                                            </div>
                                        </>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {menuFiltersActive ? (
                        <div className="mt-2.5 border-t border-[var(--guest-line)] pt-2.5" aria-label="Active filters">
                            <div className="mb-1.5 flex items-center justify-between gap-2">
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--guest-muted)]">Active filters</span>
                                <button
                                    type="button"
                                    onClick={clearAllMenuFilters}
                                    className="shrink-0 text-[11px] font-semibold text-[var(--guest-accent-90)] hover:opacity-80 hover:underline"
                                >
                                    Clear all
                                </button>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                {sortBy !== "default" ? (
                                    <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-[var(--guest-accent-35)] bg-[var(--guest-accent-12)] py-1 pl-2.5 pr-1 text-xs font-medium text-[var(--guest-accent-90)]">
                                        <SlidersHorizontal className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
                                        <span className="min-w-0 truncate">{activeSortLabel}</span>
                                        <button
                                            type="button"
                                            className="rounded-full p-1 text-[var(--guest-accent-70)] hover:bg-[var(--guest-accent-25)] hover:text-[var(--guest-accent)]"
                                            aria-label={`Remove sort: ${activeSortLabel}`}
                                            onClick={() => setSortBy("default")}
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </span>
                                ) : null}
                                {dietFilters.includes("VEG") ? (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-green-500/40 bg-green-500/10 py-1 pl-2 pr-1 text-xs font-medium text-green-200">
                                        <IndianVegMark className="h-3.5 w-3.5 shrink-0" />
                                        Veg
                                        <button
                                            type="button"
                                            className="rounded-full p-1 text-green-200/90 hover:bg-green-500/20 hover:text-[var(--guest-text)]"
                                            aria-label="Remove vegetarian filter"
                                            onClick={() => removeDietFilter("VEG")}
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </span>
                                ) : null}
                                {dietFilters.includes("NON_VEG") ? (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/10 py-1 pl-2 pr-1 text-xs font-medium text-red-200">
                                        <IndianNonVegMark className="h-3.5 w-3.5 shrink-0" />
                                        Non-veg
                                        <button
                                            type="button"
                                            className="rounded-full p-1 text-red-200/90 hover:bg-red-500/20 hover:text-[var(--guest-text)]"
                                            aria-label="Remove non-vegetarian filter"
                                            onClick={() => removeDietFilter("NON_VEG")}
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </span>
                                ) : null}
                                {dietFilters.includes("EGGITARIAN") ? (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 py-1 pl-2 pr-1 text-xs font-medium text-amber-200">
                                        <Egg className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                                        Egg
                                        <button
                                            type="button"
                                            className="rounded-full p-1 text-amber-200/90 hover:bg-amber-500/20 hover:text-[var(--guest-text)]"
                                            aria-label="Remove egg filter"
                                            onClick={() => removeDietFilter("EGGITARIAN")}
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    ) : null}
                </div>
            </header>

            {showHeaderMenu ? (
                <button
                    type="button"
                    className="fixed inset-0 z-[45] cursor-default bg-black/50"
                    aria-label="Close menu"
                    onClick={() => setShowHeaderMenu(false)}
                />
            ) : null}

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
                {resolvedRoomId ? (
                    <button
                        type="button"
                        onClick={() => setShowHistory(true)}
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
                {displayCategories.map((cat, catIndex) => (
                    <div
                        key={cat.id}
                        id={`cat-${cat.id}`}
                        data-category-id={cat.id}
                        className={cn(
                            "relative isolate motion-reduce:transition-none",
                            brandingBarHidden && menuFiltersActive && "scroll-mt-[9.75rem] sm:scroll-mt-[10.5rem]",
                            brandingBarHidden && !menuFiltersActive && "scroll-mt-[6.75rem] sm:scroll-mt-[7.25rem]",
                            !brandingBarHidden && menuFiltersActive && "scroll-mt-[13.25rem] sm:scroll-mt-[14rem]",
                            !brandingBarHidden && !menuFiltersActive && "scroll-mt-[10.25rem] sm:scroll-mt-[11rem]",
                        )}
                    >
                        {/*
                          Sticky category title must stay above list items in paint order (items use transform animations).
                          Guest header stays z-50; category bar z-[41] so it sits above ul (z-0) but below modals.
                        */}
                        <div
                            className="sticky z-[41] -mx-4 mb-4 border-b border-[var(--guest-line)] bg-[var(--guest-bg)] px-4 py-2.5 shadow-[0_1px_0_rgba(0,0,0,0.4)] backdrop-blur-md supports-[backdrop-filter]:bg-[var(--guest-bg)]"
                            style={{ top: "var(--guest-menu-sticky-top, 7rem)" }}
                        >
                            <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-[var(--guest-text)]">
                                <CategoryIconDisplay icon={cat.icon} size="md" className="text-[var(--guest-accent)]" />
                                {cat.name}
                            </h2>
                        </div>
                        <ul className="relative z-0 divide-y divide-dashed divide-[var(--guest-line)]">
                            {(cat.items ?? []).map((item, itemIndex) => {
                                const qty = getCartQuantity(item.id);
                                const itemIsAvailable = item.available !== false;
                                const desc = item.description?.trim() ?? "";
                                const descLong = desc.length > 72;
                                const descOpen = expandedDescId === item.id;
                                const imageSrc = item.imageUrl?.trim() ?? "";
                                const hasImage = imageSrc.length > 0;
                                const isPriorityImage =
                                    hasImage && !searchNormalized && catIndex === 0 && itemIndex < 4;

                                let actionBlock: ReactNode = null;
                                if (qty === 0) {
                                    actionBlock = (
                                        <button
                                            type="button"
                                            onClick={() => addToCart(item)}
                                            disabled={!itemIsAvailable}
                                            className={cn(
                                                "flex h-9 w-[100px] sm:w-28 items-center justify-center rounded-xl border-2 border-[var(--guest-accent-70)] bg-[var(--guest-surface)] text-center text-xs font-extrabold uppercase tracking-wider text-[var(--guest-accent)] shadow-md shadow-black/20 transition-all hover:bg-[var(--guest-accent-12)] hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40",
                                            )}
                                        >
                                            {itemIsAvailable ? (
                                                <span className="flex items-center gap-1">
                                                    ADD <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                                                </span>
                                            ) : (
                                                "Sold out"
                                            )}
                                        </button>
                                    );
                                } else {
                                    actionBlock = (
                                        <div className="flex h-9 w-[100px] sm:w-28 items-center justify-between rounded-xl border border-[var(--guest-accent-40)] bg-[var(--guest-surface)] px-1 shadow-md shadow-black/20">
                                            <button
                                                type="button"
                                                onClick={() => removeFromCart(item.id)}
                                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--guest-surface-2)] text-[var(--guest-text)] hover:opacity-90 active:scale-90 transition"
                                                aria-label="Decrease quantity"
                                            >
                                                <Minus className="h-3.5 w-3.5 stroke-[2.5]" />
                                            </button>
                                            <span className="min-w-[1.25rem] text-center text-sm font-bold tabular-nums text-[var(--guest-text)]">{qty}</span>
                                            <button
                                                type="button"
                                                onClick={() => addToCart(item)}
                                                disabled={!isOpen}
                                                className={cn(
                                                    "flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--guest-cta)] text-[var(--guest-on-cta)] hover:bg-[var(--guest-cta-hover)] active:scale-90 transition",
                                                    !isOpen && "opacity-40",
                                                )}
                                                aria-label="Increase quantity"
                                            >
                                                <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                                            </button>
                                        </div>
                                    );
                                }

                                return (
                                    <li
                                        key={item.id}
                                        className="relative z-0 flex items-center justify-between gap-3.5 py-4 first:pt-0 animate-fade-in-up"
                                        style={{ animationDelay: `${itemIndex * 40}ms` }}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex gap-2">
                                                <div className="mt-0.5 shrink-0">
                                                    {item.dietaryPreference === "VEG" ? (
                                                        <IndianVegMark />
                                                    ) : item.dietaryPreference === "NON_VEG" ? (
                                                        <IndianNonVegMark />
                                                    ) : item.dietaryPreference === "EGGITARIAN" ? (
                                                        <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded border border-amber-500/60" title="Contains egg">
                                                            <Egg className="h-3 w-3 text-amber-400" />
                                                        </span>
                                                    ) : (
                                                        <span className="inline-block h-[18px] w-[18px]" aria-hidden />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-[15px] font-bold leading-snug text-[var(--guest-text)]" title={item.name}>
                                                        {item.name}
                                                    </h3>
                                                    <p className="mt-1 text-sm font-semibold text-[var(--guest-accent)]">{formatPrice(item.price)}</p>
                                                    <GuestMenuItemInsights hotel={hotel} item={item} />
                                                    {desc ? (
                                                        <div className="mt-1.5">
                                                            <p
                                                                className={cn(
                                                                    "text-[13px] leading-relaxed text-[var(--guest-muted)]",
                                                                    !descOpen && descLong && "line-clamp-2",
                                                                )}
                                                            >
                                                                {desc}
                                                            </p>
                                                            {descLong ? (
                                                                <button
                                                                    type="button"
                                                                    className="mt-0.5 text-xs font-medium text-[var(--guest-accent-90)] hover:opacity-80"
                                                                    onClick={() => setExpandedDescId((id) => (id === item.id ? null : item.id))}
                                                                >
                                                                    {descOpen ? "less" : "…more"}
                                                                </button>
                                                            ) : null}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                        {hasImage ? (
                                            <div className="relative flex w-[114px] sm:w-[124px] shrink-0 flex-col items-center pb-3 self-start">
                                                <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[var(--guest-surface)] ring-1 ring-[var(--guest-line)] shadow-sm">
                                                    {/* Menu images are arbitrary hotel URLs; <img> avoids next/image domain config. */}
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={imageSrc}
                                                        alt=""
                                                        width={240}
                                                        height={240}
                                                        loading={isPriorityImage ? "eager" : "lazy"}
                                                        decoding="async"
                                                        fetchPriority={isPriorityImage ? "high" : "auto"}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-10">
                                                    {actionBlock}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex w-[114px] sm:w-[124px] shrink-0 items-center justify-center self-center">
                                                {actionBlock}
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}

            </main>

            {(cartCount > 0 || showCart || showHistory || showRoomModal) && (
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

            {showCategoryNav && chipCategories.length > 0 ? (
                <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="guest-cat-nav-title">
                    <button type="button" className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-label="Close" onClick={() => setShowCategoryNav(false)} />
                    <div className="relative z-10 w-full max-w-md rounded-t-2xl border border-[var(--guest-line)] bg-[var(--guest-surface)] shadow-2xl sm:rounded-2xl">
                        <div className="flex items-center justify-between border-b border-[var(--guest-line)] px-5 py-4">
                            <h2 id="guest-cat-nav-title" className="text-base font-bold text-[var(--guest-text)]">
                                Jump to section
                            </h2>
                            <button
                                type="button"
                                onClick={() => setShowCategoryNav(false)}
                                className="rounded-full p-2 text-[var(--guest-muted)] hover:bg-[var(--guest-surface-2)] hover:text-[var(--guest-text)]"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <ul className="max-h-[min(70vh,420px)] overflow-y-auto px-3 py-2">
                            {chipCategories.map((cat) => (
                                <li key={cat.id}>
                                    <button
                                        type="button"
                                        className={cn(
                                            "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors",
                                            activeCategory === cat.id ? "bg-[var(--guest-accent-15)] text-[var(--guest-accent-70)]" : "text-[var(--guest-muted)] hover:bg-[var(--guest-shimmer)]/80",
                                        )}
                                        onClick={() => {
                                            scrollToCategory(cat.id);
                                            setShowCategoryNav(false);
                                        }}
                                    >
                                        <CategoryIconDisplay icon={cat.icon} size="sm" className={activeCategory === cat.id ? "text-[var(--guest-accent)]" : "text-[var(--guest-muted)]"} />
                                        {cat.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : null}

            {!showCart && !showHistory && !showRoomModal && chipCategories.length > 0 ? (
                <button
                    type="button"
                    onClick={() => setShowCategoryNav(true)}
                    className={cn(
                        "fixed z-40 flex items-center gap-2 rounded-full border border-[var(--guest-line)] bg-[color-mix(in_srgb,var(--guest-surface-2)_92%,var(--guest-bg))] px-4 py-2.5 text-sm font-semibold text-[var(--guest-text)] shadow-lg shadow-black/40 backdrop-blur-md hover:opacity-90 active:scale-[0.98] transition-transform",
                        cartCount > 0 ? "bottom-[7.25rem] right-4" : "bottom-6 right-4",
                    )}
                >
                    <Utensils className="h-4 w-4 text-[var(--guest-accent)]" />
                    Menu
                </button>
            ) : null}

            {/* In-Room Stay PIN Verification Modal */}
            <StayPinModal
                isOpen={showPinModal}
                onClose={() => setShowPinModal(false)}
                roomId={resolvedRoomId}
                roomNumber={roomDisplayName || "Your Room"}
                onSuccess={(newToken) => {
                    setShowPinModal(false);
                    if (cart.length > 0 && showCart) {
                        void placeOrder(newToken);
                    }
                }}
            />
        </div>
    );
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
