"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { MenuItem, MenuCategory, CartItem, Hotel, Order } from "@/lib/types";
import { api, API_URL } from "@/lib/api";
import { usePublicMenu, usePublicRooms } from "@/hooks/useSwrApi";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShoppingCart,
    Minus,
    Plus,
    ChevronRight,
    Utensils,
    Search,
    MapPin,
    Smartphone,
    X,
    CheckCircle2,
    ChefHat,
    Receipt,
    Clock,
    Headset
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Utility components ──────────────────────────────────
function formatPrice(price: number) {
    return `₹${price.toLocaleString()}`;
}

interface Props {
    params: Promise<{ hotelSlug: string }>;
}

export default function GuestMenuPage({ params }: Props) {
    const [hotelSlug, setHotelSlug] = useState<string>("");
    const menuRes = usePublicMenu(hotelSlug || null);
    const roomsRes = usePublicRooms(hotelSlug || null);

    const hotel = menuRes.data?.hotel ?? null;
    const categories = menuRes.data?.categories ?? [];
    const availableRooms = roomsRes.data ?? [];
    const loading = menuRes.isLoading || roomsRes.isLoading;
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

    // Order History State
    const [pastOrders, setPastOrders] = useState<Order[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    const searchParams = useSearchParams();
    // Prefer URL param, fallback to dropdown selection
    const roomId = searchParams.get("room") || selectedRoomId;

    // Resolve room number for display
    const currentRoom = availableRooms.find(r => r.id === roomId);
    const roomDisplayName = currentRoom?.number || "";

    useEffect(() => {
        params.then((p) => {
            setHotelSlug(p.hotelSlug);
        });
    }, [params]);

    useEffect(() => {
        if (categories.length > 0 && !activeCategory) {
            setActiveCategory(categories[0].id);
        }
    }, [categories, activeCategory]);

    useEffect(() => {
        if (roomId) loadPastOrders();
    }, [roomId]);

    // WebSocket connection for real-time tracking
    useEffect(() => {
        let socket: Socket | null = null;
        if (hotel) {
            socket = io(`${API_URL}/orders`, {
                query: { hotelId: hotel.id },
            });

            socket.on("order:updated", (updatedOrder: Order) => {
                if (order && updatedOrder.id === order.id) {
                    setOrder(updatedOrder);
                }
                setPastOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
            });

            socket.on("order:new", (newOrder: Order) => {
                if (newOrder.roomId === roomId) {
                    setPastOrders(prev => [newOrder, ...prev.filter(o => o.id !== newOrder.id)]);
                }
            });
        }
        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, [order?.id, hotel?.id, roomId]);

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
            if (existing) {
                return prev.map((ci) =>
                    ci.item.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
                );
            }
            return [...prev, { item, quantity: 1 }];
        });
        setCartAnimKey(k => k + 1);
    }

    function removeFromCart(itemId: string) {
        setCart((prev) => {
            const existing = prev.find((ci) => ci.item.id === itemId);
            if (existing && existing.quantity > 1) {
                return prev.map((ci) =>
                    ci.item.id === itemId ? { ...ci, quantity: ci.quantity - 1 } : ci
                );
            }
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
        if (!roomId) return; // Should be handled by initiateOrder, but safe guard

        setPlacing(true);
        try {
            const result = await api.placeOrder({
                roomId, // utilizing the manual room ID if URL param is missing
                items: cart.map((ci) => ({ itemId: ci.item.id, quantity: ci.quantity })),
                notes: notes || undefined,
                guestName: guestName || undefined,
            });
            setOrder(result);
            setCart([]);
            setShowCart(false);
            setShowRoomModal(false);
            loadPastOrders(); // Refresh history
        } catch (err: any) {
            alert(err.message || "Failed to place order");
        } finally {
            setPlacing(false);
        }
    }



    // Filter categories by search
    const filteredCategories = searchQuery.trim()
        ? categories.map(cat => ({
            ...cat,
            items: cat.items.filter(item =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchQuery.toLowerCase())
            )
        })).filter(cat => cat.items.length > 0)
        : categories;

    if (loading) {
        return (
            <div className="min-h-screen bg-background page-transition">
                {/* Skeleton Header */}
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

                {/* Skeleton Menu */}
                <div className="max-w-md mx-auto px-5 py-6 space-y-8">
                    {/* Welcome placeholder */}
                    <div className="text-center py-2 space-y-2">
                        <div className="h-7 w-32 animate-shimmer rounded mx-auto" />
                        <div className="h-0.5 w-12 animate-shimmer rounded mx-auto" />
                        <div className="h-3 w-48 animate-shimmer rounded mx-auto" />
                    </div>

                    {/* Category 1 */}
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

                    {/* Category 2 */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-5 animate-shimmer rounded-full" />
                            <div className="h-5 w-28 animate-shimmer rounded" />
                        </div>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={`b-${i}`} className="skeleton-card bg-card rounded-xl p-4 border border-border" style={{ animationDelay: `${(i + 4) * 0.2}s` }}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="h-5 animate-shimmer rounded" style={{ width: `${90 + i * 15}px` }} />
                                    <div className="h-4 w-14 animate-shimmer rounded" />
                                </div>
                                <div className="h-3 w-full animate-shimmer rounded mb-1.5" />
                                <div className="h-3 animate-shimmer rounded mb-4" style={{ width: `${55 + i * 10}%` }} />
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
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm text-center">
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
                            <Badge variant={
                                order.status === 'DELIVERED' ? 'success' :
                                    order.status === 'CANCELLED' ? 'danger' :
                                        'warning' // All other states (PLACED, CONFIRMED, PREPARING, READY) are "In Progress"
                            }>
                                {order.status}
                            </Badge>
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
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-32 bg-background font-sans page-transition">
            {/* 
               HEADER 
               Sticky, blur, warm branding 
            */}
            <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
                <div className="px-5 py-4 max-w-md mx-auto">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#d4a853] to-[#c9973a] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[#d4a853]/20">
                            {hotel?.name?.charAt(0) || "H"}
                        </div>
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

                    {/* Search */}
                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search dishes..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-secondary/50 border border-border rounded-full pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#d4a853]/50 focus:border-[#d4a853]/30 transition-all"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Category Pills */}
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
                                    activeCategory === cat.id
                                        ? "bg-gradient-to-r from-[#d4a853] to-[#c9973a] text-white border-transparent shadow-sm shadow-[#d4a853]/20"
                                        : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary hover:border-border"
                                )}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* 
               MENU LIST 
            */}
            <main className="max-w-md mx-auto px-5 py-6 space-y-10">
                {/* Welcome Banner (only when not searching) */}
                {!searchQuery && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-2"
                    >
                        <h2 className="text-2xl font-serif font-bold text-foreground mb-1" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                            Welcome
                        </h2>
                        <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-[#d4a853] to-transparent mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">Crafted with care, served with love</p>
                    </motion.div>
                )}

                {/* Search results indicator */}
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
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: itemIndex * 0.05, duration: 0.3 }}
                                        className="menu-card bg-card rounded-xl p-4 flex gap-4 shadow-sm"
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
                                                    {item.dietaryPreference === 'VEG' && (
                                                        <div className="w-4 h-4 border border-green-500 rounded-sm flex items-center justify-center flex-shrink-0" title="Vegetarian">
                                                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                                                        </div>
                                                    )}
                                                    {item.dietaryPreference === 'NON_VEG' && (
                                                        <div className="w-4 h-4 border border-red-500 rounded-sm flex items-center justify-center flex-shrink-0" title="Non-Vegetarian">
                                                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                                                        </div>
                                                    )}
                                                    {item.dietaryPreference === 'EGGITARIAN' && (
                                                        <div className="w-4 h-4 border border-yellow-500 rounded-sm flex items-center justify-center flex-shrink-0" title="Contains Egg">
                                                            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="font-bold text-gold text-sm whitespace-nowrap">{formatPrice(item.price)}</span>
                                            </div>

                                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                                                {item.description}
                                            </p>

                                            <div className="flex justify-end">
                                                {qty === 0 ? (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => addToCart(item)}
                                                        disabled={!item.available}
                                                        variant={item.available ? "secondary" : "ghost"}
                                                        className={cn("h-8 text-xs", !item.available && "opacity-50")}
                                                    >
                                                        {item.available ? (
                                                            <>
                                                                <Plus className="w-3.5 h-3.5 mr-1.5" /> Add
                                                            </>
                                                        ) : "Sold Out"}
                                                    </Button>
                                                ) : (
                                                    <div className="flex items-center gap-3 bg-secondary rounded-lg p-1">
                                                        <button
                                                            onClick={() => removeFromCart(item.id)}
                                                            className="w-7 h-7 flex items-center justify-center rounded-md bg-white hover:bg-zinc-200 text-black transition-colors"
                                                        >
                                                            <Minus className="w-4 h-4" />
                                                        </button>
                                                        <span className="font-bold text-foreground w-4 text-center text-sm">{qty}</span>
                                                        <button
                                                            onClick={() => addToCart(item)}
                                                            className="w-7 h-7 flex items-center justify-center rounded-md bg-gradient-to-r from-[#d4a853] to-[#c9973a] text-white hover:opacity-90 transition-opacity"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {/* No search results */}
                {searchQuery && filteredCategories.length === 0 && (
                    <div className="text-center py-16">
                        <Search className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-20" />
                        <p className="text-muted-foreground">No dishes found</p>
                        <button onClick={() => setSearchQuery("")} className="text-sm text-gold mt-2 hover:underline">Clear search</button>
                    </div>
                )}
            </main>

            {/* 
               CART BAR (Floating) 
            */}
            <AnimatePresence>
                {cartCount > 0 && !showCart && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-24 left-5 right-5 z-50 max-w-md mx-auto"
                    >
                        <button
                            onClick={() => setShowCart(true)}
                            className="w-full h-14 rounded-full bg-gradient-to-r from-[#d4a853] to-[#c9973a] text-white shadow-xl shadow-[#d4a853]/25 flex items-center justify-between px-6 text-base font-medium hover:opacity-95 active:scale-[0.98] transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <div key={cartAnimKey} className="bg-white/20 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold cart-pulse">
                                    {cartCount}
                                </div>
                                <span>View Order</span>
                            </div>
                            <span className="font-bold">{formatPrice(cartTotal)}</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 
               FULL SCREEN CART DRAWER 
            */}
            <AnimatePresence>
                {showCart && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={() => setShowCart(false)}>
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-card sm:rounded-2xl rounded-t-3xl border-t sm:border border-border shadow-2xl flex flex-col max-h-[90vh]"
                        >
                            {/* Drawer Handle */}
                            <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
                                <div className="w-12 h-1.5 bg-muted rounded-full" />
                            </div>

                            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                                <h3 className="text-lg font-bold text-foreground">Your Order</h3>
                                <button onClick={() => setShowCart(false)} className="p-2 bg-secondary rounded-full text-muted-foreground">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                                <div className="space-y-4">
                                    {cart.map((ci) => (
                                        <div key={ci.item.id} className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="font-semibold text-foreground text-sm">{ci.item.name}</p>
                                                <p className="text-xs text-muted-foreground">{formatPrice(ci.item.price)}</p>
                                            </div>
                                            <div className="flex items-center gap-3 bg-secondary rounded-lg p-1">
                                                <button onClick={() => removeFromCart(ci.item.id)} className="w-7 h-7 flex items-center justify-center rounded-md bg-white text-black hover:bg-zinc-200">
                                                    <Minus className="w-3.5 h-3.5" />
                                                </button>
                                                <span className="font-bold text-foreground w-4 text-center text-sm">{ci.quantity}</span>
                                                <button onClick={() => addToCart(ci.item)} className="w-7 h-7 flex items-center justify-center rounded-md bg-primary text-primary-foreground">
                                                    <Plus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-4 pt-4 border-t border-border">
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Guest Details</label>
                                        <Input
                                            placeholder="Your Name (Optional)"
                                            value={guestName}
                                            onChange={(e) => setGuestName(e.target.value)}
                                            className="bg-secondary/50 border-border"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Notes</label>
                                        <textarea
                                            placeholder="Allergies, special requests..."
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px] resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-card border-t border-border safe-area-bottom">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-muted-foreground font-medium">Total</span>
                                    <span className="text-2xl font-bold text-foreground">{formatPrice(cartTotal)}</span>
                                </div>
                                <Button
                                    onClick={initiateOrder}
                                    disabled={placing}
                                    className="w-full h-12 text-base font-bold"
                                >
                                    {placing ? "Sending Order..." : "Place Order"}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 
               ORDER HISTORY DRAWER 
            */}
            <AnimatePresence>
                {showHistory && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={() => setShowHistory(false)}>
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-card sm:rounded-2xl rounded-t-3xl border-t sm:border border-border shadow-2xl flex flex-col max-h-[90vh]"
                        >
                            <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
                                <div className="w-12 h-1.5 bg-muted rounded-full" />
                            </div>

                            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold text-foreground">Room Bill</h3>
                                    <p className="text-xs text-muted-foreground">Recent orders for this room</p>
                                </div>
                                <button onClick={() => setShowHistory(false)} className="p-2 bg-secondary rounded-full text-muted-foreground">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/20">
                                {pastOrders.map((o) => (
                                    <div key={o.id} className="bg-card border border-border rounded-xl p-4 shadow-sm">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="font-mono text-sm font-bold text-foreground">#{o.orderNumber}</span>
                                            <Badge variant={
                                                o.status === 'DELIVERED' ? 'success' :
                                                    o.status === 'CANCELLED' ? 'danger' :
                                                        'warning'
                                            }>
                                                {o.status}
                                            </Badge>
                                        </div>
                                        <div className="space-y-2 mb-3">
                                            {o.items.map(oi => (
                                                <div key={oi.id} className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground"><span className="font-medium mr-1">{oi.quantity}x</span> {oi.itemName}</span>
                                                    <span>{formatPrice(oi.price * oi.quantity)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-center justify-between pt-3 border-t border-border">
                                            <span className="text-xs text-muted-foreground flex items-center">
                                                <Clock className="w-3 h-3 mr-1" />
                                                {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <span className="font-bold text-primary">{formatPrice(o.totalAmount)}</span>
                                        </div>
                                    </div>
                                ))}
                                {pastOrders.length === 0 && (
                                    <div className="text-center py-10 text-muted-foreground">
                                        <Receipt className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                        <p>No orders yet</p>
                                    </div>
                                )}
                            </div>

                            {pastOrders.length > 0 && (
                                <div className="p-4 bg-card border-t border-border flex justify-between items-center safe-area-bottom">
                                    <span className="font-bold text-foreground">Total Grand Amount</span>
                                    <span className="text-xl font-bold text-primary">
                                        {formatPrice(pastOrders.reduce((sum, o) => sum + (o.status !== 'CANCELLED' ? o.totalAmount : 0), 0))}
                                    </span>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 
               MANUAL ROOM ENTRY MODAL 
            */}
            <AnimatePresence>
                {showRoomModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-2xl"
                        >
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground">Select Your Room</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Please select your room to place the order.
                                </p>
                            </div>

                            <select
                                value={selectedRoomId}
                                onChange={(e) => setSelectedRoomId(e.target.value)}
                                className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-4 appearance-none"
                            >
                                <option value="">Select a room...</option>
                                {availableRooms.map(room => (
                                    <option key={room.id} value={room.id}>
                                        Room {room.number}{room.floor ? ` (Floor ${room.floor})` : ""}
                                    </option>
                                ))}
                            </select>

                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => setShowRoomModal(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1"
                                    disabled={!selectedRoomId}
                                    onClick={placeOrder}
                                >
                                    Confirm & Order
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Bottom Navigation Bar ── */}
            {!showCart && !showHistory && !showRoomModal && (
                <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border">
                    <div className="max-w-md mx-auto flex">
                        <div
                            className="flex-1 flex flex-col items-center gap-0.5 py-3 text-primary cursor-default"
                        >
                            <Utensils className="w-5 h-5" />
                            <span className="text-[10px] font-semibold">Food Menu</span>
                        </div>
                        <a
                            href={`/services/${hotelSlug}${roomId ? `?room=${roomId}` : ''}`}
                            className="flex-1 flex flex-col items-center gap-0.5 py-3 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Headset className="w-5 h-5" />
                            <span className="text-[10px] font-medium">Services</span>
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper utility for icons
function UtensilsCrossed({ className }: { className?: string }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 2-2.3 2.3c-.4.4-.4 1 0 1.4l1.2 1.2c.4.4.4 1 0 1.4L2 21" /><path d="M22 2l-1.5 1.5c-1.1-1.1-2.9-1.1-4 0l-1.5 1.5" /><path d="M7 2h.01" /><path d="M7 6h.01" /><path d="M2.3 2.3c-.4.4-.4 1 0 1.4l1.2 1.2c.4.4.4 1 0 1.4-1.2 1.2-3 3-4.2 4.2" /></svg>
    )
}
