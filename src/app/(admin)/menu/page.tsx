"use client";

import { useState, useRef } from "react";
import { api } from "@/lib/api";
import { MenuCategory, MenuItem } from "@/lib/types";
import { useCategories, useMenuItems, invalidateMenuCache } from "@/hooks/useSwrApi";
import { AdminPageSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AnimatePresence, motion } from "framer-motion";
import { upload } from "@vercel/blob/client";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    FolderOpen,
    X,
    Image as ImageIcon,
    Upload
} from "lucide-react";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export default function MenuPage() {
    const { data: categories = [], isLoading: categoriesLoading } = useCategories();
    const { data: items = [], isLoading: itemsLoading } = useMenuItems();
    const loading = categoriesLoading || itemsLoading;
    const [activeTab, setActiveTab] = useState<"items" | "categories">("items");
    const [search, setSearch] = useState("");
    const [showItemModal, setShowItemModal] = useState(false);
    const [showCatModal, setShowCatModal] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [itemForm, setItemForm] = useState({ name: "", description: "", price: "", categoryId: "", imageUrl: "", dietaryPreference: "NONE" });
    const [catForm, setCatForm] = useState({ name: "", icon: "" });
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        if (!ALLOWED_TYPES.includes(file.type)) {
            alert('Please select a JPEG, PNG, or WebP image.');
            return;
        }
        if (file.size > MAX_SIZE) {
            alert('Image must be 10 MB or smaller.');
            return;
        }
        setUploading(true);
        try {
            const { token } = await api.getUploadToken();
            const blob = await upload(file.name, file, {
                access: 'public',
                handleUploadUrl: '/api/blob-upload',
                clientPayload: JSON.stringify({ token }),
            });
            setItemForm((prev) => ({ ...prev, imageUrl: blob.url }));
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    }

    function openNewItem() {
        setEditingItem(null);
        setItemForm({ name: "", description: "", price: "", categoryId: categories[0]?.id || "", imageUrl: "", dietaryPreference: "NONE" });
        setShowItemModal(true);
    }
    function openEditItem(item: MenuItem) {
        setEditingItem(item);
        setItemForm({ name: item.name, description: item.description || "", price: String(item.price), categoryId: item.categoryId, imageUrl: item.imageUrl || "", dietaryPreference: (item as any).dietaryPreference || "NONE" });
        setShowItemModal(true);
    }
    async function saveItem(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            const data = { name: itemForm.name, description: itemForm.description || undefined, price: Number(itemForm.price), categoryId: itemForm.categoryId, imageUrl: itemForm.imageUrl || undefined, dietaryPreference: itemForm.dietaryPreference };
            if (editingItem) { await api.updateMenuItem(editingItem.id, data as any); }
            else { await api.createMenuItem(data); }
            setShowItemModal(false);
            invalidateMenuCache();
        } catch (err: any) { alert(err.message); }
        finally { setSaving(false); }
    }
    async function toggleAvailability(item: MenuItem) {
        try { await api.updateMenuItem(item.id, { available: !item.available } as any); invalidateMenuCache(); }
        catch (err: any) { alert(err.message); }
    }
    async function deleteItem(id: string) {
        if (!confirm("Delete this item?")) return;
        try { await api.deleteMenuItem(id); invalidateMenuCache(); }
        catch (err: any) { alert(err.message); }
    }
    async function saveCategory(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try { await api.createCategory({ name: catForm.name, icon: catForm.icon || undefined }); setShowCatModal(false); setCatForm({ name: "", icon: "" }); invalidateMenuCache(); }
        catch (err: any) { alert(err.message); }
        finally { setSaving(false); }
    }
    async function deleteCategory(id: string) {
        if (!confirm("Delete this category and all its items?")) return;
        try { await api.deleteCategory(id); invalidateMenuCache(); }
        catch (err: any) { alert(err.message); }
    }

    const filteredItems = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.description?.toLowerCase().includes(search.toLowerCase()));

    if (loading) return <AdminPageSkeleton cardCount={9} />;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Menu Management</h1>
                    <p className="text-muted-foreground mt-1">Organize your offerings into categories</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => { setCatForm({ name: "", icon: "" }); setShowCatModal(true); }}>
                        <FolderOpen className="w-4 h-4 mr-2" /> New Category
                    </Button>
                    <Button onClick={openNewItem}>
                        <Plus className="w-4 h-4 mr-2" /> Add Item
                    </Button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center border-b border-border pb-1">
                <div className="flex gap-6">
                    {(["items", "categories"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`text-sm font-medium pb-3 border-b-2 transition-colors capitalize ${activeTab === tab
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab === "items" && (
                    <div className="relative w-full sm:w-64 pb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 -mt-1 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-secondary/50 border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                )}
            </div>

            {/* Content Key-based Animation */}
            <AnimatePresence mode="wait">
                {activeTab === "items" ? (
                    <motion.div key="items" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredItems.map((item) => (
                            <div key={item.id} className="dashboard-card overflow-hidden group flex flex-col h-full">
                                {/* Image Area */}
                                <div className="h-40 bg-secondary relative overflow-hidden">
                                    {item.imageUrl ? (
                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary/50">
                                            <ImageIcon className="w-8 h-8 opacity-20" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEditItem(item)} className="p-2 bg-secondary backdrop-blur-md rounded-lg text-foreground hover:bg-secondary/80 border border-border">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => deleteItem(item.id)} className="p-2 bg-destructive/90 backdrop-blur-md rounded-lg text-destructive-foreground hover:bg-destructive shadow-sm">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="font-semibold text-foreground text-lg mb-1">{item.name}</h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{item.description}</p>

                                    <div className="flex items-center justify-between pt-4 border-t border-border">
                                        <span className="text-lg font-bold text-foreground">₹{item.price}</span>
                                        <button
                                            onClick={() => toggleAvailability(item)}
                                            className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${item.available ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-secondary text-muted-foreground border-border"}`}
                                        >
                                            {item.available ? "Available" : "Sold Out"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div key="categories" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {categories.map((cat) => (
                            <div key={cat.id} className="dashboard-card p-8 flex flex-col items-center text-center cursor-pointer group hover:border-primary/50">
                                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                                    {cat.icon || "🍽️"}
                                </div>
                                <h3 className="font-semibold text-foreground">{cat.name}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{cat._count?.items || 0} items active</p>
                                <button onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id); }} className="mt-4 text-xs text-red-400 opacity-0 group-hover:opacity-100 hover:underline">
                                    Delete
                                </button>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modals - Simplified styling */}
            <AnimatePresence>
                {showItemModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowItemModal(false)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
                            <div className="flex justify-between items-center p-5 border-b border-border bg-muted/20">
                                <h3 className="font-semibold text-foreground">{editingItem ? "Edit Item" : "New Item"}</h3>
                                <button onClick={() => setShowItemModal(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
                            </div>
                            <form onSubmit={saveItem} className="p-6 space-y-4">
                                <Input placeholder="Item Name" value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} required />
                                <textarea
                                    placeholder="Description"
                                    className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-[100px] resize-none"
                                    value={itemForm.description}
                                    onChange={e => setItemForm({ ...itemForm, description: e.target.value })}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input type="number" placeholder="Price" value={itemForm.price} onChange={e => setItemForm({ ...itemForm, price: e.target.value })} required />
                                    <select
                                        value={itemForm.categoryId}
                                        onChange={e => setItemForm({ ...itemForm, categoryId: e.target.value })}
                                        className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                    >
                                        <option value="">Category</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Image</label>
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            className="hidden"
                                            onChange={handleImageUpload}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={uploading}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            {uploading ? "Uploading…" : <><Upload className="w-4 h-4 mr-1.5" /> Choose Image</>}
                                        </Button>
                                        <span className="text-xs text-muted-foreground">JPEG, PNG, WebP • max 10 MB</span>
                                    </div>
                                    <Input placeholder="Or paste image URL (optional)" value={itemForm.imageUrl} onChange={e => setItemForm({ ...itemForm, imageUrl: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <select
                                        value={itemForm.dietaryPreference}
                                        onChange={e => setItemForm({ ...itemForm, dietaryPreference: e.target.value })}
                                        className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                    >
                                        <option value="NONE">None</option>
                                        <option value="VEG">Veg</option>
                                        <option value="NON_VEG">Non-Veg</option>
                                        <option value="EGGITARIAN">Eggitarian</option>
                                    </select>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => setShowItemModal(false)}>Cancel</Button>
                                    <Button type="submit" loading={saving} className="flex-1">Save Changes</Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Category modal similar structure... omitted for brevity but logic handles it */}
            <AnimatePresence>
                {showCatModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowCatModal(false)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-card border border-border rounded-xl shadow-2xl">
                            <div className="flex justify-between items-center p-5 border-b border-border bg-muted/20">
                                <h3 className="font-semibold text-foreground">New Category</h3>
                                <button onClick={() => setShowCatModal(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
                            </div>
                            <form onSubmit={saveCategory} className="p-6 space-y-4">
                                <Input placeholder="Category Name" value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} required />
                                <Input placeholder="Icon (emoji)" value={catForm.icon} onChange={e => setCatForm({ ...catForm, icon: e.target.value })} />
                                <div className="flex gap-3 pt-2">
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => setShowCatModal(false)}>Cancel</Button>
                                    <Button type="submit" loading={saving} className="flex-1">Create</Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
