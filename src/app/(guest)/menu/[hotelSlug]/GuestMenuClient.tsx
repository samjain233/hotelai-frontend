"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { MenuItem, CartItem, Hotel, Order } from "@/lib/types";
import type { PublicMenuFullData } from "@/lib/types";
import { api, API_URL } from "@/lib/api";
import { usePublicMenuFull } from "@/hooks/useSwrApi";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Search, MapPin, Plus, Minus, Utensils, X, CheckCircle2, Receipt, Clock, Headset } from "lucide-react";
import { cn } from "@/lib/utils";

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
    const menuRes = usePublicMenuFull(hotelSlug, { fallbackData: initialData || undefined });

    const hotel = menuRes.data?.hotel ?? null;
    const categories = menuRes.data?.categories ?? [];
    const availableRooms = menuRes.data?.rooms ?? [];
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
    const [cartAnimKey, setCartAnimKey] = useState(0);
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [pastOrders, setPastOrders] = useState<Order[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    const searchParams = useSearchParams();
    const roomId = searchParams.get("room") || selectedRoomId;
    const currentRoom = availableRooms.find((r) => r.id === roomId);
    const roomDisplayName = currentRoom?.number || "";

    useEffect(() => {
        if (categories.length > 0 && !activeCategory) setActiveCategory(categories[0].id);
    }, [categories, activeCategory]);

    useEffect(() => {
        if (roomId) loadPastOrders();
    }, [roomId]);

    // Lazy-load socket.io only when hotel exists (connects for real-time order updates)
    const socketRef = useRef<{ disconnect: () => void } | null>(null);
    useEffect(() => {
        if (hotel?.id) {
            import("socket.io-client").then(({ io }) => {
                const s = io(`${API_URL}/orders`, { query: { hotelId: hotel.id } });
                socketRef.current = s;
                s.on("order:updated", (updatedOrder: Order) => {
                    setOrder((prev) => (prev && updatedOrder.id === prev.id ? updatedOrder : prev));
                    setPastOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
                });
                s.on("order:new", (newOrder: Order) => {
                    if (newOrder.roomId === roomId) setPastOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
                });
            });
        }
        return () => {
            socketRef.current?.disconnect?.();
            socketRef.current = null;
        };
    }, [hotel?.id, roomId]);

    async function loadPastOrders() {
        if (!roomId) return;
        try {
            const orders = await api.getGuestRoomOrders(roomId);
            setPastOrders(orders);
        } catch (err) {
            console.error("Failed to load past orders", err);
        }
    }

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
        if (!roomId) {
            setShowCart(false);
            setShowRoomModal(true);
            return;
        }
        placeOrder();
    }

    async function placeOrder() {
        if (!roomId) return;
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
        } catch (err: any) {
            alert(err.message || "Failed to place order");
        } finally {
            setPlacing(false);
        }
    }

    const filteredCategories = searchQuery.trim()
        ? categories
              .map((cat) => ({
                  ...cat,
                  items: cat.items.filter(
                      (item) =>
                          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description?.toLowerCase().includes(searchQuery.toLowerCase())
                  ),
              }))
              .filter((cat) => cat.items.length > 0)
        : categories;

    if (loading) {
        return (
            <div className="min-h-screen bg-background page-transition">
                <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
                    <div className="px-5 py-4 max-w-md mx-auto">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-11 h-11 rounded-xl animate-shimmer flex-shrink-0" />
                            <div className="flex-1 space-y-1.5">
                                <div className="h-5 w-28 animate-shimmer rounded" />
                                <div className="h-3 w-20 animate-shimmer rounded" />
                            </div>
                            <div className="h-8 w-14 animate-shimmer rounded-full" />
                        </div>
                        <div className="h-9 w-full animate-shimmer rounded-full mb-3" />
                        <div className="flex gap-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-8 animate-shimmer rounded-full flex-shrink-0" style={{ width: `${60 + i * 12}px` }} />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="max-w-md mx-auto px-5 py-6 space-y-8">
                    <div className="text-center py-2 space-y-2">
                        <div className="h-7 w-32 animate-shimmer rounded mx-auto" />
                        <div className="h-0.5 w-12 animate-shimmer rounded mx-auto" />
                        <div className="h-3 w-48 animate-shimmer rounded mx-auto" />
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-5 animate-shimmer rounded-full" />
                            <div className="h-5 w-20 animate-shimmer rounded" />
                        </div>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={`a-${i}`} className="skeleton-card bg-card rounded-xl p-4 border border-border" style={{ animationDelay: `${i * 0.2}s` }}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="h-5 animate-shimmer rounded" style={{ width: `${100 + i * 20}px` }} />
                                    <div className="h-4 w-12 animate-shimmer rounded" />
                                </div>
                                <div className="h-3 w-full animate-shimmer rounded mb-1.5" />
                                <div className="h-3 animate-shimmer rounded mb-4" style={{ width: `${60 + i * 8}%` }} />
                                <div className="flex justify-end">
                                    <div className="h-8 w-16 animate-shimmer rounded-lg" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 bg-background text-center">
                <div>
                    <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
                        <UtensilsCrossed className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-2">Menu Unavailable</h2>
                    <p className="text-sm text-muted-foreground">{error}</p>
                </div>
            </div>
        );
    }

    if (order) {
        return (
            <div className="min-h-screen flex items-center justify-center px-6 bg-background">
                <div className="w-full max-w-sm text-center animate-scale-in">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 text-primary ring-4 ring-primary/5">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">Order Confirmed!</h1>
                    <p className="text-muted-foreground mb-8">
                        Order <span className="font-mono font-medium text-foreground">#{order.orderNumber}</span> has been sent to the kitchen.
                    </p>
                    <div className="dashboard-card bg-card p-0 overflow-hidden text-left mb-6">
                        <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Receipt</span>
                            <Badge variant={order.status === "DELIVERED" ? "success" : order.status === "CANCELLED" ? "danger" : "warning"}>{order.status}</Badge>
                        </div>
                        <div className="p-4 space-y-3">
                            {order.items.map((oi) => (
                                <div key={oi.id} className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        <span className="font-semibold text-foreground mr-2">{oi.quantity}x</span>
                                        {oi.itemName}
                                    </span>
                                    <span className="text-foreground font-medium">{formatPrice(oi.price * oi.quantity)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-muted/20 border-t border-border flex justify-between items-center">
                            <span className="font-semibold text-foreground">Total</span>
                            <span className="text-lg font-bold text-primary">{formatPrice(order.totalAmount)}</span>
                        </div>
                    </div>
                    <Button variant="secondary" className="w-full" onClick={() => setOrder(null)}>
                        Back to Menu
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-32 bg-background font-sans page-transition">
            <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
                <div className="px-5 py-4 max-w-md mx-auto">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#d4a853] to-[#c9973a] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[#d4a853]/20">{hotel?.name?.charAt(0) || "H"}</div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-lg font-bold text-foreground leading-tight truncate">{hotel?.name}</h1>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                {roomDisplayName ? (
                                    <>
                                        <MapPin className="w-3 h-3 text-gold" />
                                        <span>Room {roomDisplayName}</span>
                                    </>
                                ) : (
                                    <span className="italic">Explore our curated selections</span>
                                )}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {pastOrders.length > 0 && (
                                <Button variant="outline" size="sm" onClick={() => setShowHistory(true)} className="h-8 rounded-full bg-background border-border text-xs px-3 shadow-sm">
                                    <Receipt className="w-3.5 h-3.5 mr-1.5" /> Bill
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search dishes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-secondary/50 border border-border rounded-full pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#d4a853]/50 focus:border-[#d4a853]/30 transition-all"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-5 px-5 mask-fade-right">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => {
                                    setActiveCategory(cat.id);
                                    setSearchQuery("");
                                    document.getElementById(`cat-${cat.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                                }}
                                className={cn(
                                    "px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border",
                                    activeCategory === cat.id ? "bg-gradient-to-r from-[#d4a853] to-[#c9973a] text-white border-transparent shadow-sm shadow-[#d4a853]/20" : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary hover:border-border"
                                )}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="max-w-md mx-auto px-5 py-6 space-y-10">
                {!searchQuery && (
                    <div className="text-center py-2 animate-fade-in-up">
                        <h2 className="text-2xl font-serif font-bold text-foreground mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>
                            Welcome
                        </h2>
                        <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-[#d4a853] to-transparent mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">Crafted with care, served with love</p>
                    </div>
                )}
                {searchQuery && (
                    <div className="text-sm text-muted-foreground">
                        {filteredCategories.reduce((sum, cat) => sum + cat.items.length, 0)} results for &ldquo;<span className="text-gold font-medium">{searchQuery}</span>&rdquo;
                    </div>
                )}
                {filteredCategories.map((cat) => (
                    <div key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-48">
                        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <div className="w-1 h-5 bg-gradient-to-b from-[#d4a853] to-[#c9973a] rounded-full" />
                            {cat.name}
                        </h2>
                        <div className="space-y-4">
                            {cat.items.map((item, itemIndex) => {
                                const qty = getCartQuantity(item.id);
                                return (
                                    <div
                                        key={item.id}
                                        className="menu-card bg-card rounded-xl p-4 flex gap-4 shadow-sm animate-fade-in-up"
                                        style={{ animationDelay: `${itemIndex * 50}ms` }}
                                    >
                                        {item.imageUrl && (
                                            <div className="w-20 h-20 rounded-lg bg-secondary flex-shrink-0 overflow-hidden">
                                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex items-center gap-2 pr-2">
                                                    <h3 className="font-semibold text-foreground text-base">{item.name}</h3>
                                                    {item.dietaryPreference === "VEG" && (
                                                        <div className="w-4 h-4 border border-green-500 rounded-sm flex items-center justify-center flex-shrink-0" title="Vegetarian">
                                                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                                                        </div>
                                                    )}
                                                    {item.dietaryPreference === "NON_VEG" && (
                                                        <div className="w-4 h-4 border border-red-500 rounded-sm flex items-center justify-center flex-shrink-0" title="Non-Vegetarian">
                                                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                                                        </div>
                                                    )}
                                                    {item.dietaryPreference === "EGGITARIAN" && (
                                                        <div className="w-4 h-4 border border-yellow-500 rounded-sm flex items-center justify-center flex-shrink-0" title="Contains Egg">
                                                            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="font-bold text-gold text-sm whitespace-nowrap">{formatPrice(item.price)}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{item.description}</p>
                                            <div className="flex justify-end">
                                                {qty === 0 ? (
                                                    <Button size="sm" onClick={() => addToCart(item)} disabled={!item.available} variant={item.available ? "secondary" : "ghost"} className={cn("h-8 text-xs", !item.available && "opacity-50")}>
                                                        {item.available ? <><Plus className="w-3.5 h-3.5 mr-1.5" /> Add</> : "Sold Out"}
                                                    </Button>
                                                ) : (
                                                    <div className="flex items-center gap-3 bg-secondary rounded-lg p-1">
                                                        <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 flex items-center justify-center rounded-md bg-white hover:bg-zinc-200 text-black transition-colors">
                                                            <Minus className="w-4 h-4" />
                                                        </button>
                                                        <span className="font-bold text-foreground w-4 text-center text-sm">{qty}</span>
                                                        <button onClick={() => addToCart(item)} className="w-7 h-7 flex items-center justify-center rounded-md bg-gradient-to-r from-[#d4a853] to-[#c9973a] text-white hover:opacity-90 transition-opacity">
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
                {searchQuery && filteredCategories.length === 0 && (
                    <div className="text-center py-16">
                        <Search className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-20" />
                        <p className="text-muted-foreground">No dishes found</p>
                        <button onClick={() => setSearchQuery("")} className="text-sm text-gold mt-2 hover:underline">Clear search</button>
                    </div>
                )}
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

            {!showCart && !showHistory && !showRoomModal && (
                <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border">
                    <div className="max-w-md mx-auto flex">
                        <div className="flex-1 flex flex-col items-center gap-0.5 py-3 text-primary cursor-default">
                            <Utensils className="w-5 h-5" />
                            <span className="text-[10px] font-semibold">Food Menu</span>
                        </div>
                        <a href={`/services/${hotelSlug}${roomId ? `?room=${roomId}` : ""}`} className="flex-1 flex flex-col items-center gap-0.5 py-3 text-muted-foreground hover:text-foreground transition-colors">
                            <Headset className="w-5 h-5" />
                            <span className="text-[10px] font-medium">Services</span>
                        </a>
                    </div>
                </div>
            )}
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
