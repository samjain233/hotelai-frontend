"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { PublicMenuFullData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { usePublicMenuFull, useGuestMenuVersion } from "@/hooks/useSwrApi";
import { useMinuteClock } from "@/hooks/useMinuteClock";
import { hotelClockAt, isHotelOpenAt, filterCategoriesBySchedule } from "@/lib/guestMenuSchedule";
import { buildGuestMenuThemeStyle } from "@/lib/guestMenuTheme";
import { useStaySession } from "@/lib/staySession";
import { resolveGuestMenuTemplate, type GuestMenuTemplate } from "@/lib/guestMenuTemplates";
import { Clock, Receipt, ChevronRight, Headset } from "lucide-react";
import { GuestMenuProvider, type GuestMenuDataState, type GuestMenuUiState } from "./components/GuestMenuContext";
import { GuestHeader } from "./components/GuestHeader";
import { GuestMenuList } from "./components/GuestMenuList";
import { GuestMenuSplash } from "./components/GuestMenuSplash";
import { GuestMenuSearchNotices } from "./components/GuestMenuSearchNotices";
import { GuestOrderConfirmation } from "./components/GuestOrderConfirmation";
import { formatPrice } from "./components/GuestMenuItemParts";
import type { GuestMenuSectionsProps } from "./templates/types";
import { useGuestCart } from "./hooks/useGuestCart";
import { useGuestRoom } from "./hooks/useGuestRoom";
import { useGuestOrdering } from "./hooks/useGuestOrdering";
import { useGuestMenuFilters } from "./hooks/useGuestMenuFilters";
import { useBrandingBarCollapse, useCategoryScrollSpy, useStickyHeaderOffset } from "./hooks/useGuestMenuScroll";
import { useGuestDocumentTitle, useTrackMenuView } from "./hooks/useGuestMenuSideEffects";

const NO_ROOMS: NonNullable<PublicMenuFullData["rooms"]> = [];

// Both use framer-motion; loading them on demand keeps it out of the first-paint bundle for every scan.
const AnimatedOverlays = dynamic(() => import("./GuestMenuAnimated").then((m) => m.AnimatedOverlays), { ssr: false });
const StayPinModal = dynamic(() => import("@/components/guest/StayPinModal").then((m) => m.StayPinModal), { ssr: false });

interface Props {
    hotelSlug: string;
    /** Server-fetched payload; the page 404s or errors before rendering this component without it. */
    initialData: PublicMenuFullData;
    /** Template the page was rendered with, and its renderer as a client reference (see templates/serverRegistry.ts). */
    serverTemplate?: GuestMenuTemplate;
    ServerTemplateSections?: ComponentType<GuestMenuSectionsProps>;
    /** Epoch ms when the Server Component rendered; seeds the clock so hydration matches the (possibly old) ISR HTML. */
    renderedAt: number;
}

/**
 * Guest menu page shell. Owns data freshness and composes the feature hooks (cart, room, ordering,
 * filters, scroll), then provides them through three contexts so dish cards only re-render when
 * the data or the cart changes (see components/GuestMenuContext.tsx).
 */
export default function GuestMenuClient({ hotelSlug, initialData, serverTemplate, ServerTemplateSections, renderedAt }: Props) {
    // ── Data ──────────────────────────────────────────────────────────────────────────────────
    const menuRes = usePublicMenuFull(hotelSlug, { fallbackData: initialData });
    const data = menuRes.data ?? initialData;
    const hotel = data.hotel;
    const availableRooms = data.rooms ?? NO_ROOMS;
    const themeStyle = useMemo(() => buildGuestMenuThemeStyle(hotel), [hotel]);

    // Open/closed and category serving windows are decided here, on the device clock, because the
    // payload is cached (ISR + menuUpdatedAt) and must not contain anything time-dependent.
    const nowMinute = useMinuteClock(renderedAt);
    const hotelClock = useMemo(() => hotelClockAt(nowMinute, hotel.timezone), [nowMinute, hotel.timezone]);
    const isOpen = isHotelOpenAt(hotelClock, hotel.openTime, hotel.closeTime);
    const categories = useMemo(() => filterCategoriesBySchedule(data.categories, hotelClock), [data.categories, hotelClock]);

    // Cheap change poll: refetches /full only when the admin has changed something.
    useGuestMenuVersion(hotelSlug, hotel.menuUpdatedAt);
    // A failed background revalidation is logged; the menu on screen stays up.
    useEffect(() => {
        if (menuRes.error) console.error("Guest menu fetch failed", menuRes.error);
    }, [menuRes.error]);

    const digitalOrderingEnabled = hotel.features ? hotel.features.includes("DIGITAL_ORDERING") : true;
    const serviceRequestsEnabled = hotel.features ? hotel.features.includes("SERVICE_REQUESTS") : true;
    const guestCallNumber = hotel.roomServicePhone?.trim() || hotel.phone?.trim() || "";

    // ── Features ──────────────────────────────────────────────────────────────────────────────
    const room = useGuestRoom(hotelSlug, availableRooms);
    const { isVerified: stayVerified } = useStaySession(room.resolvedRoomId);
    const cart = useGuestCart();
    const ordering = useGuestOrdering({
        hotelSlug,
        resolvedRoomId: room.resolvedRoomId,
        isOpen,
        digitalOrderingEnabled,
        serviceRequestsEnabled,
        stayVerified,
        cart: cart.cart,
        clearCart: cart.clearCart,
    });
    const filters = useGuestMenuFilters(categories);

    // ── Chrome ────────────────────────────────────────────────────────────────────────────────
    const [splashDone, setSplashDone] = useState(false);
    const handleSplashDone = useCallback(() => setSplashDone(true), []);
    const [guestLogoFailed, setGuestLogoFailed] = useState(false);
    const headerRef = useRef<HTMLElement | null>(null);
    const brandingBarHidden = useBrandingBarCollapse();
    useStickyHeaderOffset(headerRef);
    const { activeCategory, scrollToCategory } = useCategoryScrollSpy(filters.displayCategories, headerRef);
    useGuestDocumentTitle(hotel.name, hotelSlug, room.roomDisplayName);
    useTrackMenuView(hotel.id);

    // ── Context values (memoised: see GuestMenuContext.tsx) ───────────────────────────────────
    const dataState = useMemo<GuestMenuDataState>(
        () => ({
            hotelSlug,
            hotel,
            categories,
            availableRooms,
            isOpen,
            themeStyle,
            digitalOrderingEnabled,
            serviceRequestsEnabled,
            resolvedRoomId: room.resolvedRoomId,
            roomDisplayName: room.roomDisplayName,
            guestServicesHref: room.guestServicesHref,
            guestCallNumber,
        }),
        [hotelSlug, hotel, categories, availableRooms, isOpen, themeStyle, digitalOrderingEnabled, serviceRequestsEnabled, room.resolvedRoomId, room.roomDisplayName, room.guestServicesHref, guestCallNumber],
    );

    const uiState = useMemo<GuestMenuUiState>(
        () => ({
            searchQuery: filters.searchQuery,
            setSearchQuery: filters.setSearchQuery,
            dietFilters: filters.dietFilters,
            setDietFilters: filters.setDietFilters,
            sortBy: filters.sortBy,
            setSortBy: filters.setSortBy,
            showCart: ordering.showCart,
            setShowCart: ordering.setShowCart,
            showHistory: ordering.showHistory,
            setShowHistory: ordering.setShowHistory,
            showRoomModal: ordering.showRoomModal,
            setShowRoomModal: ordering.setShowRoomModal,
            showPinModal: ordering.showPinModal,
            setShowPinModal: ordering.setShowPinModal,
            pinModalPurpose: ordering.pinModalPurpose,
            setPinModalPurpose: ordering.setPinModalPurpose,
            order: ordering.order,
            setOrder: ordering.setOrder,
            placing: ordering.placing,
            pastOrders: ordering.pastOrders,
            guestName: ordering.guestName,
            setGuestName: ordering.setGuestName,
            notes: ordering.notes,
            setNotes: ordering.setNotes,
            selectedRoomId: room.selectedRoomId,
            setSelectedRoomId: room.setSelectedRoomId,
            loadPastOrders: ordering.loadPastOrders,
            placeOrder: ordering.placeOrder,
            initiateOrder: ordering.initiateOrder,
            confirmRoomFromModal: ordering.confirmRoomFromModal,
            openRoomBill: ordering.openRoomBill,
        }),
        [
            filters.searchQuery, filters.setSearchQuery, filters.dietFilters, filters.setDietFilters, filters.sortBy, filters.setSortBy,
            ordering.showCart, ordering.setShowCart, ordering.showHistory, ordering.setShowHistory, ordering.showRoomModal, ordering.setShowRoomModal,
            ordering.showPinModal, ordering.setShowPinModal, ordering.pinModalPurpose, ordering.setPinModalPurpose, ordering.order, ordering.setOrder,
            ordering.placing, ordering.pastOrders, ordering.guestName, ordering.setGuestName, ordering.notes, ordering.setNotes,
            room.selectedRoomId, room.setSelectedRoomId, ordering.loadPastOrders, ordering.placeOrder, ordering.initiateOrder,
            ordering.confirmRoomFromModal, ordering.openRoomBill,
        ],
    );

    if (ordering.order) {
        return <GuestOrderConfirmation order={ordering.order} themeStyle={themeStyle} onBack={() => ordering.setOrder(null)} />;
    }

    const resultCount = filters.searchResultCount;
    const resultNoun = resultCount === 1 ? "dish" : "dishes";

    return (
        <GuestMenuProvider data={dataState} cart={cart} ui={uiState}>
            {/* overflow-anchor:none — otherwise the browser's scroll anchoring counter-scrolls when the header collapses, which flips the scroll direction and re-expands it. */}
            <div className="min-h-screen bg-[var(--guest-bg)] pb-28 font-sans text-[var(--guest-text)] page-transition [overflow-anchor:none]" style={themeStyle}>
                {!splashDone && <GuestMenuSplash hotelSlug={hotelSlug} hotelName={hotel.name ?? hotelSlug} logoUrl={hotel.logoUrl} onDone={handleSplashDone} />}
                <GuestHeader
                    guestHeaderRef={headerRef as React.RefObject<HTMLElement>}
                    brandingBarHidden={brandingBarHidden}
                    guestLogoFailed={guestLogoFailed}
                    setGuestLogoFailed={setGuestLogoFailed}
                    menuFiltersActive={filters.menuFiltersActive}
                    clearAllMenuFilters={filters.clearAllMenuFilters}
                    activeSortLabel={filters.activeSortLabel}
                    removeDietFilter={filters.removeDietFilter}
                    toggleDietFilter={filters.toggleDietFilter}
                    stayVerified={stayVerified}
                    chipCategories={filters.displayCategories}
                    activeCategory={activeCategory}
                    scrollToCategory={scrollToCategory}
                />

                <main className={cn("mx-auto w-full min-w-0 max-w-md space-y-8 overflow-x-clip px-4 py-5", splashDone ? "guest-stagger-done" : "guest-stagger")}>
                    {!isOpen && (
                        <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 flex items-center gap-3 animate-fade-in-up">
                            <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-[var(--guest-text)] text-sm">Room service is currently closed</p>
                                <p className="text-xs text-[var(--guest-muted)]">Orders can be placed during operating hours.</p>
                            </div>
                        </div>
                    )}
                    {room.resolvedRoomId && digitalOrderingEnabled ? (
                        <button
                            type="button"
                            onClick={ordering.openRoomBill}
                            className="flex w-full items-center gap-3 rounded-xl border border-[var(--guest-line)] bg-[var(--guest-text-12)] px-4 py-3 text-left transition-colors hover:border-[var(--guest-accent-35)] hover:bg-[var(--guest-surface-2)]"
                        >
                            <Receipt className="h-5 w-5 shrink-0 text-[var(--guest-accent)]" aria-hidden />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-[var(--guest-text)]">Room bill</p>
                                <p className="text-xs text-[var(--guest-muted)]">
                                    {ordering.pastOrders.length === 0
                                        ? "No orders yet — tap to view"
                                        : ordering.roomBillGrandTotal > 0
                                            ? `${formatPrice(ordering.roomBillGrandTotal)} total so far`
                                            : "No active charges — tap for history"}
                                </p>
                            </div>
                            <ChevronRight className="h-5 w-5 shrink-0 text-[var(--guest-muted)]" aria-hidden />
                        </button>
                    ) : null}
                    {serviceRequestsEnabled && (
                        <Link
                            href={room.guestServicesHref}
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
                    {filters.hasActiveFilters && resultCount > 0 && (
                        <div className="text-xs text-[var(--guest-muted)]">
                            <span className="font-semibold text-[var(--guest-muted)]">{resultCount}</span> {resultNoun}
                            {filters.searchNormalized ? (
                                <>
                                    {" "}
                                    for &ldquo;<span className="text-[var(--guest-accent-70)]">{filters.searchQuery.trim()}</span>&rdquo;
                                </>
                            ) : null}
                            {filters.dietFilters.length > 0 ? <span> · diet filter on</span> : null}
                            {filters.sortBy !== "default" ? <span> · sorted</span> : null}
                        </div>
                    )}
                    <GuestMenuSearchNotices
                        searchQuery={filters.searchQuery}
                        isSearchUnmatched={filters.isSearchUnmatched}
                        isDietUnmatched={filters.isDietUnmatched}
                        didYouMeanItem={filters.didYouMeanItem}
                        onSearch={filters.setSearchQuery}
                        onClearDietFilters={() => filters.setDietFilters([])}
                    />

                    <GuestMenuList
                        template={resolveGuestMenuTemplate(hotel.guestMenuTemplate)}
                        serverTemplate={serverTemplate}
                        ServerSections={ServerTemplateSections}
                        displayCategories={filters.displayCategories}
                        searchNormalized={filters.searchNormalized}
                    />
                </main>

                {digitalOrderingEnabled && (cart.cartCount > 0 || ordering.showCart || ordering.showHistory || ordering.showRoomModal) && (
                    <AnimatedOverlays
                        showCart={ordering.showCart}
                        showHistory={ordering.showHistory}
                        showRoomModal={ordering.showRoomModal}
                        cartCount={cart.cartCount}
                        cart={cart.cart}
                        cartTotal={cart.cartTotal}
                        cartAnimKey={cart.cartAnimKey}
                        isOpen={isOpen}
                        guestName={ordering.guestName}
                        notes={ordering.notes}
                        placing={ordering.placing}
                        pastOrders={ordering.pastOrders}
                        availableRooms={availableRooms}
                        selectedRoomId={room.selectedRoomId}
                        onCloseCart={() => ordering.setShowCart(false)}
                        onCloseHistory={() => ordering.setShowHistory(false)}
                        onCloseRoomModal={() => ordering.setShowRoomModal(false)}
                        onShowCart={() => ordering.setShowCart(true)}
                        onConfirmRoom={ordering.confirmRoomFromModal}
                        onInitiateOrder={ordering.initiateOrder}
                        onRemoveFromCart={cart.removeFromCart}
                        onAddToCart={cart.addToCart}
                        setGuestName={ordering.setGuestName}
                        setNotes={ordering.setNotes}
                        setSelectedRoomId={room.setSelectedRoomId}
                    />
                )}

                {ordering.showPinModal && (
                    <StayPinModal
                        isOpen
                        onClose={() => ordering.setShowPinModal(false)}
                        roomId={room.resolvedRoomId}
                        roomNumber={room.roomDisplayName || "Your Room"}
                        onSuccess={ordering.onPinVerified}
                    />
                )}
            </div>
        </GuestMenuProvider>
    );
}
