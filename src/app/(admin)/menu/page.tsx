"use client";

import { useState, useRef } from "react";
import { api } from "@/lib/api";
import { BulkMenuImportRow, MenuItem } from "@/lib/types";
import { useCategories, useMenuItems, invalidateMenuCache } from "@/hooks/useSwrApi";
import { AdminPageSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { upload } from "@vercel/blob/client";
import { blobPathnameWithExtension, resolveImageContentType } from "@/lib/imageUpload";
import { cn } from "@/lib/utils";
import {
    CATEGORY_ICON_MAP,
    CATEGORY_ICON_PICKER_OPTIONS,
    CategoryIconDisplay,
    hasCategoryIcon,
} from "@/lib/categoryIcons";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    AlertTriangle,
    FolderOpen,
    X,
    Image as ImageIcon,
    Upload,
    Leaf,
    Beef,
    Egg,
    Check,
    Loader2,
    FileJson2,
    Download,
    Sparkles,
} from "lucide-react";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
/** Max size for Gemini menu photo (base64 request body). */
const MAX_MENU_PHOTO_BYTES = 8 * 1024 * 1024;

const DELETE_CONFIRM_WORD = "delete";

const SAMPLE_BULK_JSON = JSON.stringify(
    {
        items: [
            {
                name: "Paneer Tikka",
                price: 280,
                categoryName: "Starters",
                description: "Grilled cottage cheese",
                dietaryPreference: "VEG",
                available: true,
            },
            {
                name: "Chicken Biryani",
                price: 420,
                categoryName: "Main Course",
                dietaryPreference: "NON_VEG",
            },
        ],
    },
    null,
    2,
);

export default function MenuPage() {
    const { data: categories = [], isLoading: categoriesLoading } = useCategories();
    const { data: items = [], isLoading: itemsLoading } = useMenuItems();
    const loading = categoriesLoading || itemsLoading;
    const [activeTab, setActiveTab] = useState<"items" | "categories">("items");
    const [search, setSearch] = useState("");
    const [showItemModal, setShowItemModal] = useState(false);
    const [showCatModal, setShowCatModal] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [itemForm, setItemForm] = useState({
        name: "",
        description: "",
        price: "",
        categoryId: "",
        imageUrl: "",
        dietaryPreference: "NONE",
        available: true,
    });
    const [catForm, setCatForm] = useState({ name: "", icon: "" });
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const bulkFileInputRef = useRef<HTMLInputElement>(null);
    const bulkMenuPhotoInputRef = useRef<HTMLInputElement>(null);
    const [showBulkImportModal, setShowBulkImportModal] = useState(false);
    const [bulkJsonText, setBulkJsonText] = useState("");
    const [bulkImporting, setBulkImporting] = useState(false);
    const [extractingMenuPhoto, setExtractingMenuPhoto] = useState(false);
    const [bulkImportError, setBulkImportError] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{
        type: "item" | "category";
        id: string;
        name: string;
    } | null>(null);
    const [deleteInput, setDeleteInput] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    /** When true, next successful category create selects that category in the item form */
    const selectNewCategoryInItemForm = useRef(false);

    const deletePhraseMatches = deleteInput.trim().toLowerCase() === DELETE_CONFIRM_WORD;

    function closeDeleteModal() {
        setDeleteConfirm(null);
        setDeleteInput("");
        setDeleteError(null);
        setDeleting(false);
    }

    function openDeleteItemModal(item: MenuItem) {
        setDeleteConfirm({ type: "item", id: item.id, name: item.name });
        setDeleteInput("");
        setDeleteError(null);
    }

    function openDeleteCategoryModal(cat: { id: string; name: string }) {
        setDeleteConfirm({ type: "category", id: cat.id, name: cat.name });
        setDeleteInput("");
        setDeleteError(null);
    }

    async function confirmDelete() {
        if (!deleteConfirm || !deletePhraseMatches) return;
        setDeleting(true);
        setDeleteError(null);
        try {
            if (deleteConfirm.type === "item") {
                await api.deleteMenuItem(deleteConfirm.id);
            } else {
                await api.deleteCategory(deleteConfirm.id);
            }
            invalidateMenuCache();
            closeDeleteModal();
        } catch (err: unknown) {
            setDeleteError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setDeleting(false);
        }
    }

    function closeItemModal() {
        setShowItemModal(false);
        setUploading(false);
        setUploadProgress(0);
    }

    async function processImageFile(file: File) {
        const contentType = resolveImageContentType(file);
        if (!contentType) {
            alert(
                `Please use a JPEG, PNG, or WebP image. If your file is correct but still fails, rename it to end in .jpg, .png, or .webp (some phones send type "${file.type || "empty"}").`,
            );
            return;
        }
        if (file.size > MAX_SIZE) {
            alert("Image must be 10 MB or smaller.");
            return;
        }
        setUploading(true);
        setUploadProgress(4);
        try {
            const { token } = await api.getUploadToken();
            setUploadProgress(12);
            const { pathname: basePath } = await api.getUploadPathname(token);
            const pathname = blobPathnameWithExtension(basePath, contentType);
            setUploadProgress(22);
            const blob = await upload(pathname, file, {
                access: "public",
                handleUploadUrl: "/api/blob-upload",
                clientPayload: JSON.stringify({ token }),
                contentType,
                onUploadProgress: ({ percentage }) => {
                    setUploadProgress(22 + Math.round((percentage / 100) * 73));
                },
            });
            setUploadProgress(100);
            setItemForm((prev) => ({ ...prev, imageUrl: blob.url }));
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    }

    function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = "";
        void processImageFile(file);
    }

    function openNewItem() {
        setEditingItem(null);
        setItemForm({
            name: "",
            description: "",
            price: "",
            categoryId: categories[0]?.id || "",
            imageUrl: "",
            dietaryPreference: "NONE",
            available: true,
        });
        setShowItemModal(true);
    }
    function openEditItem(item: MenuItem) {
        setEditingItem(item);
        setItemForm({
            name: item.name,
            description: item.description || "",
            price: String(item.price),
            categoryId: item.categoryId,
            imageUrl: item.imageUrl || "",
            dietaryPreference: item.dietaryPreference || "NONE",
            available: item.available,
        });
        setShowItemModal(true);
    }
    async function saveItem(e: React.FormEvent) {
        e.preventDefault();
        if (uploading) return;
        setSaving(true);
        try {
            const data = {
                name: itemForm.name,
                description: itemForm.description || undefined,
                price: Number(itemForm.price),
                categoryId: itemForm.categoryId,
                imageUrl: itemForm.imageUrl || undefined,
                dietaryPreference: itemForm.dietaryPreference,
                available: itemForm.available,
            };
            if (editingItem) {
                await api.updateMenuItem(editingItem.id, data as Parameters<typeof api.updateMenuItem>[1]);
            } else {
                await api.createMenuItem(data);
            }
            closeItemModal();
            invalidateMenuCache();
            toast.success(editingItem ? "Item updated successfully" : "Item added successfully");
        } catch (err: any) { alert(err.message); }
        finally { setSaving(false); }
    }
    async function saveCategory(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            const created = await api.createCategory({ name: catForm.name, icon: catForm.icon || undefined });
            setShowCatModal(false);
            setCatForm({ name: "", icon: "" });
            invalidateMenuCache();
            toast.success("Category created successfully");
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

    function closeCatModal() {
        selectNewCategoryInItemForm.current = false;
        setShowCatModal(false);
    }

    function closeBulkImportModal() {
        setShowBulkImportModal(false);
        setBulkImportError(null);
        setExtractingMenuPhoto(false);
    }

    function handleMenuPhotoForExtraction(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please choose a JPEG, PNG, or WebP image.");
            return;
        }
        if (file.size > MAX_MENU_PHOTO_BYTES) {
            toast.error("Image must be 8 MB or smaller for menu scanning.");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result;
            if (typeof dataUrl !== "string") return;
            const m = /^data:([^;]+);base64,([\s\S]+)$/.exec(dataUrl);
            if (!m) {
                toast.error("Could not read the image.");
                return;
            }
            const [, declaredMime, imageBase64] = m;
            const resolvedMime =
                declaredMime.split(";")[0].trim().toLowerCase() === "image/jpg"
                    ? "image/jpeg"
                    : declaredMime.split(";")[0].trim().toLowerCase();

            const allowedMime = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
            if (!allowedMime.has(resolvedMime)) {
                toast.error("Use a JPEG, PNG, WebP, or GIF image.");
                return;
            }

            void (async () => {
                setBulkImportError(null);
                setExtractingMenuPhoto(true);
                try {
                    const { items } = await api.extractMenuFromImage({
                        imageBase64,
                        mimeType: resolvedMime,
                    });
                    setBulkJsonText(JSON.stringify({ items }, null, 2));
                    if (items.length === 0) {
                        toast.message("No items detected", {
                            description: "Try a straighter, well-lit photo of the full menu.",
                        });
                    } else {
                        toast.success(`Extracted ${items.length} item(s)`, {
                            description: "Review and edit the JSON, then tap Import items.",
                        });
                    }
                } catch (err) {
                    const msg = err instanceof Error ? err.message : "Menu scan failed";
                    setBulkImportError(msg);
                    toast.error(msg);
                } finally {
                    setExtractingMenuPhoto(false);
                }
            })();
        };
        reader.onerror = () => {
            toast.error("Could not read the file.");
        };
        reader.readAsDataURL(file);
    }

    const filteredItems = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.description?.toLowerCase().includes(search.toLowerCase()));

    if (loading) return <AdminPageSkeleton cardCount={9} />;

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-[env(safe-area-inset-bottom,0px)]">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Menu Management</h1>
                    <p className="text-sm sm:text-base text-muted-foreground mt-1">Organize your offerings into categories</p>
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 w-full md:w-auto md:justify-end">
                    <Button
                        variant="outline"
                        className="w-full sm:w-auto min-h-11 justify-center sm:justify-center"
                        onClick={() => {
                            selectNewCategoryInItemForm.current = false;
                            setCatForm({ name: "", icon: "" });
                            setShowCatModal(true);
                        }}
                    >
                        <FolderOpen className="w-4 h-4 mr-2 shrink-0" /> New Category
                    </Button>
                    <Button className="w-full sm:w-auto min-h-11 justify-center" onClick={openNewItem}>
                        <Plus className="w-4 h-4 mr-2 shrink-0" /> Add Item
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full sm:w-auto min-h-11 justify-center"
                        onClick={() => {
                            setBulkImportError(null);
                            setShowBulkImportModal(true);
                        }}
                    >
                        <FileJson2 className="w-4 h-4 mr-2 shrink-0" /> Import JSON
                    </Button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between sm:items-end border-b border-border pb-1">
                <div className="flex gap-6 sm:gap-8 shrink-0">
                    {(["items", "categories"] as const).map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "text-sm font-medium min-h-11 py-2 border-b-2 transition-colors capitalize -mb-px",
                                activeTab === tab
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab === "items" && (
                    <div className="relative w-full sm:w-64 sm:max-w-xs pb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <input
                            type="search"
                            enterKeyHint="search"
                            placeholder="Search items..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full min-h-11 bg-secondary/50 border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                    </div>
                )}
            </div>

            {/* Content Key-based Animation */}
            <AnimatePresence mode="wait">
                {activeTab === "items" ? (
                    <motion.div key="items" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
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
                                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex gap-1.5 sm:gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <button
                                            type="button"
                                            onClick={() => openEditItem(item)}
                                            className="p-2.5 sm:p-2 min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 flex items-center justify-center bg-secondary/95 backdrop-blur-md rounded-lg text-foreground hover:bg-secondary border border-border shadow-sm"
                                            aria-label={`Edit ${item.name}`}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openDeleteItemModal(item)}
                                            className="p-2.5 sm:p-2 min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 flex items-center justify-center bg-destructive/90 backdrop-blur-md rounded-lg text-destructive-foreground hover:bg-destructive shadow-sm"
                                            aria-label={`Delete ${item.name}`}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="font-semibold text-foreground text-lg mb-1">{item.name}</h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{item.description}</p>

                                    <div className="pt-4 border-t border-border">
                                        <span className="text-lg font-bold text-foreground">₹{item.price}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div key="categories" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
                        {categories.map((cat) => (
                            <div key={cat.id} className="dashboard-card p-4 sm:p-8 flex flex-col items-center text-center cursor-pointer group hover:border-primary/50">
                                {hasCategoryIcon(cat.icon) ? (
                                    <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                                        <CategoryIconDisplay icon={cat.icon} size="xl" className="text-primary" />
                                    </div>
                                ) : (
                                    <div className="mb-4" aria-hidden />
                                )}
                                <h3 className="font-semibold text-foreground">{cat.name}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{cat._count?.items || 0} items active</p>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openDeleteCategoryModal(cat);
                                    }}
                                    className="mt-3 sm:mt-4 min-h-10 px-2 text-xs font-medium text-red-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:underline"
                                >
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
                    <div
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md overflow-y-auto sm:py-8 pb-[env(safe-area-inset-bottom,0px)]"
                        onClick={() => closeItemModal()}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 8 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-4xl sm:my-auto bg-card border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl shadow-black/40 overflow-hidden max-h-[100dvh] sm:max-h-[min(100dvh,56rem)] flex flex-col"
                        >
                            {/* Header */}
                            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent shrink-0">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-foreground tracking-tight">{editingItem ? "Edit Item" : "New Item"}</h3>
                                    <button
                                        onClick={() => closeItemModal()}
                                        className="p-2 -m-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={saveItem} className="flex min-h-0 flex-1 flex-col overflow-hidden">
                                <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 overflow-y-auto min-h-0 max-h-[calc(100dvh-11rem)] sm:max-h-[calc(100vh-14rem)]">
                                    {/* Left column: Basic info */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium text-foreground mb-1.5 block">Item name</label>
                                            <Input placeholder="e.g. Masala Dosa" value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} required className="h-11" />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                        <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-foreground">On menu</p>
                                                <p className="text-xs text-muted-foreground">Sold out hides the item from guests</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setItemForm({ ...itemForm, available: !itemForm.available })}
                                                className={cn(
                                                    "shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors",
                                                    itemForm.available
                                                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                        : "bg-secondary text-muted-foreground border-border",
                                                )}
                                            >
                                                {itemForm.available ? "Available" : "Sold out"}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Right column: Image + Dietary */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground block">Image</label>
                                            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageUpload} />
                                            <div
                                                onDragOver={(e) => {
                                                    if (uploading) return;
                                                    e.preventDefault();
                                                    e.currentTarget.classList.add("!border-primary/60", "!bg-primary/10");
                                                }}
                                                onDragLeave={(e) => {
                                                    e.preventDefault();
                                                    e.currentTarget.classList.remove("!border-primary/60", "!bg-primary/10");
                                                }}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    e.currentTarget.classList.remove("!border-primary/60", "!bg-primary/10");
                                                    if (uploading) return;
                                                    const f = e.dataTransfer.files?.[0];
                                                    if (f) void processImageFile(f);
                                                }}
                                                onClick={() => !uploading && fileInputRef.current?.click()}
                                                className={cn(
                                                    "relative border-2 border-dashed rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center gap-2 transition-all duration-200 min-h-[200px] sm:min-h-[280px] group overflow-hidden",
                                                    uploading ? "cursor-wait pointer-events-none" : "cursor-pointer",
                                                    itemForm.imageUrl
                                                        ? "border-white/20 bg-secondary/40 hover:border-white/30"
                                                        : "border-white/15 bg-white/[0.02] hover:border-primary/40 hover:bg-primary/5",
                                                )}
                                            >
                                                {uploading && (
                                                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-xl bg-background/85 backdrop-blur-sm px-8">
                                                        <Loader2 className="w-9 h-9 text-primary animate-spin" aria-hidden />
                                                        <div className="w-full max-w-[240px] space-y-2">
                                                            <div className="h-2.5 rounded-full bg-secondary overflow-hidden border border-border">
                                                                <div
                                                                    className="h-full rounded-full bg-gradient-to-r from-primary to-amber-500/90 transition-[width] duration-200 ease-out"
                                                                    style={{ width: `${Math.min(100, Math.max(uploadProgress, 2))}%` }}
                                                                />
                                                            </div>
                                                            <p className="text-xs text-center text-muted-foreground">
                                                                Uploading image…{" "}
                                                                {uploadProgress > 0 ? (
                                                                    <span className="tabular-nums text-foreground/90">{uploadProgress}%</span>
                                                                ) : null}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                                {itemForm.imageUrl ? (
                                                    <>
                                                        <div className="w-full aspect-video rounded-lg overflow-hidden bg-secondary ring-1 ring-white/10">
                                                            <img src={itemForm.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                                        </div>
                                                        <div
                                                            className={cn(
                                                                "absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity rounded-xl",
                                                                uploading ? "opacity-0" : "opacity-0 group-hover:opacity-100",
                                                            )}
                                                        >
                                                            <span className="px-4 py-2 bg-white/90 text-black text-sm font-medium rounded-lg">Change image</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                                            <Upload className="w-6 h-6 text-primary" />
                                                        </div>
                                                        <div className="text-center space-y-0.5">
                                                            <p className="text-sm font-medium text-foreground">Drop or click to upload</p>
                                                            <p className="text-xs text-muted-foreground">JPEG, PNG, WebP • max 10 MB</p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground block">Dietary preference</label>
                                            <div className="flex flex-wrap gap-2">
                                                {(
                                                    [
                                                        {
                                                            value: "NONE" as const,
                                                            label: "None",
                                                            icon: null,
                                                            selected:
                                                                "border-white/70 bg-white/20 text-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.35),0_8px_24px_rgba(0,0,0,0.45)] ring-2 ring-white/50 ring-offset-2 ring-offset-card scale-[1.02]",
                                                            idle: "border-white/10 bg-white/[0.04] text-muted-foreground hover:border-white/20 hover:bg-white/[0.08]",
                                                        },
                                                        {
                                                            value: "VEG" as const,
                                                            label: "Veg",
                                                            icon: <Leaf className="w-4 h-4" />,
                                                            selected:
                                                                "border-emerald-400 bg-emerald-500/35 text-emerald-200 shadow-[0_0_0_1px_rgba(52,211,153,0.5),0_8px_24px_rgba(6,78,59,0.5)] ring-2 ring-emerald-400/80 ring-offset-2 ring-offset-card scale-[1.02]",
                                                            idle: "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-500/55 hover:border-emerald-500/40 hover:text-emerald-400/80",
                                                        },
                                                        {
                                                            value: "NON_VEG" as const,
                                                            label: "Non-Veg",
                                                            icon: <Beef className="w-4 h-4" />,
                                                            selected:
                                                                "border-red-400 bg-red-500/35 text-red-200 shadow-[0_0_0_1px_rgba(248,113,113,0.5),0_8px_24px_rgba(127,29,29,0.45)] ring-2 ring-red-400/80 ring-offset-2 ring-offset-card scale-[1.02]",
                                                            idle: "border-red-500/20 bg-red-500/[0.06] text-red-500/55 hover:border-red-500/40 hover:text-red-400/80",
                                                        },
                                                        {
                                                            value: "EGGITARIAN" as const,
                                                            label: "Egg",
                                                            icon: <Egg className="w-4 h-4" />,
                                                            selected:
                                                                "border-amber-400 bg-amber-500/35 text-amber-200 shadow-[0_0_0_1px_rgba(251,191,36,0.5),0_8px_24px_rgba(120,53,15,0.45)] ring-2 ring-amber-400/80 ring-offset-2 ring-offset-card scale-[1.02]",
                                                            idle: "border-amber-500/20 bg-amber-500/[0.06] text-amber-500/55 hover:border-amber-500/40 hover:text-amber-400/80",
                                                        },
                                                    ] as const
                                                ).map((opt) => {
                                                    const selected = itemForm.dietaryPreference === opt.value;
                                                    return (
                                                        <button
                                                            key={opt.value}
                                                            type="button"
                                                            aria-pressed={selected}
                                                            onClick={() => setItemForm({ ...itemForm, dietaryPreference: opt.value })}
                                                            className={cn(
                                                                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-200",
                                                                selected ? opt.selected : opt.idle,
                                                            )}
                                                        >
                                                            {selected && (
                                                                <Check className="w-4 h-4 shrink-0 stroke-[3] opacity-95" aria-hidden />
                                                            )}
                                                            {opt.icon}
                                                            {opt.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions - full width footer */}
                                <div className="flex gap-3 px-4 sm:px-6 pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:pb-6 pt-4 sm:pt-5 border-t border-white/10 shrink-0 bg-card">
                                    <Button type="button" variant="outline" className="flex-1 h-11 rounded-xl" onClick={closeItemModal}>
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        loading={saving}
                                        disabled={uploading}
                                        className="flex-1 h-11 rounded-xl shadow-lg shadow-primary/20"
                                    >
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showBulkImportModal && (
                    <div
                        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md overflow-y-auto py-0 sm:py-8 pb-[env(safe-area-inset-bottom,0px)]"
                        onClick={closeBulkImportModal}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 8 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-2xl sm:my-auto bg-card border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl shadow-black/40 overflow-hidden max-h-[95dvh] sm:max-h-[min(90vh,720px)] flex flex-col"
                        >
                            <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent shrink-0">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <FileJson2 className="w-5 h-5 text-primary shrink-0" />
                                        <h3 className="text-lg font-semibold text-foreground tracking-tight truncate">
                                            Import from JSON (bulk)
                                        </h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={closeBulkImportModal}
                                        className="p-2 -m-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors shrink-0"
                                        aria-label="Close"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 space-y-3 overflow-y-auto flex-1 min-h-0">
                                <p className="text-xs text-muted-foreground">
                                    Paste JSON or choose a file. Each row needs <code className="text-foreground">name</code>,{" "}
                                    <code className="text-foreground">price</code>, and either{" "}
                                    <code className="text-foreground">categoryName</code> (auto-creates category if new) or{" "}
                                    <code className="text-foreground">categoryId</code>. Optional:{" "}
                                    <code className="text-foreground">description</code>, <code className="text-foreground">imageUrl</code>,{" "}
                                    <code className="text-foreground">dietaryPreference</code> (VEG | NON_VEG | EGGITARIAN | NONE),{" "}
                                    <code className="text-foreground">available</code>. Max 500 items per import. Category names are
                                    case-sensitive.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="text-xs"
                                        onClick={() => {
                                            const blob = new Blob([SAMPLE_BULK_JSON], { type: "application/json" });
                                            const a = document.createElement("a");
                                            a.href = URL.createObjectURL(blob);
                                            a.download = "dreamcanvas-menu-sample.json";
                                            a.click();
                                            URL.revokeObjectURL(a.href);
                                        }}
                                    >
                                        <Download className="w-3.5 h-3.5 mr-1.5" />
                                        Sample JSON
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="text-xs"
                                        onClick={() => bulkFileInputRef.current?.click()}
                                    >
                                        <Upload className="w-3.5 h-3.5 mr-1.5" />
                                        Choose file
                                    </Button>
                                    <input
                                        ref={bulkFileInputRef}
                                        type="file"
                                        accept="application/json,.json"
                                        className="hidden"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            e.target.value = "";
                                            if (!f) return;
                                            const r = new FileReader();
                                            r.onload = () => {
                                                if (typeof r.result === "string") setBulkJsonText(r.result);
                                            };
                                            r.readAsText(f);
                                        }}
                                    />
                                </div>

                                <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                        <Sparkles className="w-4 h-4 text-primary shrink-0" aria-hidden />
                                        Scan menu from a photo
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        Upload a clear photo of your printed menu. Google Gemini turns it into JSON below — always
                                        review prices and names before importing. Requires{" "}
                                        <code className="text-foreground">GEMINI_API_KEY</code> on your API server. A large or busy
                                        photo can take <span className="text-foreground/90">30–90 seconds</span>; keep this tab open
                                        until it finishes.
                                    </p>
                                    <input
                                        ref={bulkMenuPhotoInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        className="hidden"
                                        disabled={extractingMenuPhoto || bulkImporting}
                                        onChange={handleMenuPhotoForExtraction}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="text-xs w-full sm:w-auto"
                                        disabled={extractingMenuPhoto || bulkImporting}
                                        loading={extractingMenuPhoto}
                                        onClick={() => bulkMenuPhotoInputRef.current?.click()}
                                    >
                                        <Sparkles className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                                        {extractingMenuPhoto ? "Scanning…" : "Choose menu photo (AI)"}
                                    </Button>
                                </div>

                                <textarea
                                    value={bulkJsonText}
                                    onChange={(e) => setBulkJsonText(e.target.value)}
                                    placeholder='{ "items": [ { "name": "...", "price": 99, "categoryName": "..." } ] }'
                                    className="w-full min-h-[200px] rounded-xl border border-border bg-secondary/30 px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                                    spellCheck={false}
                                />
                                {bulkImportError && (
                                    <p className="text-sm text-destructive whitespace-pre-wrap" role="alert">
                                        {bulkImportError}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-3 px-4 sm:px-6 pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:pb-6 pt-2 border-t border-border/60 shrink-0">
                                <Button type="button" variant="outline" className="flex-1" onClick={closeBulkImportModal}>
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    className="flex-1"
                                    disabled={bulkImporting || extractingMenuPhoto || !bulkJsonText.trim()}
                                    onClick={async () => {
                                        setBulkImportError(null);
                                        let parsed: unknown;
                                        try {
                                            parsed = JSON.parse(bulkJsonText);
                                        } catch {
                                            setBulkImportError("Invalid JSON — check commas and quotes.");
                                            return;
                                        }
                                        if (
                                            typeof parsed !== "object" ||
                                            parsed === null ||
                                            !Array.isArray((parsed as { items?: unknown }).items)
                                        ) {
                                            setBulkImportError('JSON must be an object with an "items" array.');
                                            return;
                                        }
                                        const bulkItems = (parsed as { items: unknown[] }).items;
                                        if (bulkItems.length === 0) {
                                            setBulkImportError("items array is empty.");
                                            return;
                                        }
                                        setBulkImporting(true);
                                        try {
                                            const result = await api.bulkImportMenuItems({
                                                items: bulkItems as BulkMenuImportRow[],
                                            });
                                            await invalidateMenuCache();
                                            setBulkJsonText("");
                                            closeBulkImportModal();
                                            const itemLabel = `${result.created} item${result.created === 1 ? "" : "s"}`;
                                            const catNote =
                                                result.categoriesCreated && result.categoriesCreated > 0
                                                    ? `${result.categoriesCreated} new categor${result.categoriesCreated === 1 ? "y" : "ies"} created.`
                                                    : undefined;
                                            toast.success(`Imported ${itemLabel}`, {
                                                description: catNote,
                                                duration: 8000,
                                                action: {
                                                    label: "View menu",
                                                    onClick: () => {
                                                        setActiveTab("items");
                                                        window.scrollTo({ top: 0, behavior: "smooth" });
                                                    },
                                                },
                                            });
                                        } catch (err) {
                                            setBulkImportError(err instanceof Error ? err.message : "Import failed");
                                        } finally {
                                            setBulkImporting(false);
                                        }
                                    }}
                                >
                                    {bulkImporting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Importing…
                                        </>
                                    ) : (
                                        <>
                                            <FileJson2 className="w-4 h-4 mr-2" />
                                            Import items
                                        </>
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Category modal */}
            <AnimatePresence>
                {showCatModal && (
                    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm pb-[env(safe-area-inset-bottom,0px)]" onClick={closeCatModal}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg max-h-[90dvh] overflow-y-auto bg-card border border-border rounded-t-2xl sm:rounded-xl shadow-2xl">
                            <div className="flex justify-between items-center p-5 border-b border-border bg-muted/20">
                                <h3 className="font-semibold text-foreground">New Category</h3>
                                <button type="button" onClick={closeCatModal}><X className="w-5 h-5 text-muted-foreground" /></button>
                            </div>
                            <form onSubmit={saveCategory} className="p-6 space-y-4">
                                <Input placeholder="Category Name" value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} required />
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Category icon</label>
                                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 p-3 rounded-xl bg-secondary/40 border border-border max-h-[240px] overflow-y-auto">
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

            {/* Delete confirmation — type "delete" to proceed */}
            <AnimatePresence>
                {deleteConfirm && (
                    <div
                        className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)]"
                        onClick={() => {
                            if (!deleting) closeDeleteModal();
                        }}
                        role="presentation"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 8 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl shadow-black/40 max-h-[90dvh] overflow-y-auto"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="delete-confirm-title"
                            aria-describedby="delete-confirm-desc"
                        >
                            <div className="px-6 pt-6 pb-4 border-b border-border bg-destructive/5">
                                <div className="flex items-start gap-3">
                                    <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                                        <AlertTriangle className="h-5 w-5" aria-hidden />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 id="delete-confirm-title" className="text-lg font-semibold text-foreground">
                                            {deleteConfirm.type === "item" ? "Delete menu item?" : "Delete category?"}
                                        </h3>
                                        <p id="delete-confirm-desc" className="mt-1 text-sm text-muted-foreground">
                                            {deleteConfirm.type === "item" ? (
                                                <>
                                                    <span className="font-medium text-foreground">&ldquo;{deleteConfirm.name}&rdquo;</span> will be
                                                    removed from your menu. This cannot be undone.
                                                </>
                                            ) : (
                                                <>
                                                    <span className="font-medium text-foreground">&ldquo;{deleteConfirm.name}&rdquo;</span> and{" "}
                                                    <strong className="text-foreground">all items in this category</strong> will be permanently
                                                    removed. This cannot be undone.
                                                </>
                                            )}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={closeDeleteModal}
                                        disabled={deleting}
                                        className="shrink-0 p-2 -m-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-50"
                                        aria-label="Close"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label htmlFor="delete-confirm-input" className="text-sm font-medium text-foreground block mb-1.5">
                                        Type <span className="font-mono text-destructive">{DELETE_CONFIRM_WORD}</span> to confirm
                                    </label>
                                    <Input
                                        id="delete-confirm-input"
                                        autoComplete="off"
                                        autoFocus
                                        placeholder={DELETE_CONFIRM_WORD}
                                        value={deleteInput}
                                        onChange={(e) => {
                                            setDeleteInput(e.target.value);
                                            setDeleteError(null);
                                        }}
                                        disabled={deleting}
                                        className={cn(
                                            "h-11",
                                            deleteInput.length > 0 &&
                                                !deletePhraseMatches &&
                                                "border-destructive/50 focus-visible:ring-destructive/30",
                                            deletePhraseMatches && "border-emerald-500/50 focus-visible:ring-emerald-500/30",
                                        )}
                                    />
                                </div>
                                {deleteError && (
                                    <p className="text-sm text-destructive" role="alert">
                                        {deleteError}
                                    </p>
                                )}
                                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-1">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1 h-11 min-h-11"
                                        onClick={closeDeleteModal}
                                        disabled={deleting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        className="flex-1 h-11 min-h-11"
                                        loading={deleting}
                                        disabled={!deletePhraseMatches || deleting}
                                        onClick={() => void confirmDelete()}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
