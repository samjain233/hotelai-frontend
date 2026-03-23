"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MapPin, Plus, Minus, X, Receipt, Clock } from "lucide-react";
import type { Order, CartItem } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatPrice(price: number) {
    return `₹${price.toLocaleString()}`;
}

interface CartBarProps {
    cartCount: number;
    cartTotal: number;
    cartAnimKey: number;
    onShowCart: () => void;
}
export function CartBar({ cartCount, cartTotal, cartAnimKey, onShowCart }: CartBarProps) {
    return (
        <AnimatePresence>
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-24 left-5 right-5 z-50 max-w-md mx-auto">
                <button
                    onClick={onShowCart}
                    className="w-full h-14 rounded-full border border-rose-500/30 bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-xl shadow-rose-900/40 flex items-center justify-between px-6 text-base font-semibold hover:opacity-95 active:scale-[0.98] transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div key={cartAnimKey} className="bg-white/20 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold cart-pulse">{cartCount}</div>
                        <span>View Order</span>
                    </div>
                    <span className="font-bold">{formatPrice(cartTotal)}</span>
                </button>
            </motion.div>
        </AnimatePresence>
    );
}

interface AnimatedOverlaysProps {
    showCart: boolean;
    showHistory: boolean;
    showRoomModal: boolean;
    cartCount: number;
    cart: CartItem[];
    cartTotal: number;
    cartAnimKey: number;
    guestName: string;
    notes: string;
    placing: boolean;
    pastOrders: Order[];
    availableRooms: { id: string; number: string; floor?: string }[];
    selectedRoomId: string;
    isOpen?: boolean;
    onCloseCart: () => void;
    onCloseHistory: () => void;
    onCloseRoomModal: () => void;
    onShowCart: () => void;
    onPlaceOrder: () => void;
    onInitiateOrder: () => void;
    onRemoveFromCart: (itemId: string) => void;
    onAddToCart: (item: CartItem["item"]) => void;
    setGuestName: (v: string) => void;
    setNotes: (v: string) => void;
    setSelectedRoomId: (v: string) => void;
}

export function AnimatedOverlays({
    showCart, showHistory, showRoomModal, cartCount, cart, cartTotal, cartAnimKey,
    guestName, notes, placing, pastOrders, availableRooms, selectedRoomId, isOpen = true,
    onCloseCart, onCloseHistory, onCloseRoomModal, onShowCart, onPlaceOrder, onInitiateOrder,
    onRemoveFromCart, onAddToCart, setGuestName, setNotes, setSelectedRoomId,
}: AnimatedOverlaysProps) {
    return (
        <>
            <AnimatePresence>
                {cartCount > 0 && !showCart && <CartBar cartCount={cartCount} cartTotal={cartTotal} cartAnimKey={cartAnimKey} onShowCart={onShowCart} />}
            </AnimatePresence>
            <AnimatePresence>
                {showCart && (
                    <CartDrawer
                        cart={cart} guestName={guestName} notes={notes} cartTotal={cartTotal} placing={placing} isOpen={isOpen}
                        onClose={onCloseCart} onInitiateOrder={onInitiateOrder}
                        onRemoveFromCart={onRemoveFromCart} onAddToCart={onAddToCart}
                        setGuestName={setGuestName} setNotes={setNotes} formatPrice={formatPrice}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {showHistory && <HistoryDrawer pastOrders={pastOrders} onClose={onCloseHistory} formatPrice={formatPrice} />}
            </AnimatePresence>
            <AnimatePresence>
                {showRoomModal && (
                    <RoomModal
                        availableRooms={availableRooms} selectedRoomId={selectedRoomId} isOpen={isOpen}
                        onClose={onCloseRoomModal} onConfirm={onPlaceOrder} setSelectedRoomId={setSelectedRoomId}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

interface CartDrawerProps {
    cart: CartItem[];
    guestName: string;
    notes: string;
    cartTotal: number;
    placing: boolean;
    isOpen?: boolean;
    onClose: () => void;
    onInitiateOrder: () => void;
    onRemoveFromCart: (itemId: string) => void;
    onAddToCart: (item: CartItem["item"]) => void;
    setGuestName: (v: string) => void;
    setNotes: (v: string) => void;
    formatPrice: (p: number) => string;
}
export function CartDrawer({ cart, guestName, notes, cartTotal, placing, isOpen = true, onClose, onInitiateOrder, onRemoveFromCart, onAddToCart, setGuestName, setNotes, formatPrice }: CartDrawerProps) {
    return (
        <motion.div
            key="cart-drawer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
            onClick={onClose}
        >
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-card sm:rounded-2xl rounded-t-3xl border-t sm:border border-border shadow-2xl flex flex-col max-h-[90vh]">
                <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
                    <div className="w-12 h-1.5 bg-muted rounded-full" />
                </div>
                <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                    <h3 className="text-lg font-bold text-foreground">Your Order</h3>
                    <button onClick={onClose} className="p-2 bg-secondary rounded-full text-muted-foreground">
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
                                    <button onClick={() => onRemoveFromCart(ci.item.id)} className="w-7 h-7 flex items-center justify-center rounded-md bg-white text-black hover:bg-zinc-200">
                                        <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="font-bold text-foreground w-4 text-center text-sm">{ci.quantity}</span>
                                    <button onClick={() => onAddToCart(ci.item)} disabled={!isOpen} className={cn("w-7 h-7 flex items-center justify-center rounded-md bg-primary text-primary-foreground", !isOpen && "opacity-50 cursor-not-allowed")}>
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-4 pt-4 border-t border-border">
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Guest Details</label>
                            <Input placeholder="Your Name (Optional)" value={guestName} onChange={(e) => setGuestName(e.target.value)} className="bg-secondary/50 border-border" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Notes</label>
                            <textarea placeholder="Allergies, special requests..." value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px] resize-none" />
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-card border-t border-border safe-area-bottom">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-muted-foreground font-medium">Total</span>
                        <span className="text-2xl font-bold text-foreground">{formatPrice(cartTotal)}</span>
                    </div>
                    {!isOpen && (
                        <p className="text-sm text-muted-foreground mb-3 text-center">Room service is currently closed. Orders can be placed during operating hours.</p>
                    )}
                    <Button onClick={onInitiateOrder} disabled={placing || !isOpen} className="w-full h-12 text-base font-bold">
                        {placing ? "Sending Order..." : !isOpen ? "Outside Operating Hours" : "Place Order"}
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
}

interface HistoryDrawerProps {
    pastOrders: Order[];
    onClose: () => void;
    formatPrice: (p: number) => string;
}
export function HistoryDrawer({ pastOrders, onClose, formatPrice }: HistoryDrawerProps) {
    return (
        <motion.div
            key="history-drawer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
            onClick={onClose}
        >
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-card sm:rounded-2xl rounded-t-3xl border-t sm:border border-border shadow-2xl flex flex-col max-h-[90vh]">
                <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
                    <div className="w-12 h-1.5 bg-muted rounded-full" />
                </div>
                <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-foreground">Room Bill</h3>
                        <p className="text-xs text-muted-foreground">Recent orders for this room</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-secondary rounded-full text-muted-foreground">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/20">
                    {pastOrders.map((o) => (
                        <div key={o.id} className="bg-card border border-border rounded-xl p-4 shadow-sm">
                            <div className="flex justify-between items-center mb-3">
                                <span className="font-mono text-sm font-bold text-foreground">#{o.orderNumber}</span>
                                <Badge variant={o.status === "DELIVERED" ? "success" : o.status === "CANCELLED" ? "danger" : "warning"}>{o.status}</Badge>
                            </div>
                            <div className="space-y-2 mb-3">
                                {o.items.map((oi) => (
                                    <div key={oi.id} className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            <span className="font-medium mr-1">{oi.quantity}x</span> {oi.itemName}
                                        </span>
                                        <span>{formatPrice(oi.price * oi.quantity)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-border">
                                <span className="text-xs text-muted-foreground flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
                        <span className="text-xl font-bold text-primary">{formatPrice(pastOrders.reduce((sum, o) => sum + (o.status !== "CANCELLED" ? o.totalAmount : 0), 0))}</span>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}

interface RoomModalProps {
    availableRooms: { id: string; number: string; floor?: string }[];
    selectedRoomId: string;
    isOpen?: boolean;
    onClose: () => void;
    onConfirm: () => void;
    setSelectedRoomId: (v: string) => void;
}
export function RoomModal({ availableRooms, selectedRoomId, isOpen = true, onClose, onConfirm, setSelectedRoomId }: RoomModalProps) {
    return (
        <motion.div
            key="room-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
        >
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-2xl">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                        <MapPin className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Select Your Room</h3>
                    <p className="text-sm text-muted-foreground mt-1">Please select your room to place the order.</p>
                </div>
                <select
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-4 appearance-none"
                >
                    <option value="">Select a room...</option>
                    {availableRooms.map((room) => (
                        <option key={room.id} value={room.id}>
                            Room {room.number}
                            {room.floor ? ` (Floor ${room.floor})` : ""}
                        </option>
                    ))}
                </select>
                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button className="flex-1" disabled={!selectedRoomId || !isOpen} onClick={onConfirm}>
                        {!isOpen ? "Closed" : "Confirm & Order"}
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
}
