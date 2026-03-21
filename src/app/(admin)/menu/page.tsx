"use client";

import { useState, useRef } from "react";
import { api } from "@/lib/api";
import { MenuItem } from "@/lib/types";
import { useCategories, useMenuItems, invalidateMenuCache } from "@/hooks/useSwrApi";
import { AdminPageSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { AnimatePresence, motion } from "framer-motion";
import { upload } from "@vercel/blob/client";
import { cn } from "@/lib/utils";
import { CATEGORY_ICON_MAP, CATEGORY_ICON_PICKER_OPTIONS, CategoryIconDisplay } from "@/lib/categoryIcons";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    FolderOpen,
    X,
    Image as ImageIcon,
    Upload,
    Leaf,
    Beef,
    Egg
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
    /** When true, next successful category create selects that category in the item form */
    const selectNewCategoryInItemForm = useRef(false);

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
            const { pathname } = await api.getUploadPathname(token);
            const blob = await upload(pathname, file, {
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
        try {
            const created = await api.createCategory({ name: catForm.name, icon: catForm.icon || undefined });
            setShowCatModal(false);
            setCatForm({ name: "", icon: "" });
            invalidateMenuCache();
            if (selectNewCategoryInItemForm.current) {
                selectNewCategoryInItemForm.current = false;
                setItemForm((prev) => ({ ...prev, categoryId: created.id }));
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    }
    async function deleteCategory(id: string) {
        if (!confirm("Delete this category and all its items?")) return;
        try { await api.deleteCategory(id); invalidateMenuCache(); }
        catch (err: any) { alert(err.message); }
    }

    function closeCatModal() {
        selectNewCategoryInItemForm.current = false;
        setShowCatModal(false);
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
                    <Button
                        variant="outline"
                        onClick={() => {
                            selectNewCategoryInItemForm.current = false;
                            setCatForm({ name: "", icon: "" });
                            setShowCatModal(true);
                        }}
                    >
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
                                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                                    <CategoryIconDisplay icon={cat.icon} size="xl" className="text-primary" />
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

            {/* New Item / Edit Item Modal */}
            <AnimatePresence>
                {showItemModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto py-8" onClick={() => setShowItemModal(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 8 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-4xl my-auto bg-card border border-white/10 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden"
                        >
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-foreground tracking-tight">{editingItem ? "Edit Item" : "New Item"}</h3>
                                    <button
                                        onClick={() => setShowItemModal(false)}
                                        className="p-2 -m-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={saveItem}>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
                                    {/* Left column: Basic info */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium text-foreground mb-1.5 block">Item name</label>
                                            <Input placeholder="e.g. Masala Dosa" value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} required className="h-11" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-foreground mb-1.5 block">Price (₹)</label>
                                                <Input type="number" placeholder="0" value={itemForm.price} onChange={e => setItemForm({ ...itemForm, price: e.target.value })} required className="h-11" />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-foreground mb-1.5 block">Category</label>
                                                <SearchableSelect
                                                    options={categories.map((c) => ({ value: c.id, label: c.name }))}
                                                    value={itemForm.categoryId}
                                                    onChange={(v) => setItemForm({ ...itemForm, categoryId: v })}
                                                    placeholder="Select category"
                                                    searchPlaceholder="Type to search..."
                                                    emptyMessage="No categories found"
                                                    footerAction={{
                                                        label: "Create new category",
                                                        onClick: (searchQuery) => {
                                                            selectNewCategoryInItemForm.current = true;
                                                            setCatForm({ name: searchQuery.trim(), icon: "" });
                                                            setShowCatModal(true);
                                                        },
                                                    }}
                                                    className="[&>button]:h-11 [&>button]:rounded-xl"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-foreground mb-1.5 block">Description</label>
                                            <textarea
                                                placeholder="Brief description of the dish"
                                                className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/80 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 min-h-[180px] resize-none transition-all"
                                                value={itemForm.description}
                                                onChange={e => setItemForm({ ...itemForm, description: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Right column: Image + Dietary */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground block">Image</label>
                                            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageUpload} />
                                            <div
                                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("!border-primary/60", "!bg-primary/10"); }}
                                                onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove("!border-primary/60", "!bg-primary/10"); }}
                                                onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("!border-primary/60", "!bg-primary/10"); const f = e.dataTransfer.files?.[0]; if (f) handleImageUpload({ target: { files: [f] } } as any); }}
                                                onClick={() => fileInputRef.current?.click()}
                                                className={cn(
                                                    "relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 min-h-[280px] group",
                                                    itemForm.imageUrl
                                                        ? "border-white/20 bg-secondary/40 hover:border-white/30"
                                                        : "border-white/15 bg-white/[0.02] hover:border-primary/40 hover:bg-primary/5"
                                                )}
                                            >
                                                {itemForm.imageUrl ? (
                                                    <>
                                                        <div className="w-full aspect-video rounded-lg overflow-hidden bg-secondary ring-1 ring-white/10">
                                                            <img src={itemForm.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                                                            <span className="px-4 py-2 bg-white/90 text-black text-sm font-medium rounded-lg">Change image</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                                            <Upload className="w-6 h-6 text-primary" />
                                                        </div>
                                                        <div className="text-center space-y-0.5">
                                                            <p className="text-sm font-medium text-foreground">{uploading ? "Uploading…" : "Drop or click to upload"}</p>
                                                            <p className="text-xs text-muted-foreground">JPEG, PNG, WebP • max 10 MB</p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground block">Dietary preference</label>
                                            <div className="flex flex-wrap gap-2">
                                                {[
                                                    { value: "NONE" as const, label: "None", icon: null, activeClass: "bg-white/15 text-foreground border-white/25", inactiveClass: "bg-white/[0.03] text-muted-foreground border-white/10 hover:border-white/20" },
                                                    { value: "VEG" as const, label: "Veg", icon: <Leaf className="w-4 h-4" />, activeClass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40", inactiveClass: "bg-emerald-500/5 text-emerald-400/70 border-emerald-500/20 hover:border-emerald-500/40" },
                                                    { value: "NON_VEG" as const, label: "Non-Veg", icon: <Beef className="w-4 h-4" />, activeClass: "bg-red-500/20 text-red-400 border-red-500/40", inactiveClass: "bg-red-500/5 text-red-400/70 border-red-500/20 hover:border-red-500/40" },
                                                    { value: "EGGITARIAN" as const, label: "Egg", icon: <Egg className="w-4 h-4" />, activeClass: "bg-amber-500/20 text-amber-400 border-amber-500/40", inactiveClass: "bg-amber-500/5 text-amber-400/70 border-amber-500/20 hover:border-amber-500/40" },
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() => setItemForm({ ...itemForm, dietaryPreference: opt.value })}
                                                        className={cn(
                                                            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200",
                                                            itemForm.dietaryPreference === opt.value ? opt.activeClass : opt.inactiveClass
                                                        )}
                                                    >
                                                        {opt.icon}
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions - full width footer */}
                                <div className="flex gap-3 px-6 pb-6 pt-5">
                                    <Button type="button" variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => setShowItemModal(false)}>Cancel</Button>
                                    <Button type="submit" loading={saving} className="flex-1 h-11 rounded-xl shadow-lg shadow-primary/20">Save Changes</Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Category modal similar structure... omitted for brevity but logic handles it */}
            <AnimatePresence>
                {showCatModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeCatModal}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl">
                            <div className="flex justify-between items-center p-5 border-b border-border bg-muted/20">
                                <h3 className="font-semibold text-foreground">New Category</h3>
                                <button type="button" onClick={closeCatModal}><X className="w-5 h-5 text-muted-foreground" /></button>
                            </div>
                            <form onSubmit={saveCategory} className="p-6 space-y-4">
                                <Input placeholder="Category Name" value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} required />
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Category icon</label>
                                    <p className="text-[11px] text-muted-foreground leading-snug">
                                        Icons from{" "}
                                        <a
                                            href="https://lucide.dev"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline"
                                        >
                                            Lucide
                                        </a>
                                        . Old emoji values still work if pasted below.
                                    </p>
                                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 p-3 rounded-xl bg-secondary/40 border border-border max-h-[240px] overflow-y-auto">
                                        <button
                                            type="button"
                                            title="Default utensils icon"
                                            onClick={() => setCatForm((prev) => ({ ...prev, icon: "" }))}
                                            className={cn(
                                                "flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border border-dashed border-border text-[10px] text-muted-foreground transition-all hover:bg-secondary",
                                                catForm.icon === "" && "ring-2 ring-primary bg-primary/10 border-primary/30 text-foreground",
                                            )}
                                        >
                                            Auto
                                        </button>
                                        {CATEGORY_ICON_PICKER_OPTIONS.map(({ key, label }) => {
                                            const LucideIcon = CATEGORY_ICON_MAP[key];
                                            return (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    title={label}
                                                    onClick={() => setCatForm((prev) => ({ ...prev, icon: key }))}
                                                    className={cn(
                                                        "flex flex-col items-center gap-1 py-2 px-1 rounded-xl border border-transparent transition-all hover:bg-secondary",
                                                        catForm.icon === key && "ring-2 ring-primary bg-primary/15 border-border shadow-sm",
                                                    )}
                                                >
                                                    <LucideIcon className="w-5 h-5 text-foreground shrink-0" />
                                                    <span className="text-[9px] text-muted-foreground text-center leading-tight line-clamp-2 px-0.5">
                                                        {label}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <Input
                                        placeholder="Advanced: icon key (e.g. pizza) or emoji…"
                                        value={catForm.icon}
                                        onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })}
                                        className="text-sm font-mono"
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-snug">
                                        Leave empty or Auto for the default utensils icon.
                                    </p>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <Button type="button" variant="outline" className="flex-1" onClick={closeCatModal}>Cancel</Button>
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
