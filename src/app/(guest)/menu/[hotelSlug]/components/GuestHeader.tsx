"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Search, MapPin, X, ShoppingBag, Menu, SlidersHorizontal, ShieldCheck, Headset, Receipt } from "lucide-react";
import { IndianVegMark, IndianNonVegMark } from "../GuestMenuDietIcons";
import { Egg } from "lucide-react";
import { useGuestMenuContext } from "./GuestMenuContext";
import { getStayToken } from "@/lib/staySession";
import { useState, useEffect } from "react";
import { GuestMenuSort, GuestDietFilterKey } from "@/lib/guestMenuSearch";

interface GuestHeaderProps {
    guestHeaderRef: React.RefObject<HTMLElement>;
    brandingBarHidden: boolean;
    guestLogoFailed: boolean;
    setGuestLogoFailed: React.Dispatch<React.SetStateAction<boolean>>;
    menuFiltersActive: boolean;
    clearAllMenuFilters: () => void;
    activeSortLabel: string;
    removeDietFilter: (key: GuestDietFilterKey) => void;
    toggleDietFilter: (key: GuestDietFilterKey) => void;
    stayPin?: string | null;
}

const SORT_MENU_OPTIONS: { value: GuestMenuSort; label: string }[] = [
    { value: "default", label: "Menu order" },
    { value: "name-asc", label: "Name (A–Z)" },
    { value: "name-desc", label: "Name (Z–A)" },
    { value: "price-asc", label: "Price (low to high)" },
    { value: "price-desc", label: "Price (high to low)" },
];

export function GuestHeader({
    guestHeaderRef,
    brandingBarHidden,
    guestLogoFailed,
    setGuestLogoFailed,
    menuFiltersActive,
    clearAllMenuFilters,
    activeSortLabel,
    removeDietFilter,
    toggleDietFilter,
    stayPin,
}: GuestHeaderProps) {
    const ctx = useGuestMenuContext();
    const [showHeaderMenu, setShowHeaderMenu] = useState(false);

    useEffect(() => {
        if (!showHeaderMenu) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setShowHeaderMenu(false);
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [showHeaderMenu]);

    return (
        <>
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
                    <div
                        className={cn(
                            "overflow-hidden transition-[max-height,opacity] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none",
                            brandingBarHidden ? "pointer-events-none max-h-0 opacity-0" : "max-h-[8rem] opacity-100",
                        )}
                        aria-hidden={brandingBarHidden}
                    >
                        <div className="flex items-center justify-between gap-2.5 pb-2.5">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                {ctx.hotel?.logoUrl?.trim() && !guestLogoFailed ? (
                                    <Image
                                        src={ctx.hotel.logoUrl.trim()}
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
                                        {ctx.hotel?.name?.charAt(0) || "H"}
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <h1 className="truncate text-sm font-bold leading-tight text-[var(--guest-text)]">{ctx.hotel?.name}</h1>
                                    <p className="flex items-center gap-1 text-[11px] text-[var(--guest-muted)]">
                                        {ctx.roomDisplayName ? (
                                            <>
                                                <MapPin className="h-3 w-3 shrink-0 text-[var(--guest-accent)]" />
                                                <span>Room {ctx.roomDisplayName}</span>
                                            </>
                                        ) : (
                                            <span className="italic text-[var(--guest-subtle)]">Digital menu</span>
                                        )}
                                    </p>
                                    {ctx.guestCallNumber ? (
                                        <p className="mt-1 text-[11px] leading-snug text-[var(--guest-muted)]">
                                            <span className="font-medium text-[var(--guest-text)]">Room service</span>
                                            <span className="mx-1 text-[var(--guest-subtle)]">·</span>
                                            <span className="break-all font-medium tabular-nums text-[var(--guest-text)]">
                                                {ctx.guestCallNumber}
                                            </span>
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                            {stayPin && (ctx.digitalOrderingEnabled || ctx.serviceRequestsEnabled) ? (
                                <button
                                    type="button"
                                    onClick={() => ctx.setShowPinModal(true)}
                                    className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shadow-sm transition hover:bg-emerald-500/20 active:scale-95"
                                    title={`Room ${ctx.roomDisplayName || ""} Stay PIN: ${stayPin} (Click to re-verify)`}
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
                                value={ctx.searchQuery}
                                onChange={(e) => ctx.setSearchQuery(e.target.value)}
                                className="w-full rounded-full border border-[var(--guest-line)] bg-[var(--guest-surface)] py-2.5 pl-10 pr-10 text-sm text-[var(--guest-text)] placeholder:text-[var(--guest-muted)] focus:border-[var(--guest-accent-40)] focus:outline-none focus:ring-1 focus:ring-[var(--guest-accent-30)]"
                            />
                            {ctx.searchQuery ? (
                                <button
                                    type="button"
                                    aria-label="Clear search"
                                    onClick={() => ctx.setSearchQuery("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--guest-muted)] hover:bg-[var(--guest-surface-2)] hover:text-[var(--guest-text-70)]"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            ) : null}
                        </div>
                        <div className="relative flex shrink-0 items-center gap-1.5">
                            {ctx.digitalOrderingEnabled && ctx.cartCount > 0 ? (
                                <button
                                    type="button"
                                    onClick={() => ctx.setShowCart(true)}
                                    className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[var(--guest-surface)] text-[var(--guest-accent)] ring-1 ring-[var(--guest-line)] hover:bg-[var(--guest-surface-2)]"
                                    aria-label={`View cart, ${ctx.cartCount} items`}
                                >
                                    <ShoppingBag className="h-5 w-5" strokeWidth={2} />
                                    <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--guest-cta)] px-1 text-[10px] font-bold text-[var(--guest-on-cta)] tabular-nums">
                                        {ctx.cartCount > 99 ? "99+" : ctx.cartCount}
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
                                    {stayPin && (ctx.digitalOrderingEnabled || ctx.serviceRequestsEnabled) ? (
                                        <div className="mx-3 mb-2 flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs">
                                            <span className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-300">
                                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                                Room {ctx.roomDisplayName || ""} PIN
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
                                                aria-checked={ctx.sortBy === opt.value}
                                                className={cn(
                                                    "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors",
                                                    ctx.sortBy === opt.value ? "bg-[var(--guest-accent-20)] text-[var(--guest-accent-90)]" : "text-[var(--guest-muted)] hover:bg-[var(--guest-surface-2)]",
                                                )}
                                                onClick={() => ctx.setSortBy(opt.value)}
                                            >
                                                <span
                                                    className={cn(
                                                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                                                        ctx.sortBy === opt.value ? "border-[var(--guest-accent-40)] bg-[var(--guest-accent-30)]" : "border-[var(--guest-border)]",
                                                    )}
                                                    aria-hidden
                                                >
                                                    {ctx.sortBy === opt.value ? <span className="h-2 w-2 rounded-full bg-[var(--guest-accent)]" /> : null}
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
                                            aria-checked={ctx.dietFilters.includes("VEG")}
                                            className={cn(
                                                "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors",
                                                ctx.dietFilters.includes("VEG")
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
                                            aria-checked={ctx.dietFilters.includes("NON_VEG")}
                                            className={cn(
                                                "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors",
                                                ctx.dietFilters.includes("NON_VEG")
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
                                            aria-checked={ctx.dietFilters.includes("EGGITARIAN")}
                                            className={cn(
                                                "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors",
                                                ctx.dietFilters.includes("EGGITARIAN")
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
                                    {ctx.serviceRequestsEnabled && (
                                        <div className="px-2 pt-1">
                                            <Link
                                                href={ctx.guestServicesHref}
                                                role="menuitem"
                                                className="flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-left text-sm text-[var(--guest-text-70)] hover:bg-[var(--guest-surface-2)]"
                                                onClick={() => setShowHeaderMenu(false)}
                                            >
                                                <Headset className="h-4 w-4 shrink-0 text-[var(--guest-accent)]" aria-hidden />
                                                Guest services
                                            </Link>
                                        </div>
                                    )}
                                    {ctx.resolvedRoomId && ctx.digitalOrderingEnabled ? (
                                        <>
                                            <div className="mx-2 border-t border-[var(--guest-line)]" />
                                            <div className="px-2 pt-1">
                                                <button
                                                    type="button"
                                                    role="menuitem"
                                                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-left text-sm text-[var(--guest-text-70)] hover:bg-[var(--guest-surface-2)]"
                                                    onClick={() => {
                                                        setShowHeaderMenu(false);
                                                        const existingToken = getStayToken(ctx.resolvedRoomId);
                                                        if (!existingToken) {
                                                            ctx.setPinModalPurpose("BILL");
                                                            ctx.setShowPinModal(true);
                                                            return;
                                                        }
                                                        ctx.setShowHistory(true);
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
                                {ctx.sortBy !== "default" ? (
                                    <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-[var(--guest-accent-35)] bg-[var(--guest-accent-12)] py-1 pl-2.5 pr-1 text-xs font-medium text-[var(--guest-accent-90)]">
                                        <SlidersHorizontal className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
                                        <span className="min-w-0 truncate">{activeSortLabel}</span>
                                        <button
                                            type="button"
                                            className="rounded-full p-1 text-[var(--guest-accent-70)] hover:bg-[var(--guest-accent-25)] hover:text-[var(--guest-accent)]"
                                            aria-label={`Remove sort: ${activeSortLabel}`}
                                            onClick={() => ctx.setSortBy("default")}
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </span>
                                ) : null}
                                {ctx.dietFilters.includes("VEG") ? (
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
                                {ctx.dietFilters.includes("NON_VEG") ? (
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
                                {ctx.dietFilters.includes("EGGITARIAN") ? (
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
        </>
    );
}
