"use client";

import { useEffect, useState, useRef, useCallback, useMemo, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { MenuItem, CartItem, Order } from "@/lib/types";
import type { PublicMenuFullData } from "@/lib/types";
import { api } from "@/lib/api";
import { usePublicMenuFull } from "@/hooks/useSwrApi";
import { useActivityStreamGuest } from "@/hooks/useActivityStream";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Search, MapPin, Plus, Minus, Utensils, X, CheckCircle2, Receipt, Clock, SlidersHorizontal, ChevronLeft, Egg } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryIconDisplay } from "@/lib/categoryIcons";
import { ENABLE_GUEST_ORDERING } from "@/lib/guestMenuConfig";
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

const SORT_MENU_OPTIONS: { value: GuestMenuSort; label: string }[] = [
    { value: "default", label: "Menu order" },
    { value: "name-asc", label: "Name (A–Z)" },
    { value: "name-desc", label: "Name (Z–A)" },
    { value: "price-asc", label: "Price (low to high)" },
    { value: "price-desc", label: "Price (high to low)" },
];

// Lazy-load framer-motion overlays (cart, drawers, modals) - only when user interacts
const AnimatedOverlays = dynamic(
    () => import("./GuestMenuAnimated").then((m) => m.AnimatedOverlays),
    { ssr: false }
);

function formatPrice(price: number) {
    return `₹${price.toLocaleString()}`;
}

interface Props {
    hotelSlug: string;
    initialData?: PublicMenuFullData | null; // null when fetch failed
}

export default function GuestMenuClient({ hotelSlug, initialData }: Props) {
    const router = useRouter();
    const menuRes = usePublicMenuFull(hotelSlug, { fallbackData: initialData || undefined });

    const hotel = menuRes.data?.hotel ?? null;
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
    const [pastOrders, setPastOrders] = useState<Order[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [guestLogoFailed, setGuestLogoFailed] = useState(false);
    const [showCategoryNav, setShowCategoryNav] = useState(false);
    const [expandedDescId, setExpandedDescId] = useState<string | null>(null);
    const [showHeaderMenu, setShowHeaderMenu] = useState(false);

    /** True while programmatic scroll-to-section is running (ignore scroll-spy updates). */
    const scrollSpySuspended = useRef(false);
    /** When true, next activeCategory effect must not scroll the chip strip (change came from scroll-spy). */
    const activeCategoryFromScrollSpy = useRef(false);
    const categoryChipStripRef = useRef<HTMLDivElement>(null);

    const searchParams = useSearchParams();
    const roomId = searchParams.get("room") || selectedRoomId;
    const currentRoom = availableRooms.find((r) => r.id === roomId);
    const roomDisplayName = currentRoom?.number || "";

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

    const didYouMeanItem = useMemo(() => {
        if (searchNormalized.length < 3) return null;
        if (flattenMenuItems(filteredCategories).length > 0) return null;
        const pool = flattenMenuItems(dietFilteredCategories);
        return findDidYouMeanItem(searchQuery, pool);
    }, [searchQuery, searchNormalized, filteredCategories, dietFilteredCategories]);

    /** Chips match visible sections: all categories, or only those with search/diet hits. */
    const chipCategories = filteredCategories;

    useEffect(() => {
        if (filteredCategories.length === 0) return;
        if (!filteredCategories.some((c) => c.id === activeCategory)) {
            setActiveCategory(filteredCategories[0].id);
        }
    }, [filteredCategories, activeCategory]);

    function toggleDietFilter(key: GuestDietFilterKey) {
        setDietFilters((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    }

    const resultCount = useMemo(() => flattenMenuItems(filteredCategories).length, [filteredCategories]);
    const hasActiveFilters = searchNormalized.length > 0 || dietFilters.length > 0 || sortBy !== "default";
    const showNoResultsPanel = !loading && !error && categories.length > 0 && resultCount === 0;

    const chipCategoryIdsKey = useMemo(() => chipCategories.map((c) => c.id).join("|"), [chipCategories]);

    const chipCategoriesRef = useRef(chipCategories);
    chipCategoriesRef.current = chipCategories;

    /** Sticky header (branding + search + category chips); spy line ≈ px from top. */
    const SCROLL_SPY_HEADER_LINE_PX = 180;

    /** Scroll-spy: active chip = last category section whose heading is at/above the sticky header line. */
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
                const line = SCROLL_SPY_HEADER_LINE_PX;
                let currentId = cats[0].id;
                for (const cat of cats) {
                    const el = document.getElementById(`cat-${cat.id}`);
                    if (!el) continue;
                    const top = el.getBoundingClientRect().top;
                    if (top <= line) currentId = cat.id;
                }
                setActiveCategory((prev) => {
                    if (prev === currentId) return prev;
                    activeCategoryFromScrollSpy.current = true;
                    return currentId;
                });
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
    }, [chipCategoryIdsKey]);

    /** Keep the active chip in view inside the horizontal strip (not when scroll-spy updated — avoids scroll fighting / page jitter). */
    useEffect(() => {
        if (!activeCategory || !categoryChipStripRef.current) return;
        if (activeCategoryFromScrollSpy.current) {
            activeCategoryFromScrollSpy.current = false;
            return;
        }
        const strip = categoryChipStripRef.current;
        const btn = strip.querySelector<HTMLElement>(`[data-chip-id="${activeCategory}"]`);
        if (!btn) return;
        const reduceMotion =
            typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        const behavior: ScrollBehavior = reduceMotion ? "auto" : "smooth";
        const btnCenter = btn.offsetLeft + btn.offsetWidth / 2;
        const targetLeft = Math.max(0, btnCenter - strip.clientWidth / 2);
        strip.scrollTo({ left: targetLeft, behavior });
    }, [activeCategory]);

    useEffect(() => {
        setGuestLogoFailed(false);
    }, [hotel?.logoUrl, hotel?.id]);

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
        if (!ENABLE_GUEST_ORDERING || !roomId) return;
        try {
            const orders = await api.getGuestRoomOrders(roomId);
            setPastOrders(orders);
            const tracking = orderRef.current;
            if (tracking?.id) {
                const match = orders.find((o) => o.id === tracking.id);
                if (match && match.status !== tracking.status) setOrder(match);
            }
        } catch (err) {
            console.error("Failed to load past orders", err);
        }
    }, [roomId]);

    useEffect(() => {
        if (ENABLE_GUEST_ORDERING && roomId) loadPastOrders();
    }, [roomId, loadPastOrders]);

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
        roomId: roomId || "",
        enabled: ENABLE_GUEST_ORDERING && !!roomId,
        onOrderNew: loadPastOrders,
        onOrderUpdated: handleOrderUpdated,
    });

    function addToCart(item: MenuItem) {
        if (!ENABLE_GUEST_ORDERING || !isOpen) return;
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
        if (!ENABLE_GUEST_ORDERING || !isOpen) return;
        if (!roomId) {
            setShowCart(false);
            setShowRoomModal(true);
            return;
        }
        placeOrder();
    }

    async function placeOrder() {
        if (!ENABLE_GUEST_ORDERING || !isOpen || !roomId) return;
        setPlacing(true);
        try {
            const result = await api.placeOrder({
                roomId,
                items: cart.map((ci) => ({ itemId: ci.item.id, quantity: ci.quantity })),
                notes: notes || undefined,
                guestName: guestName || undefined,
            });
            setOrder(result);
            setCart([]);
            setShowCart(false);
            setShowRoomModal(false);
            loadPastOrders();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Failed to place order");
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
            <div className="min-h-screen bg-zinc-950 page-transition text-zinc-100">
                <div className="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/90 backdrop-blur-xl">
                    <div className="max-w-md mx-auto px-4 py-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="h-10 w-10 shrink-0 rounded-full animate-shimmer bg-zinc-800/80" />
                            <div className="h-10 flex-1 animate-shimmer rounded-full bg-zinc-800/80" />
                            <div className="h-10 w-10 shrink-0 rounded-full animate-shimmer bg-zinc-800/80" />
                        </div>
                        <div className="flex gap-2 overflow-hidden">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-9 shrink-0 animate-shimmer rounded-full bg-zinc-800/80" style={{ width: `${72 + i * 8}px` }} />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="max-w-md mx-auto px-4 py-6 space-y-6">
                    {Array.from({ length: 3 }).map((_, s) => (
                        <div key={s} className="space-y-3">
                            <div className="h-5 w-32 animate-shimmer rounded bg-zinc-800/80" />
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div
                                    key={`${s}-${i}`}
                                    className="flex gap-3 border-b border-dashed border-white/10 pb-4"
                                    style={{ animationDelay: `${i * 0.1}s` }}
                                >
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-[70%] animate-shimmer rounded bg-zinc-800/80" />
                                        <div className="h-3 w-16 animate-shimmer rounded bg-zinc-800/80" />
                                        <div className="h-3 w-full animate-shimmer rounded bg-zinc-800/80" />
                                    </div>
                                    <div className="w-[108px] shrink-0 space-y-2">
                                        <div className="aspect-[4/3] w-full animate-shimmer rounded-lg bg-zinc-800/80" />
                                        <div className="h-9 w-full animate-shimmer rounded-md bg-zinc-800/80" />
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
            <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 text-center text-zinc-100">
                <div>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/15 text-rose-400">
                        <UtensilsCrossed className="h-8 w-8" />
                    </div>
                    <h2 className="mb-2 text-xl font-bold text-white">Menu unavailable</h2>
                    <p className="text-sm text-zinc-500">{error}</p>
                </div>
            </div>
        );
    }

    if (ENABLE_GUEST_ORDERING && order) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-100">
                <div className="animate-scale-in w-full max-w-sm text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 ring-4 ring-emerald-500/10">
                        <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h1 className="mb-2 text-2xl font-bold text-white">Order confirmed</h1>
                    <p className="mb-8 text-zinc-500">
                        Order <span className="font-mono font-medium text-white">#{order.orderNumber}</span> has been sent to the kitchen.
                    </p>
                    <div className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 text-left">
                        <div className="flex items-center justify-between border-b border-white/10 bg-zinc-800/50 px-4 py-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Receipt</span>
                            <Badge variant={order.status === "DELIVERED" ? "success" : order.status === "CANCELLED" ? "danger" : "warning"}>{order.status}</Badge>
                        </div>
                        <div className="space-y-3 p-4">
                            {order.items.map((oi) => (
                                <div key={oi.id} className="flex justify-between text-sm">
                                    <span className="text-zinc-500">
                                        <span className="mr-2 font-semibold text-white">{oi.quantity}x</span>
                                        {oi.itemName}
                                    </span>
                                    <span className="font-medium text-white">{formatPrice(oi.price * oi.quantity)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center justify-between border-t border-white/10 bg-zinc-800/50 px-4 py-4">
                            <span className="font-semibold text-white">Total</span>
                            <span className="text-lg font-bold text-rose-400">{formatPrice(order.totalAmount)}</span>
                        </div>
                    </div>
                    <Button className="w-full border-white/10 bg-zinc-800 text-white hover:bg-zinc-700" variant="secondary" onClick={() => setOrder(null)}>
                        Back to menu
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 pb-28 font-sans text-zinc-100 page-transition">
            <header className="sticky top-0 z-50 w-full min-w-0 max-w-full border-b border-white/[0.08] bg-zinc-950/95 backdrop-blur-xl supports-[backdrop-filter]:bg-zinc-950/85">
                <div className="mx-auto w-full min-w-0 max-w-md px-4 pb-2 pt-3">
                    <div className="flex items-center gap-2.5 pb-2.5">
                        {hotel?.logoUrl?.trim() && !guestLogoFailed ? (
                            <Image
                                src={hotel.logoUrl.trim()}
                                alt=""
                                width={36}
                                height={36}
                                sizes="36px"
                                priority
                                className="h-9 w-9 shrink-0 rounded-lg bg-zinc-900 object-cover ring-1 ring-white/10"
                                onError={() => setGuestLogoFailed(true)}
                            />
                        ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-rose-600 to-rose-800 text-sm font-bold text-white ring-1 ring-white/10">
                                {hotel?.name?.charAt(0) || "H"}
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <h1 className="truncate text-sm font-bold leading-tight text-white">{hotel?.name}</h1>
                            <p className="flex items-center gap-1 text-[11px] text-zinc-500">
                                {roomDisplayName ? (
                                    <>
                                        <MapPin className="h-3 w-3 text-rose-400/90" />
                                        <span>Room {roomDisplayName}</span>
                                    </>
                                ) : (
                                    <span className="italic text-zinc-600">Digital menu</span>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-zinc-300 ring-1 ring-white/10 hover:bg-zinc-800 hover:text-white active:scale-95 transition-transform"
                            aria-label="Go back"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <div className="relative flex-1 min-w-0">
                            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                            <input
                                type="search"
                                enterKeyHint="search"
                                placeholder='Search "biryani", "coffee"...'
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-full border border-white/10 bg-zinc-900 py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-zinc-500 focus:border-rose-500/40 focus:outline-none focus:ring-1 focus:ring-rose-500/30"
                            />
                            {searchQuery ? (
                                <button
                                    type="button"
                                    aria-label="Clear search"
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            ) : null}
                        </div>
                        <div className="relative shrink-0">
                            <button
                                type="button"
                                onClick={() => setShowHeaderMenu((v) => !v)}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-zinc-300 ring-1 ring-white/10 hover:bg-zinc-800 hover:text-white"
                                aria-expanded={showHeaderMenu}
                                aria-haspopup="menu"
                                aria-label="Menu"
                            >
                                <span className="flex flex-col gap-1">
                                    <span className="block h-0.5 w-4 rounded-full bg-current" />
                                    <span className="block h-0.5 w-4 rounded-full bg-current" />
                                    <span className="block h-0.5 w-4 rounded-full bg-current" />
                                </span>
                            </button>
                            {showHeaderMenu ? (
                                <>
                                    <button type="button" className="fixed inset-0 z-40 cursor-default bg-black/40" aria-label="Close menu" onClick={() => setShowHeaderMenu(false)} />
                                    <div
                                        role="menu"
                                        className="absolute right-0 top-12 z-50 w-[min(calc(100vw-1.5rem),17.5rem)] max-h-[min(72vh,28rem)] overflow-y-auto rounded-xl border border-white/10 bg-zinc-900 py-2 shadow-xl shadow-black/50"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="px-3 pb-1">
                                            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
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
                                                        sortBy === opt.value ? "bg-rose-500/20 text-rose-100" : "text-zinc-300 hover:bg-zinc-800",
                                                    )}
                                                    onClick={() => setSortBy(opt.value)}
                                                >
                                                    <span
                                                        className={cn(
                                                            "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                                                            sortBy === opt.value ? "border-rose-400 bg-rose-500/30" : "border-zinc-600",
                                                        )}
                                                        aria-hidden
                                                    >
                                                        {sortBy === opt.value ? <span className="h-2 w-2 rounded-full bg-rose-400" /> : null}
                                                    </span>
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="mx-2 border-t border-white/10" />
                                        <div className="px-3 pt-2 pb-1">
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Diet filters</p>
                                            <p className="mt-0.5 text-[11px] text-zinc-600">Tap to show only matching dishes</p>
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
                                                        : "border-white/10 bg-zinc-800/50 text-zinc-400 hover:border-white/20",
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
                                                        ? "border-orange-500/40 bg-orange-500/10 text-orange-200"
                                                        : "border-white/10 bg-zinc-800/50 text-zinc-400 hover:border-white/20",
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
                                                        : "border-white/10 bg-zinc-800/50 text-zinc-400 hover:border-white/20",
                                                )}
                                                onClick={() => toggleDietFilter("EGGITARIAN")}
                                            >
                                                <Egg className="h-4 w-4 shrink-0 text-amber-400" />
                                                Egg
                                            </button>
                                        </div>
                                        {ENABLE_GUEST_ORDERING && pastOrders.length > 0 ? (
                                            <>
                                                <div className="mx-2 border-t border-white/10" />
                                                <div className="px-2 pt-1">
                                                    <button
                                                        type="button"
                                                        role="menuitem"
                                                        className="flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-left text-sm text-zinc-200 hover:bg-zinc-800"
                                                        onClick={() => {
                                                            setShowHeaderMenu(false);
                                                            setShowHistory(true);
                                                        }}
                                                    >
                                                        <Receipt className="h-4 w-4 shrink-0 text-rose-400" />
                                                        Bills &amp; history
                                                    </button>
                                                </div>
                                            </>
                                        ) : null}
                                    </div>
                                </>
                            ) : null}
                        </div>
                    </div>

                    {chipCategories.length > 0 ? (
                        <div
                            ref={categoryChipStripRef}
                            role="tablist"
                            aria-label="Menu categories"
                            className="-mx-4 mt-3 flex w-full min-w-0 gap-2 overflow-x-auto pb-2 pt-0.5 px-4 no-scrollbar mask-fade-right snap-x snap-mandatory scroll-pl-4"
                        >
                            {chipCategories.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={activeCategory === cat.id}
                                    data-chip-id={cat.id}
                                    id={`chip-${cat.id}`}
                                    onClick={() => scrollToCategory(cat.id)}
                                    className={cn(
                                        "snap-start shrink-0 inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all",
                                        activeCategory === cat.id
                                            ? "border-rose-500/50 bg-rose-500/20 text-rose-100 shadow-[0_0_20px_-8px_rgba(244,63,94,0.5)]"
                                            : "border-white/10 bg-zinc-900 text-zinc-400 hover:border-white/20 hover:text-zinc-200",
                                    )}
                                >
                                    <CategoryIconDisplay
                                        icon={cat.icon}
                                        size="sm"
                                        className={activeCategory === cat.id ? "text-rose-300" : "text-zinc-500"}
                                    />
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>
            </header>

            <main className="mx-auto w-full min-w-0 max-w-md space-y-8 overflow-x-hidden px-4 py-5">
                {ENABLE_GUEST_ORDERING && !isOpen && (
                    <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 flex items-center gap-3 animate-fade-in-up">
                        <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-white text-sm">Room service is currently closed</p>
                            <p className="text-xs text-zinc-400">Orders can be placed during operating hours.</p>
                        </div>
                    </div>
                )}
                {hasActiveFilters && resultCount > 0 && (
                    <div className="text-xs text-zinc-500">
                        <span className="font-semibold text-zinc-300">{resultCount}</span>{" "}
                        {resultCount === 1 ? "dish" : "dishes"}
                        {searchNormalized ? (
                            <>
                                {" "}
                                for &ldquo;<span className="text-rose-300/90">{searchQuery.trim()}</span>&rdquo;
                            </>
                        ) : null}
                        {dietFilters.length > 0 ? <span> · diet filter on</span> : null}
                        {sortBy !== "default" ? <span> · sorted</span> : null}
                    </div>
                )}
                {filteredCategories.map((cat) => (
                    <div
                        key={cat.id}
                        id={`cat-${cat.id}`}
                        data-category-id={cat.id}
                        className="scroll-mt-[13.25rem] sm:scroll-mt-[14rem] motion-reduce:transition-none"
                    >
                        <h2 className="mb-4 flex items-center gap-2 text-base font-bold tracking-tight text-white">
                            <CategoryIconDisplay icon={cat.icon} size="md" className="text-rose-400" />
                            {cat.name}
                        </h2>
                        <ul className="divide-y divide-dashed divide-white/10">
                            {(cat.items ?? []).map((item, itemIndex) => {
                                const qty = ENABLE_GUEST_ORDERING ? getCartQuantity(item.id) : 0;
                                const desc = item.description?.trim() ?? "";
                                const descLong = desc.length > 72;
                                const descOpen = expandedDescId === item.id;
                                const imageSrc = item.imageUrl?.trim() ?? "";
                                const hasImage = imageSrc.length > 0;

                                let actionBlock: ReactNode = null;
                                if (!ENABLE_GUEST_ORDERING) {
                                    if (!item.available) {
                                        actionBlock = (
                                            <span className="text-center text-[10px] font-medium text-zinc-500 sm:text-left">Unavailable</span>
                                        );
                                    }
                                } else if (qty === 0) {
                                    actionBlock = (
                                        <button
                                            type="button"
                                            onClick={() => addToCart(item)}
                                            disabled={!item.available || !isOpen}
                                            className={cn(
                                                "w-full rounded-md border-2 border-rose-500/70 bg-transparent py-2 text-center text-xs font-bold uppercase tracking-wide text-rose-400 transition-colors hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-40 sm:w-[108px]",
                                            )}
                                        >
                                            {!isOpen ? "Closed" : item.available ? "Add +" : "Sold out"}
                                        </button>
                                    );
                                } else {
                                    actionBlock = (
                                        <div className="flex w-full items-center justify-between gap-1 rounded-md border border-rose-500/40 bg-zinc-900/80 px-1 py-1 sm:w-[108px]">
                                            <button
                                                type="button"
                                                onClick={() => removeFromCart(item.id)}
                                                className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-800 text-white hover:bg-zinc-700"
                                            >
                                                <Minus className="h-3.5 w-3.5" />
                                            </button>
                                            <span className="min-w-[1.25rem] text-center text-sm font-bold text-white">{qty}</span>
                                            <button
                                                type="button"
                                                onClick={() => addToCart(item)}
                                                disabled={!isOpen}
                                                className={cn(
                                                    "flex h-8 w-8 items-center justify-center rounded-md bg-rose-600 text-white hover:bg-rose-500",
                                                    !isOpen && "opacity-40",
                                                )}
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    );
                                }

                                return (
                                    <li
                                        key={item.id}
                                        className="flex gap-3 py-4 first:pt-0 animate-fade-in-up"
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
                                                    <h3 className="text-[15px] font-bold leading-snug text-white" title={item.name}>
                                                        {item.name}
                                                    </h3>
                                                    <p className="mt-1 text-sm font-semibold text-white">{formatPrice(item.price)}</p>
                                                    {desc ? (
                                                        <div className="mt-1.5">
                                                            <p
                                                                className={cn(
                                                                    "text-[13px] leading-relaxed text-zinc-500",
                                                                    !descOpen && descLong && "line-clamp-2",
                                                                )}
                                                            >
                                                                {desc}
                                                            </p>
                                                            {descLong ? (
                                                                <button
                                                                    type="button"
                                                                    className="mt-0.5 text-xs font-medium text-rose-400/90 hover:text-rose-300"
                                                                    onClick={() => setExpandedDescId((id) => (id === item.id ? null : item.id))}
                                                                >
                                                                    {descOpen ? "less" : "…more"}
                                                                </button>
                                                            ) : null}
                                                        </div>
                                                    ) : null}
                                                    {!hasImage && actionBlock ? (
                                                        <div className="mt-3 flex justify-end">{actionBlock}</div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                        {hasImage ? (
                                            <div className="flex w-[108px] shrink-0 flex-col items-stretch gap-2">
                                                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-zinc-900 ring-1 ring-white/10">
                                                    {/* Menu images are arbitrary hotel URLs; <img> avoids next/image domain config. */}
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={imageSrc} alt="" className="h-full w-full object-cover" />
                                                </div>
                                                {actionBlock}
                                            </div>
                                        ) : null}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
                {showNoResultsPanel && (
                    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 px-5 py-10 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800">
                            <Search className="h-7 w-7 text-zinc-500" />
                        </div>
                        <h3 className="text-base font-semibold text-white">No dishes match</h3>
                        <p className="mt-2 text-sm text-zinc-500 leading-relaxed">
                            {searchNormalized
                                ? "Try a shorter search or clear filters — we also forgive small typos and extra spaces."
                                : "Nothing in this menu matches the diet filters. Turn one off to see more."}
                        </p>
                        {didYouMeanItem && (
                            <div className="mt-5 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Did you mean</p>
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery(didYouMeanItem.name)}
                                    className="mt-1 text-base font-semibold text-rose-400 hover:underline"
                                >
                                    {didYouMeanItem.name}
                                </button>
                            </div>
                        )}
                        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                            {searchNormalized ? (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="w-full border-white/10 bg-zinc-800 text-white hover:bg-zinc-700 sm:w-auto"
                                    onClick={() => setSearchQuery("")}
                                >
                                    Clear search
                                </Button>
                            ) : null}
                            {dietFilters.length > 0 ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full border-white/15 bg-transparent text-zinc-200 hover:bg-white/5 sm:w-auto"
                                    onClick={() => setDietFilters([])}
                                >
                                    Clear diet filters
                                </Button>
                            ) : null}
                            {searchNormalized && dietFilters.length > 0 ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full border-white/15 bg-transparent text-zinc-200 hover:bg-white/5 sm:w-auto"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setDietFilters([]);
                                    }}
                                >
                                    Reset all
                                </Button>
                            ) : null}
                        </div>
                    </div>
                )}
            </main>

            {ENABLE_GUEST_ORDERING && (cartCount > 0 || showCart || showHistory || showRoomModal) && (
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
                    onPlaceOrder={placeOrder}
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
                    <div className="relative z-10 w-full max-w-md rounded-t-2xl border border-white/10 bg-zinc-900 shadow-2xl sm:rounded-2xl">
                        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                            <h2 id="guest-cat-nav-title" className="text-base font-bold text-white">
                                Jump to section
                            </h2>
                            <button
                                type="button"
                                onClick={() => setShowCategoryNav(false)}
                                className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
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
                                            activeCategory === cat.id ? "bg-rose-500/15 text-rose-200" : "text-zinc-300 hover:bg-zinc-800/80",
                                        )}
                                        onClick={() => {
                                            scrollToCategory(cat.id);
                                            setShowCategoryNav(false);
                                        }}
                                    >
                                        <CategoryIconDisplay icon={cat.icon} size="sm" className={activeCategory === cat.id ? "text-rose-400" : "text-zinc-500"} />
                                        {cat.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : null}

            {(!ENABLE_GUEST_ORDERING || (!showCart && !showHistory && !showRoomModal)) && chipCategories.length > 0 ? (
                <button
                    type="button"
                    onClick={() => setShowCategoryNav(true)}
                    className={cn(
                        "fixed z-40 flex items-center gap-2 rounded-full border border-white/10 bg-zinc-800/95 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/40 backdrop-blur-md hover:bg-zinc-700 active:scale-[0.98] transition-transform",
                        ENABLE_GUEST_ORDERING && cartCount > 0 ? "bottom-[7.25rem] right-4" : "bottom-6 right-4",
                    )}
                >
                    <Utensils className="h-4 w-4 text-rose-400" />
                    Menu
                </button>
            ) : null}
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
