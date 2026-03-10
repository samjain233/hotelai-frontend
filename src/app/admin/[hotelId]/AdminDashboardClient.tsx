"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface MenuItem {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: string;
    imageUrl: string | null;
    available: boolean;
    createdAt: string;
}

interface QrData {
    hotelId: string;
    qrCode: string;
    scanUrl: string;
}

const CATEGORIES = ["FOOD", "DRINK", "SPA", "SNACK", "DESSERT"];

const CATEGORY_ICONS: Record<string, string> = {
    FOOD: "🍽️",
    DRINK: "🥤",
    SPA: "💆",
    SNACK: "🍿",
    DESSERT: "🍰",
};

export function AdminDashboardClient({
    hotelId,
    hotelName,
    initialItems,
    qrData,
}: {
    hotelId: string;
    hotelName: string;
    initialItems: MenuItem[];
    qrData: QrData | null;
}) {
    const [items, setItems] = useState<MenuItem[]>(initialItems);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editItem, setEditItem] = useState<MenuItem | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [showQr, setShowQr] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("menu");

    // ─── ADD ITEM ───
    async function handleAddItem(data: {
        name: string;
        price: number;
        category: string;
        description: string;
    }) {
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/menu/${hotelId}/items`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                const newItem = await res.json();
                setItems((prev) => [...prev, newItem]);
                setShowAddModal(false);
            }
        } finally {
            setSaving(false);
        }
    }

    // ─── UPDATE ITEM ───
    async function handleUpdateItem(
        itemId: string,
        data: Partial<MenuItem>
    ) {
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/menu/items/${itemId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                const updated = await res.json();
                setItems((prev) =>
                    prev.map((item) => (item.id === itemId ? updated : item))
                );
                setEditItem(null);
            }
        } finally {
            setSaving(false);
        }
    }

    // ─── DELETE ITEM ───
    async function handleDeleteItem(itemId: string) {
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/menu/items/${itemId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setItems((prev) => prev.filter((item) => item.id !== itemId));
                setDeleteConfirm(null);
            }
        } finally {
            setSaving(false);
        }
    }

    // ─── TOGGLE AVAILABILITY ───
    async function toggleAvailability(item: MenuItem) {
        await handleUpdateItem(item.id, { available: !item.available });
    }

    const availableCount = items.filter((i) => i.available).length;
    const unavailableCount = items.length - availableCount;

    return (
        <div className="min-h-screen">
            {/* ─── HEADER ─── */}
            <div
                className="border-b border-[var(--color-border-gold)] px-6 py-5"
                style={{
                    background: "linear-gradient(180deg, #1a1a2e 0%, var(--color-bg-primary) 100%)",
                }}
            >
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs px-3 py-1 rounded-full bg-[rgba(212,168,83,0.1)] border border-[var(--color-border-gold)] text-[var(--color-accent-gold)] tracking-wider uppercase font-medium">
                                Admin
                            </span>
                        </div>
                        <h1
                            className="text-2xl font-bold"
                            style={{
                                fontFamily: "var(--font-playfair)",
                                background:
                                    "linear-gradient(135deg, var(--color-accent-gold-light), var(--color-accent-gold))",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                            }}
                        >
                            {hotelName}
                        </h1>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowQr(true)}
                            className="px-4 py-2 rounded-xl text-sm font-medium bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent-gold)] hover:border-[var(--color-border-gold)] transition-all cursor-pointer"
                        >
                            📱 QR Code
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2 rounded-xl text-sm font-semibold text-[#0a0a0f] cursor-pointer transition-all hover:shadow-[0_2px_12px_rgba(212,168,83,0.4)]"
                            style={{
                                background: "linear-gradient(135deg, #d4a853, #b8912e)",
                            }}
                        >
                            + Add Item
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── STATS BAR ─── */}
            <div className="max-w-5xl mx-auto px-6 py-4">
                <div className="grid grid-cols-3 gap-3">
                    <StatCard label="Total Items" value={items.length} icon="📋" />
                    <StatCard label="Available" value={availableCount} icon="✅" />
                    <StatCard label="Unavailable" value={unavailableCount} icon="⏸️" />
                </div>
            </div>

            {/* ─── TABS ─── */}
            <div className="max-w-5xl mx-auto px-6">
                <div className="flex gap-1 border-b border-[rgba(255,255,255,0.06)]">
                    {[
                        { key: "menu", label: "🍽️ Menu Items" },
                        { key: "qr", label: "📱 QR & Sharing" },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-3 text-sm font-medium transition-all cursor-pointer border-b-2 ${activeTab === tab.key
                                    ? "border-[var(--color-accent-gold)] text-[var(--color-accent-gold)]"
                                    : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── CONTENT ─── */}
            <div className="max-w-5xl mx-auto px-6 py-6 pb-24">
                {activeTab === "menu" && (
                    <div>
                        {items.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="text-5xl mb-3">🍽️</div>
                                <p className="text-[var(--color-text-secondary)] mb-4">
                                    No menu items yet
                                </p>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[#0a0a0f] cursor-pointer"
                                    style={{
                                        background: "linear-gradient(135deg, #d4a853, #b8912e)",
                                    }}
                                >
                                    + Add Your First Item
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${item.available
                                                ? "bg-[var(--color-bg-card)] border-[rgba(255,255,255,0.04)] hover:border-[var(--color-border-gold)]"
                                                : "bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.03)] opacity-60"
                                            }`}
                                    >
                                        {/* Icon */}
                                        <div className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-xl bg-[rgba(255,255,255,0.04)]">
                                            {CATEGORY_ICONS[item.category] || "🍽️"}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-sm truncate">
                                                    {item.name}
                                                </h3>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.05)] text-[var(--color-text-muted)] shrink-0">
                                                    {item.category}
                                                </span>
                                                {!item.available && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 shrink-0">
                                                        Unavailable
                                                    </span>
                                                )}
                                            </div>
                                            {item.description && (
                                                <p className="text-xs text-[var(--color-text-muted)] truncate mt-0.5">
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Price */}
                                        <div className="text-base font-bold text-[var(--color-accent-gold)] shrink-0">
                                            ₹{item.price}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                onClick={() => toggleAvailability(item)}
                                                className="w-9 h-9 rounded-lg flex items-center justify-center text-sm transition-all cursor-pointer hover:bg-[rgba(255,255,255,0.06)]"
                                                title={
                                                    item.available
                                                        ? "Mark as unavailable"
                                                        : "Mark as available"
                                                }
                                            >
                                                {item.available ? "✅" : "⏸️"}
                                            </button>
                                            <button
                                                onClick={() => setEditItem(item)}
                                                className="w-9 h-9 rounded-lg flex items-center justify-center text-sm transition-all cursor-pointer hover:bg-[rgba(255,255,255,0.06)]"
                                                title="Edit"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(item.id)}
                                                className="w-9 h-9 rounded-lg flex items-center justify-center text-sm transition-all cursor-pointer hover:bg-red-500/10"
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "qr" && (
                    <div className="flex flex-col items-center gap-6 py-8">
                        {qrData?.qrCode && (
                            <div className="p-6 bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
                                <img
                                    src={qrData.qrCode}
                                    alt="Menu QR Code"
                                    className="w-64 h-64"
                                />
                            </div>
                        )}
                        <div className="text-center">
                            <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                                Guests scan this QR to view the menu
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] bg-[rgba(255,255,255,0.04)] px-4 py-2 rounded-lg font-mono">
                                {qrData?.scanUrl || `http://localhost:3000/menu/${hotelId}`}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <a
                                href={`${API_URL}/menu/${hotelId}/qr/download`}
                                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent-gold)] hover:border-[var(--color-border-gold)] transition-all"
                            >
                                ⬇️ Download SVG
                            </a>
                            <button
                                onClick={() => {
                                    const url = `http://localhost:3000/menu/${hotelId}`;
                                    navigator.clipboard.writeText(url);
                                    alert("Link copied!");
                                }}
                                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent-gold)] hover:border-[var(--color-border-gold)] transition-all cursor-pointer"
                            >
                                🔗 Copy Link
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ─── ADD MODAL ─── */}
            {showAddModal && (
                <ItemModal
                    title="Add Menu Item"
                    saving={saving}
                    onClose={() => setShowAddModal(false)}
                    onSave={(data) => handleAddItem(data)}
                />
            )}

            {/* ─── EDIT MODAL ─── */}
            {editItem && (
                <ItemModal
                    title="Edit Menu Item"
                    saving={saving}
                    initialData={editItem}
                    onClose={() => setEditItem(null)}
                    onSave={(data) => handleUpdateItem(editItem.id, data)}
                />
            )}

            {/* ─── DELETE CONFIRM ─── */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#16161e] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 w-full max-w-sm">
                        <h3 className="text-lg font-semibold mb-2">Delete Item?</h3>
                        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                            This action cannot be undone. The item will be permanently removed.
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2 rounded-xl text-sm bg-[rgba(255,255,255,0.05)] text-[var(--color-text-secondary)] cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteItem(deleteConfirm)}
                                disabled={saving}
                                className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-500/20 text-red-400 border border-red-500/20 cursor-pointer hover:bg-red-500/30 disabled:opacity-50 transition-all"
                            >
                                {saving ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── QR QUICK VIEW ─── */}
            {showQr && qrData?.qrCode && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={() => setShowQr(false)}
                >
                    <div
                        className="bg-white rounded-3xl p-8 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img src={qrData.qrCode} alt="QR Code" className="w-72 h-72" />
                        <p className="text-center text-gray-600 text-sm mt-3 font-medium">
                            Scan to view menu
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── STAT CARD ───
function StatCard({
    label,
    value,
    icon,
}: {
    label: string;
    value: number;
    icon: string;
}) {
    return (
        <div className="p-4 rounded-2xl bg-[var(--color-bg-card)] border border-[rgba(255,255,255,0.04)]">
            <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{icon}</span>
                <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
            </div>
            <div className="text-2xl font-bold">{value}</div>
        </div>
    );
}

// ─── ITEM MODAL (Add / Edit) ───
function ItemModal({
    title,
    saving,
    initialData,
    onClose,
    onSave,
}: {
    title: string;
    saving: boolean;
    initialData?: MenuItem;
    onClose: () => void;
    onSave: (data: {
        name: string;
        price: number;
        category: string;
        description: string;
        available?: boolean;
    }) => void;
}) {
    const [name, setName] = useState(initialData?.name || "");
    const [price, setPrice] = useState(initialData?.price?.toString() || "");
    const [category, setCategory] = useState(initialData?.category || "FOOD");
    const [description, setDescription] = useState(
        initialData?.description || ""
    );
    const [available, setAvailable] = useState(initialData?.available ?? true);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim() || !price.trim()) return;
        onSave({
            name: name.trim(),
            price: parseFloat(price),
            category,
            description: description.trim(),
            ...(initialData ? { available } : {}),
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#16161e] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-6">{title}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-xs text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wider">
                            Item Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Butter Chicken"
                            required
                            className="w-full px-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-gold)] transition-all"
                        />
                    </div>

                    {/* Price + Category row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wider">
                                Price (₹) *
                            </label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="450"
                                required
                                min="0"
                                className="w-full px-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-gold)] transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wider">
                                Category
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-sm text-white focus:outline-none focus:border-[var(--color-accent-gold)] transition-all"
                            >
                                {CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat} className="bg-[#1a1a2e]">
                                        {CATEGORY_ICONS[cat]} {cat}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wider">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional description..."
                            rows={2}
                            className="w-full px-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-gold)] transition-all resize-none"
                        />
                    </div>

                    {/* Availability (only for edit) */}
                    {initialData && (
                        <div className="flex items-center gap-3 py-2">
                            <button
                                type="button"
                                onClick={() => setAvailable(!available)}
                                className={`w-10 h-6 rounded-full transition-all relative cursor-pointer ${available
                                        ? "bg-[var(--color-accent-gold)]"
                                        : "bg-[rgba(255,255,255,0.1)]"
                                    }`}
                            >
                                <div
                                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${available ? "left-5" : "left-1"
                                        }`}
                                />
                            </button>
                            <span className="text-sm text-[var(--color-text-secondary)]">
                                {available ? "Available on menu" : "Hidden from guests"}
                            </span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 justify-end pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-sm bg-[rgba(255,255,255,0.05)] text-[var(--color-text-secondary)] cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !name.trim() || !price.trim()}
                            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[#0a0a0f] cursor-pointer disabled:opacity-50 transition-all hover:shadow-[0_2px_12px_rgba(212,168,83,0.4)]"
                            style={{
                                background: "linear-gradient(135deg, #d4a853, #b8912e)",
                            }}
                        >
                            {saving ? "Saving..." : initialData ? "Update" : "Add Item"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
