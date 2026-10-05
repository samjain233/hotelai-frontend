"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { BulkMenuImportRow, MenuItem, MenuTag, type MenuCategory } from "@/lib/types";
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
    Flame,
    Wine,
    UtensilsCrossed,
    ChevronDown,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

function toggleNumberList(list: number[], id: number): number[] {
    return list.includes(id)
        ? list.filter((value) => value !== id)
        : [...list, id];
}

/** ISO weekday 1 = Monday … 7 = Sunday (matches backend category schedule). */
const ISO_WEEKDAY_OPTIONS: { iso: number; label: string }[] = [
    { iso: 1, label: "Mon" },
    { iso: 2, label: "Tue" },
    { iso: 3, label: "Wed" },
    { iso: 4, label: "Thu" },
    { iso: 5, label: "Fri" },
    { iso: 6, label: "Sat" },
    { iso: 7, label: "Sun" },
];

function toggleIsoDay(list: number[], day: number): number[] {
    return list.includes(day) ? list.filter((d) => d !== day) : [...list, day].sort((a, b) => a - b);
}

const ITEM_LABEL = "mb-1.5 block text-sm font-medium text-foreground";
const ITEM_FIELD = "h-11 rounded-xl border-border bg-background shadow-none focus:border-brand/60 focus:ring-brand/40";

function formatMenuPrice(price: number | string) {
    const n = typeof price === "number" ? price : parseFloat(String(price ?? 0)) || 0;
    const hasDecimals = n % 1 !== 0;
    return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: hasDecimals ? 2 : 0, maximumFractionDigits: 2 })}`;
}

function DietMark({ preference }: { preference: MenuItem["dietaryPreference"] }) {
    if (!preference || preference === "NONE") return null;
    const tone = preference === "VEG" ? "text-emerald-600" : preference === "NON_VEG" ? "text-red-600" : "text-amber-500";
    const label = preference === "VEG" ? "Veg" : preference === "NON_VEG" ? "Non-veg" : "Contains egg";
    return (
        <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded border-2 border-current bg-white", tone)} title={label}>
            <span className="h-2 w-2 rounded-full bg-current" />
            <span className="sr-only">{label}</span>
        </span>
    );
}

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
/** Max size for Gemini menu photo (base64 request body). */
const MAX_MENU_PHOTO_BYTES = 8 * 1024 * 1024;
/** Matches the API. Gemini bills 768px tiles; 1536px stays inside four tiles. */
const MENU_SCAN_MAX_EDGE = 1536;
const MENU_SCAN_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"]);

function readBlobAsDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === "string") resolve(reader.result);
            else reject(new Error("Could not read the image."));
        };
        reader.onerror = () => reject(new Error("Could not read the file."));
        reader.readAsDataURL(blob);
    });
}

function parseImageDataUrl(dataUrl: string): { mimeType: string; imageBase64: string } | null {
    const match = /^data:([^;]+);base64,([\s\S]+)$/.exec(dataUrl);
    if (!match) return null;
    const declared = match[1].split(";")[0].trim().toLowerCase();
    return { mimeType: declared === "image/jpg" ? "image/jpeg" : declared, imageBase64: match[2] };
}

/** Draw onto a small canvas so phones never allocate a full-resolution canvas. */
async function shrinkMenuPhoto(file: File): Promise<Blob> {
    const bitmap = await createImageBitmap(file);
    try {
        const longest = Math.max(bitmap.width, bitmap.height);
        const scale = longest > MENU_SCAN_MAX_EDGE ? MENU_SCAN_MAX_EDGE / longest : 1;
        const width = Math.max(1, Math.round(bitmap.width * scale));
        const height = Math.max(1, Math.round(bitmap.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not prepare the image.");
        ctx.drawImage(bitmap, 0, 0, width, height);
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
        if (!blob) throw new Error("Could not prepare the image.");
        return blob;
    } finally {
        bitmap.close();
    }
}

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
    const [tagsLoading, setTagsLoading] = useState(false);
    const loading = categoriesLoading || itemsLoading || tagsLoading;
    const [tags, setTags] = useState<MenuTag[]>([]);
    const allergenTags = tags.filter((tag) => tag.type === "ALLERGEN");
    const dietaryTags = tags.filter((tag) => tag.type === "DIETARY");
    const [tagModalOpen, setTagModalOpen] = useState(false);
    const [editingTag, setEditingTag] = useState<MenuTag | null>(null);
    const [tagName, setTagName] = useState("");
    const [tagType, setTagType] = useState<"ALLERGEN" | "DIETARY">("ALLERGEN");
    const [tagSaving, setTagSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<"items" | "categories">("items");
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [showItemDetails, setShowItemDetails] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [showItemModal, setShowItemModal] = useState(false);
    const [showCatModal, setShowCatModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [itemForm, setItemForm] = useState({
        name: "",
        description: "",
        price: "",
        categoryId: "",
        imageUrl: "",
        dietaryPreference: "NONE",
        available: true,
        spiceLevel: "NONE" as "NONE" | "MILD" | "MEDIUM" | "HOT",
        allergenTagIds: [] as number[],
        dietaryTagIds: [] as number[],
        calories: "",
        portionLabel: "",
        chefRecommended: false,
        containsAlcohol: false,
    });
    const [catForm, setCatForm] = useState({
        name: "",
        icon: "",
        serveTimeStart: "",
        serveTimeEnd: "",
        serveDaysOfWeek: [] as number[],
    });
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
        type: "item" | "category" | "tag";
        id: string;
        name: string;
    } | null>(null);
    const [deleteInput, setDeleteInput] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    /** When true, next successful category create selects that category in the item form */
    const selectNewCategoryInItemForm = useRef(false);

    const deletePhraseMatches = deleteInput.trim().toLowerCase() === DELETE_CONFIRM_WORD;

        useEffect(() => {
        async function loadTags() {
            setTagsLoading(true);

            try {
                const result = await api.getTags();
                console.log("🔥 TAGS FROM /tags:", result);
                setTags(result);
            } catch (err) {
                console.error("Failed to load menu tags:", err);
                toast.error("Failed to load allergens and dietary tags");
            } finally {
                setTagsLoading(false);
            }
        }

        void loadTags();
    }, []);
    
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
            } else if (deleteConfirm.type === "category") {
                await api.deleteCategory(deleteConfirm.id);
            } else {
                await api.deleteTag(Number(deleteConfirm.id));

                setTags((prev) =>
                    prev.filter(
                        (tag) => String(tag.id) !== deleteConfirm.id,
                    ),
                );
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
            spiceLevel: "NONE",
            allergenTagIds: [],
            dietaryTagIds: [],
            calories: "",
            portionLabel: "",
            chefRecommended: false,
            containsAlcohol: false,
        });
        setShowItemDetails(false);
        setShowItemModal(true);
    }

    function openCreateTag(type: "ALLERGEN" | "DIETARY") {
        setEditingTag(null);
        setTagName("");
        setTagType(type);
        setTagModalOpen(true);
    }

    function openEditTag(tag: MenuTag) {
        if (!tag.hotelId) {
            return;
        }

        setEditingTag(tag);
        setTagName(tag.name);
        setTagType(tag.type);
        setTagModalOpen(true);
    }

    async function saveTag() {
        const name = tagName.trim();

        if (!name) {
            toast.error("Tag name is required");
            return;
        }

        setTagSaving(true);

        try {
            if (editingTag) {
                const updated = await api.updateTag(editingTag.id, {
                    name,
                });

                setTags((prev) =>
                    prev.map((tag) =>
                        tag.id === updated.id ? updated : tag,
                    ),
                );

                toast.success("Tag updated");
            } else {
                const created = await api.createTag({
                    name,
                    type: tagType,
                });

                setTags((prev) => [...prev, created]);

                toast.success("Tag created");
            }

            setTagModalOpen(false);
        } catch (err) {
            console.error("Failed to save tag:", err);
            toast.error("Failed to save tag");
        } finally {
            setTagSaving(false);
        }
    }

    function openDeleteTagModal(tag: MenuTag) {
        if (!tag.hotelId) {
            return;
        }

        setDeleteConfirm({
            type: "tag",
            id: String(tag.id),
            name: tag.name,
        });

        setDeleteInput("");
        setDeleteError(null);
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
            available: item.available ?? true,
            spiceLevel: item.spiceLevel ?? "NONE",
            allergenTagIds: (item.allergens ?? []).map((tag) => tag.id),
            dietaryTagIds: (item.dietaryTags ?? []).map((tag) => tag.id),
            calories: item.calories != null && item.calories > 0 ? String(item.calories) : "",
            portionLabel: item.portionLabel ?? "",
            chefRecommended: Boolean(item.chefRecommended),
            containsAlcohol: Boolean(item.containsAlcohol),
        });
        setShowItemDetails(
            (item.spiceLevel ?? "NONE") !== "NONE" ||
                (item.allergens?.length ?? 0) > 0 ||
                (item.dietaryTags?.length ?? 0) > 0 ||
                (item.calories ?? 0) > 0 ||
                Boolean(item.portionLabel) ||
                Boolean(item.chefRecommended) ||
                Boolean(item.containsAlcohol),
        );
        setShowItemModal(true);
    }
    async function saveItem(e: React.FormEvent) {
        e.preventDefault();
        if (uploading) return;
        setSaving(true);
        try {
            const calRaw = itemForm.calories.trim();
            let calories: number | null | undefined = undefined;
            if (calRaw !== "") {
                const n = Number(calRaw);
                if (Number.isNaN(n) || n < 0 || n > 20000) {
                    alert("Calories must be a number between 0 and 20000, or leave empty.");
                    setSaving(false);
                    return;
                }
                calories = n;
            } else if (editingItem) {
                calories = null;
            }
            const data = {
                name: itemForm.name,
                description: itemForm.description || undefined,
                price: Number(itemForm.price),
                categoryId: itemForm.categoryId,
                imageUrl: itemForm.imageUrl || undefined,
                dietaryPreference: itemForm.dietaryPreference,
                available: itemForm.available,
                spiceLevel: itemForm.spiceLevel,
                allergenTagIds: itemForm.allergenTagIds,
                dietaryTagIds: itemForm.dietaryTagIds,
                ...(calories !== undefined ? { calories } : {}),
                portionLabel: itemForm.portionLabel.trim() || (editingItem ? null : undefined),
                chefRecommended: itemForm.chefRecommended,
                containsAlcohol: itemForm.containsAlcohol,
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
            const payload = {
                name: catForm.name,
                icon: catForm.icon || undefined,
                serveTimeStart: catForm.serveTimeStart.trim()
                    ? catForm.serveTimeStart.trim()
                    : editingCategory
                      ? null
                      : undefined,
                serveTimeEnd: catForm.serveTimeEnd.trim()
                    ? catForm.serveTimeEnd.trim()
                    : editingCategory
                      ? null
                      : undefined,
            };
            if (editingCategory) {
                await api.updateCategory(editingCategory.id, {
                    ...payload,
                    serveDaysOfWeek: catForm.serveDaysOfWeek,
                });
                toast.success("Category updated");
            } else {
                const created = await api.createCategory({
                    ...payload,
                    serveDaysOfWeek: catForm.serveDaysOfWeek.length > 0 ? catForm.serveDaysOfWeek : undefined,
                });
                toast.success("Category created successfully");
                if (selectNewCategoryInItemForm.current) {
                    selectNewCategoryInItemForm.current = false;
                    setItemForm((prev) => ({ ...prev, categoryId: created.id }));
                }
            }
            setShowCatModal(false);
            setEditingCategory(null);
            setCatForm({ name: "", icon: "", serveTimeStart: "", serveTimeEnd: "", serveDaysOfWeek: [] });
            invalidateMenuCache();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    }

    function closeCatModal() {
        selectNewCategoryInItemForm.current = false;
        setShowCatModal(false);
        setEditingCategory(null);
        setCatForm({ name: "", icon: "", serveTimeStart: "", serveTimeEnd: "", serveDaysOfWeek: [] });
    }

    function openEditCategory(cat: MenuCategory) {
        setEditingCategory(cat);
        setCatForm({
            name: cat.name,
            icon: cat.icon ?? "",
            serveTimeStart: cat.serveTimeStart?.trim() ?? "",
            serveTimeEnd: cat.serveTimeEnd?.trim() ?? "",
            serveDaysOfWeek: [...(cat.serveDaysOfWeek ?? [])],
        });
        setShowCatModal(true);
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
        if (file.type && !MENU_SCAN_MIME.has(file.type.toLowerCase())) {
            toast.error("Use a JPEG, PNG, WebP, or GIF image.");
            return;
        }

        void (async () => {
            setBulkImportError(null);
            setExtractingMenuPhoto(true);
            try {
                let source: Blob = file;
                try {
                    source = await shrinkMenuPhoto(file);
                } catch {
                    source = file;
                }
                const parsed = parseImageDataUrl(await readBlobAsDataUrl(source));
                if (!parsed || !MENU_SCAN_MIME.has(parsed.mimeType)) {
                    toast.error("Could not read the image.");
                    return;
                }
                const { items } = await api.extractMenuFromImage({
                    imageBase64: parsed.imageBase64,
                    mimeType: parsed.mimeType,
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
                const raw = err instanceof Error ? err.message : "Menu scan failed";
                const msg = /too many requests/i.test(raw)
                    ? "Menu scanning is limited to 10 photos every 15 minutes. Wait a few minutes and try again."
                    : raw;
                setBulkImportError(msg);
                toast.error(msg);
            } finally {
                setExtractingMenuPhoto(false);
            }
        })();
    }

    async function toggleAvailable(item: MenuItem) {
        const next = item.available === false;
        setTogglingId(item.id);
        try {
            await api.updateMenuItem(item.id, { available: next });
            await invalidateMenuCache();
            toast.success(next ? `${item.name} is back on the menu` : `${item.name} marked sold out`);
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Could not update availability");
        } finally {
            setTogglingId(null);
        }
    }

    const query = search.trim().toLowerCase();
    const categoryName = new Map(categories.map((c) => [c.id, c.name]));
    const soldOutCount = items.filter((i) => i.available === false).length;
    const filteredItems = items.filter(
        (i) =>
            (categoryFilter === "all" || i.categoryId === categoryFilter) &&
            (!query || i.name.toLowerCase().includes(query) || i.description?.toLowerCase().includes(query)),
    );

    function openNewCategory() {
        selectNewCategoryInItemForm.current = false;
        setEditingCategory(null);
        setCatForm({ name: "", icon: "", serveTimeStart: "", serveTimeEnd: "", serveDaysOfWeek: [] });
        setShowCatModal(true);
    }

    function openBulkImport() {
        setBulkImportError(null);
        setShowBulkImportModal(true);
    }

    if (loading) return <AdminPageSkeleton cardCount={9} />;

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-[env(safe-area-inset-bottom,0px)]">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">Menu</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {items.length} dish{items.length !== 1 ? "es" : ""} across {categories.length} categor{categories.length !== 1 ? "ies" : "y"}
                        {soldOutCount > 0 ? ` · ${soldOutCount} sold out` : ""}
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                    <Button variant="ghost" className="h-10 justify-center text-muted-foreground hover:text-foreground" onClick={openBulkImport}>
                        <FileJson2 className="mr-2 h-4 w-4 shrink-0" /> Import JSON
                    </Button>
                    <Button variant="outline" className="h-10 justify-center border-border hover:bg-secondary" onClick={openNewCategory}>
                        <FolderOpen className="mr-2 h-4 w-4 shrink-0" /> New category
                    </Button>
                    <Button className="col-span-2 h-10 justify-center sm:col-span-1" onClick={openNewItem}>
                        <Plus className="mr-2 h-4 w-4 shrink-0" /> Add item
                    </Button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div role="tablist" aria-label="Menu view" className="inline-flex w-full rounded-xl border border-border bg-panel p-1 sm:w-auto">
                        {(
                            [
                                { id: "items", label: "Dishes", count: items.length },
                                { id: "categories", label: "Categories", count: categories.length },
                            ] as const
                        ).map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                role="tab"
                                aria-selected={activeTab === tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex h-9 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors sm:flex-none",
                                    activeTab === tab.id
                                        ? "bg-secondary text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground",
                                )}
                            >
                                {tab.label}
                                <span
                                    className={cn(
                                        "rounded-md px-1.5 py-0.5 text-[11px] tabular-nums",
                                        activeTab === tab.id ? "bg-background text-foreground" : "bg-secondary/60 text-muted-foreground",
                                    )}
                                >
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {activeTab === "items" && (
                        <div className="relative w-full sm:w-72">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="search"
                                enterKeyHint="search"
                                placeholder="Search dishes"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-10 w-full rounded-xl border border-border bg-panel pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
                            />
                        </div>
                    )}
                </div>

                {activeTab === "items" && categories.length > 0 && (
                    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {[{ id: "all", name: "All", count: items.length }, ...categories.map((c) => ({ id: c.id, name: c.name, count: c._count?.items ?? 0 }))].map(
                            (chip) => (
                                <button
                                    key={chip.id}
                                    type="button"
                                    onClick={() => setCategoryFilter(chip.id)}
                                    aria-pressed={categoryFilter === chip.id}
                                    className={cn(
                                        "flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors",
                                        categoryFilter === chip.id
                                            ? "border-brand/60 bg-brand/10 text-foreground"
                                            : "border-border bg-panel text-muted-foreground hover:text-foreground",
                                    )}
                                >
                                    {chip.name}
                                    <span className="tabular-nums opacity-70">{chip.count}</span>
                                </button>
                            ),
                        )}
                    </div>
                )}
            </div>

            <AnimatePresence mode="wait">
                {activeTab === "items" ? (
                    <motion.div
                        key="items"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                    >
                        {filteredItems.length === 0 && (
                            <EmptyState
                                className="col-span-full"
                                icon={items.length === 0 ? UtensilsCrossed : Search}
                                title={items.length === 0 ? "No dishes yet" : "No dishes match"}
                                description={
                                    items.length === 0
                                        ? "Add your first dish, or import a whole menu from JSON. Guests see it as soon as it is available."
                                        : query
                                          ? `Nothing found for "${search.trim()}" in this view.`
                                          : "This category has no dishes yet."
                                }
                                action={
                                    items.length === 0 ? (
                                        <>
                                            <Button className="h-10" onClick={openNewItem}>
                                                <Plus className="mr-2 h-4 w-4" /> Add item
                                            </Button>
                                            <Button variant="outline" className="h-10" onClick={openBulkImport}>
                                                <FileJson2 className="mr-2 h-4 w-4" /> Import JSON
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            className="h-10"
                                            onClick={() => {
                                                setSearch("");
                                                setCategoryFilter("all");
                                            }}
                                        >
                                            Show all dishes
                                        </Button>
                                    )
                                }
                            />
                        )}
                        {filteredItems.map((item) => {
                            const soldOut = item.available === false;
                            return (
                                <article
                                    key={item.id}
                                    className={cn(
                                        "group flex flex-col overflow-hidden rounded-2xl border border-border bg-panel transition-colors hover:border-foreground/20",
                                        soldOut && "opacity-75",
                                    )}
                                >
                                    <button
                                        type="button"
                                        onClick={() => openEditItem(item)}
                                        className="relative block aspect-[16/10] w-full cursor-pointer overflow-hidden bg-secondary"
                                        aria-label={`Edit ${item.name}`}
                                    >
                                        {item.imageUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={item.imageUrl}
                                                alt=""
                                                loading="lazy"
                                                className={cn(
                                                    "h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]",
                                                    soldOut && "grayscale",
                                                )}
                                            />
                                        ) : (
                                            <span className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-muted-foreground">
                                                <ImageIcon className="h-6 w-6 opacity-40" />
                                                <span className="text-xs">Add a photo</span>
                                            </span>
                                        )}
                                        <span className="absolute left-3 top-3 flex items-center gap-1.5">
                                            <DietMark preference={item.dietaryPreference} />
                                            {item.chefRecommended && (
                                                <span className="inline-flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                                                    <Sparkles className="h-3 w-3 text-brand" /> Chef&apos;s pick
                                                </span>
                                            )}
                                        </span>
                                        {soldOut && (
                                            <span className="absolute right-3 top-3 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                                                Sold out
                                            </span>
                                        )}
                                    </button>

                                    <div className="flex flex-1 flex-col p-4">
                                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                                            {categoryName.get(item.categoryId) ?? "Uncategorised"}
                                        </p>
                                        <div className="mt-1 flex items-start justify-between gap-3">
                                            <h3 className="line-clamp-2 font-semibold leading-snug text-foreground">{item.name}</h3>
                                            <span className="shrink-0 font-semibold tabular-nums text-foreground">{formatMenuPrice(item.price)}</span>
                                        </div>
                                        {item.description ? (
                                            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                                        ) : (
                                            <p className="mt-1.5 text-sm italic text-muted-foreground/70">No description</p>
                                        )}

                                        <div className="min-h-4 flex-1" />
                                        <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
                                            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground">
                                                <button
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={!soldOut}
                                                    aria-label={soldOut ? `Put ${item.name} back on the menu` : `Mark ${item.name} sold out`}
                                                    disabled={togglingId === item.id}
                                                    onClick={() => toggleAvailable(item)}
                                                    className={cn(
                                                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-wait disabled:opacity-60",
                                                        soldOut ? "bg-secondary" : "bg-emerald-500",
                                                    )}
                                                >
                                                    <span
                                                        className={cn(
                                                            "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
                                                            soldOut ? "translate-x-0.5" : "translate-x-[18px]",
                                                        )}
                                                    />
                                                </button>
                                                <span className={soldOut ? "" : "text-emerald-600 dark:text-emerald-400"}>
                                                    {soldOut ? "Sold out" : "Available"}
                                                </span>
                                            </label>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditItem(item)}
                                                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                                                    aria-label={`Edit ${item.name}`}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openDeleteItemModal(item)}
                                                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                                                    aria-label={`Delete ${item.name}`}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </motion.div>
                ) : (
                    <motion.div
                        key="categories"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
                    >
                        {categories.length === 0 && (
                            <EmptyState
                                className="col-span-full"
                                icon={FolderOpen}
                                title="No categories yet"
                                description="Group dishes into sections like Starters, Mains or Drinks so guests can find them quickly."
                                action={
                                    <Button className="h-10" onClick={openNewCategory}>
                                        <Plus className="mr-2 h-4 w-4" /> New category
                                    </Button>
                                }
                            />
                        )}
                        {categories.map((cat) => {
                            const count = cat._count?.items ?? 0;
                            const hasSchedule = Boolean(
                                (cat.serveTimeStart && cat.serveTimeEnd) || (cat.serveDaysOfWeek && cat.serveDaysOfWeek.length > 0),
                            );
                            return (
                                <article key={cat.id} className="flex items-center gap-4 rounded-2xl border border-border bg-panel p-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
                                        {hasCategoryIcon(cat.icon) ? (
                                            <CategoryIconDisplay icon={cat.icon} size="lg" className="text-brand" />
                                        ) : (
                                            <FolderOpen className="h-5 w-5 text-muted-foreground" />
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCategoryFilter(cat.id);
                                            setActiveTab("items");
                                        }}
                                        className="min-w-0 flex-1 cursor-pointer text-left"
                                    >
                                        <h3 className="truncate font-semibold text-foreground">{cat.name}</h3>
                                        <p className="mt-0.5 text-sm text-muted-foreground">
                                            {count} dish{count !== 1 ? "es" : ""}
                                        </p>
                                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                            {hasSchedule
                                                ? `${cat.serveTimeStart && cat.serveTimeEnd ? `${cat.serveTimeStart}–${cat.serveTimeEnd}` : "All day"}${
                                                      cat.serveDaysOfWeek && cat.serveDaysOfWeek.length > 0
                                                          ? ` · ${cat.serveDaysOfWeek
                                                                .map((d) => ISO_WEEKDAY_OPTIONS.find((o) => o.iso === d)?.label ?? d)
                                                                .join(", ")}`
                                                          : ""
                                                  }`
                                                : "Served all day"}
                                        </p>
                                    </button>
                                    <div className="flex shrink-0 items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => openEditCategory(cat)}
                                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                                            aria-label={`Edit ${cat.name}`}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openDeleteCategoryModal(cat)}
                                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                                            aria-label={`Delete ${cat.name}`}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* New Item / Edit Item Modal */}
            <AnimatePresence>
                {showItemModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
                        onClick={() => closeItemModal()}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97, y: 10 }}
                            transition={{ duration: 0.18 }}
                            onClick={(e) => e.stopPropagation()}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="item-modal-title"
                            className="flex max-h-[100dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-border bg-panel shadow-2xl shadow-black/40 sm:my-auto sm:max-h-[min(92dvh,52rem)] sm:rounded-2xl"
                        >
                            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
                                <div className="min-w-0">
                                    <h3 id="item-modal-title" className="truncate text-lg font-semibold tracking-tight text-foreground">
                                        {editingItem ? `Edit ${editingItem.name}` : "Add a dish"}
                                    </h3>
                                    <p className="mt-0.5 text-sm text-muted-foreground">
                                        {editingItem ? "Changes show on the guest menu as soon as you save." : "Name, price and category are all you need to start."}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => closeItemModal()}
                                    className="-mr-2 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                                    aria-label="Close"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={saveItem} className="flex min-h-0 flex-1 flex-col">
                                <div className="min-h-0 flex-1 overflow-y-auto">
                                    <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-[260px_minmax(0,1fr)]">
                                        {/* Photo, availability, diet */}
                                        <div className="space-y-5 md:sticky md:top-0 md:self-start">
                                            <div>
                                                <p className={ITEM_LABEL}>Photo</p>
                                                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageUpload} />
                                                <div
                                                    role="button"
                                                    tabIndex={0}
                                                    aria-label={itemForm.imageUrl ? "Change photo" : "Upload photo"}
                                                    onKeyDown={(e) => {
                                                        if ((e.key === "Enter" || e.key === " ") && !uploading) {
                                                            e.preventDefault();
                                                            fileInputRef.current?.click();
                                                        }
                                                    }}
                                                    onDragOver={(e) => {
                                                        if (uploading) return;
                                                        e.preventDefault();
                                                        e.currentTarget.classList.add("!border-brand", "!bg-brand/10");
                                                    }}
                                                    onDragLeave={(e) => {
                                                        e.preventDefault();
                                                        e.currentTarget.classList.remove("!border-brand", "!bg-brand/10");
                                                    }}
                                                    onDrop={(e) => {
                                                        e.preventDefault();
                                                        e.currentTarget.classList.remove("!border-brand", "!bg-brand/10");
                                                        if (uploading) return;
                                                        const f = e.dataTransfer.files?.[0];
                                                        if (f) void processImageFile(f);
                                                    }}
                                                    onClick={() => !uploading && fileInputRef.current?.click()}
                                                    className={cn(
                                                        "group relative flex aspect-square w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
                                                        uploading ? "pointer-events-none cursor-wait" : "cursor-pointer",
                                                        itemForm.imageUrl
                                                            ? "border-transparent bg-secondary"
                                                            : "border-border bg-background hover:border-brand/60 hover:bg-brand/5",
                                                    )}
                                                >
                                                    {uploading && (
                                                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-background/85 px-6 backdrop-blur-sm">
                                                            <Loader2 className="h-7 w-7 animate-spin text-brand" aria-hidden />
                                                            <div className="h-1.5 w-full max-w-[180px] overflow-hidden rounded-full bg-secondary">
                                                                <div
                                                                    className="h-full rounded-full bg-brand transition-[width] duration-200 ease-out"
                                                                    style={{ width: `${Math.min(100, Math.max(uploadProgress, 2))}%` }}
                                                                />
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">
                                                                Uploading{uploadProgress > 0 ? ` ${uploadProgress}%` : "…"}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {itemForm.imageUrl ? (
                                                        <>
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img src={itemForm.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                                                            <span
                                                                className={cn(
                                                                    "absolute inset-x-3 bottom-3 rounded-lg bg-black/70 py-2 text-xs font-medium text-white backdrop-blur-sm transition-opacity",
                                                                    uploading ? "opacity-0" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
                                                                )}
                                                            >
                                                                Change photo
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-brand ring-1 ring-brand/25">
                                                                <Upload className="h-5 w-5" />
                                                            </span>
                                                            <span className="text-sm font-medium text-foreground">Upload a photo</span>
                                                            <span className="px-4 text-xs text-muted-foreground">Drag and drop, or click. JPEG, PNG or WebP up to 10 MB.</span>
                                                        </>
                                                    )}
                                                </div>
                                                {itemForm.imageUrl && !uploading && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setItemForm({ ...itemForm, imageUrl: "" })}
                                                        className="mt-2 cursor-pointer text-xs font-medium text-muted-foreground hover:text-red-500"
                                                    >
                                                        Remove photo
                                                    </button>
                                                )}
                                            </div>

                                            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3">
                                                <span className="min-w-0">
                                                    <span className="block text-sm font-medium text-foreground">
                                                        {itemForm.available ? "On the menu" : "Sold out"}
                                                    </span>
                                                    <span className="block text-xs text-muted-foreground">
                                                        {itemForm.available ? "Guests can order it" : "Shown, but guests can't order it"}
                                                    </span>
                                                </span>
                                                <button
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={itemForm.available}
                                                    aria-label={itemForm.available ? "Mark sold out" : "Put back on the menu"}
                                                    onClick={() => setItemForm((prev) => ({ ...prev, available: !prev.available }))}
                                                    className={cn(
                                                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
                                                        itemForm.available ? "bg-emerald-500" : "bg-secondary",
                                                    )}
                                                >
                                                    <span
                                                        className={cn(
                                                            "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
                                                            itemForm.available ? "translate-x-[22px]" : "translate-x-0.5",
                                                        )}
                                                    />
                                                </button>
                                            </label>

                                            <div>
                                                <p className={ITEM_LABEL}>Food type</p>
                                                <div role="radiogroup" aria-label="Food type" className="grid grid-cols-2 gap-2">
                                                    {(
                                                        [
                                                            { value: "VEG", label: "Veg", icon: <Leaf className="h-4 w-4" />, on: "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
                                                            { value: "NON_VEG", label: "Non-veg", icon: <Beef className="h-4 w-4" />, on: "border-red-500 bg-red-500/10 text-red-700 dark:text-red-300" },
                                                            { value: "EGGITARIAN", label: "Egg", icon: <Egg className="h-4 w-4" />, on: "border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-300" },
                                                            { value: "NONE", label: "Not set", icon: null, on: "border-foreground/40 bg-secondary text-foreground" },
                                                        ] as const
                                                    ).map((opt) => {
                                                        const selected = itemForm.dietaryPreference === opt.value;
                                                        return (
                                                            <button
                                                                key={opt.value}
                                                                type="button"
                                                                role="radio"
                                                                aria-checked={selected}
                                                                onClick={() => setItemForm({ ...itemForm, dietaryPreference: opt.value })}
                                                                className={cn(
                                                                    "flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
                                                                    selected ? opt.on : "border-border bg-background text-muted-foreground hover:text-foreground",
                                                                )}
                                                            >
                                                                {opt.icon}
                                                                {opt.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Basics + optional details */}
                                        <div className="min-w-0 space-y-5">
                                            <div>
                                                <label htmlFor="item-name" className={ITEM_LABEL}>
                                                    Dish name
                                                </label>
                                                <Input
                                                    id="item-name"
                                                    placeholder="e.g. Masala Dosa"
                                                    value={itemForm.name}
                                                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                                                    required
                                                    autoFocus={!editingItem}
                                                    className={ITEM_FIELD}
                                                />
                                            </div>

                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div>
                                                    <label htmlFor="item-price" className={ITEM_LABEL}>
                                                        Price
                                                    </label>
                                                    <div className="relative">
                                                        <span className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                                                        <Input
                                                            id="item-price"
                                                            type="number"
                                                            inputMode="decimal"
                                                            min="0"
                                                            step="0.01"
                                                            placeholder="250"
                                                            value={itemForm.price}
                                                            onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                                                            required
                                                            className={cn(ITEM_FIELD, "pl-8 tabular-nums")}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className={ITEM_LABEL}>Category</p>
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
                                                                setEditingCategory(null);
                                                                setCatForm({
                                                                    name: searchQuery.trim(),
                                                                    icon: "",
                                                                    serveTimeStart: "",
                                                                    serveTimeEnd: "",
                                                                    serveDaysOfWeek: [],
                                                                });
                                                                setShowCatModal(true);
                                                            },
                                                        }}
                                                        className="[&>button]:h-11 [&>button]:rounded-xl [&>button]:border-border [&>button]:bg-background"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                                                    <label htmlFor="item-description" className="text-sm font-medium text-foreground">
                                                        Description
                                                    </label>
                                                    <span className="text-xs tabular-nums text-muted-foreground">{itemForm.description.length} characters</span>
                                                </div>
                                                <textarea
                                                    id="item-description"
                                                    placeholder="What's in it, how it's cooked, what it's served with."
                                                    rows={4}
                                                    className="w-full resize-none rounded-xl border border-border bg-background px-3.5 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/40"
                                                    value={itemForm.description}
                                                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                                                />
                                                <p className="mt-1 text-xs text-muted-foreground">Guests see the first two lines in the menu list.</p>
                                            </div>

                                            <div className="rounded-xl border border-border">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowItemDetails((open) => !open)}
                                                    aria-expanded={showItemDetails}
                                                    className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left"
                                                >
                                                    <span className="min-w-0">
                                                        <span className="block text-sm font-medium text-foreground">More details</span>
                                                        <span className="block text-xs text-muted-foreground">
                                                            Spice, allergens, tags, calories. Shown when Menu design → Show extra dish details is on.
                                                        </span>
                                                    </span>
                                                    <ChevronDown
                                                        className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", showItemDetails && "rotate-180")}
                                                    />
                                                </button>

                                                {showItemDetails && (
                                                    <div className="space-y-5 border-t border-border px-4 py-4">
                                                        <div>
                                                            <p className={ITEM_LABEL}>Spice level</p>
                                                            <div className="inline-flex rounded-xl border border-border bg-background p-1">
                                                                {(
                                                                    [
                                                                        { value: "NONE", label: "None", flames: 0 },
                                                                        { value: "MILD", label: "Mild", flames: 1 },
                                                                        { value: "MEDIUM", label: "Medium", flames: 2 },
                                                                        { value: "HOT", label: "Hot", flames: 3 },
                                                                    ] as const
                                                                ).map((opt) => {
                                                                    const selected = itemForm.spiceLevel === opt.value;
                                                                    return (
                                                                        <button
                                                                            key={opt.value}
                                                                            type="button"
                                                                            aria-pressed={selected}
                                                                            onClick={() => setItemForm({ ...itemForm, spiceLevel: opt.value })}
                                                                            className={cn(
                                                                                "flex h-8 cursor-pointer items-center gap-1 rounded-lg px-3 text-xs font-medium transition-colors",
                                                                                selected ? "bg-secondary text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                                                                            )}
                                                                        >
                                                                            {Array.from({ length: opt.flames }).map((_, i) => (
                                                                                <Flame key={i} className={cn("h-3 w-3", selected ? "text-orange-500" : "")} />
                                                                            ))}
                                                                            <span className={opt.flames ? "ml-0.5" : ""}>{opt.label}</span>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>

                                                        {(
                                                            [
                                                                {
                                                                    type: "ALLERGEN",
                                                                    title: "Allergens",
                                                                    addLabel: "Add allergen",
                                                                    tags: allergenTags,
                                                                    selectedIds: itemForm.allergenTagIds,
                                                                    on: "border-rose-500/60 bg-rose-500/10 text-rose-700 dark:text-rose-300",
                                                                    toggle: (id: number) =>
                                                                        setItemForm({ ...itemForm, allergenTagIds: toggleNumberList(itemForm.allergenTagIds, id) }),
                                                                },
                                                                {
                                                                    type: "DIETARY",
                                                                    title: "Dietary tags",
                                                                    addLabel: "Add tag",
                                                                    tags: dietaryTags,
                                                                    selectedIds: itemForm.dietaryTagIds,
                                                                    on: "border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                                                                    toggle: (id: number) =>
                                                                        setItemForm({ ...itemForm, dietaryTagIds: toggleNumberList(itemForm.dietaryTagIds, id) }),
                                                                },
                                                            ] as const
                                                        ).map((group) => (
                                                            <div key={group.type}>
                                                                <p className={ITEM_LABEL}>
                                                                    {group.title}
                                                                    {group.selectedIds.length > 0 && (
                                                                        <span className="ml-1.5 font-normal text-muted-foreground">· {group.selectedIds.length} selected</span>
                                                                    )}
                                                                </p>
                                                                <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto pr-1 pt-1">
                                                                    {group.tags.map((tag) => {
                                                                        const on = group.selectedIds.includes(tag.id);
                                                                        const isCustom = Boolean(tag.hotelId);
                                                                        return (
                                                                            <div key={tag.id} className="group relative">
                                                                                <button
                                                                                    type="button"
                                                                                    aria-pressed={on}
                                                                                    onClick={() => group.toggle(tag.id)}
                                                                                    className={cn(
                                                                                        "flex h-8 cursor-pointer items-center gap-1 rounded-full border px-3 text-xs font-medium capitalize transition-colors",
                                                                                        on ? group.on : "border-border bg-background text-muted-foreground hover:text-foreground",
                                                                                    )}
                                                                                >
                                                                                    {on && <Check className="h-3 w-3" aria-hidden />}
                                                                                    {tag.name.replace(/_/g, " ").toLowerCase()}
                                                                                </button>
                                                                                {isCustom && (
                                                                                    <div className="absolute -right-1 -top-2 flex gap-1 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                openEditTag(tag);
                                                                                            }}
                                                                                            aria-label={`Edit ${tag.name}`}
                                                                                            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-border bg-panel text-muted-foreground shadow-sm hover:text-foreground"
                                                                                        >
                                                                                            <Edit2 className="h-3 w-3" />
                                                                                        </button>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                openDeleteTagModal(tag);
                                                                                            }}
                                                                                            aria-label={`Delete ${tag.name}`}
                                                                                            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-border bg-panel text-red-500 shadow-sm hover:bg-red-500 hover:text-white"
                                                                                        >
                                                                                            <Trash2 className="h-3 w-3" />
                                                                                        </button>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openCreateTag(group.type)}
                                                                        className="flex h-8 cursor-pointer items-center gap-1 rounded-full border border-dashed border-border px-3 text-xs font-medium text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                                                                    >
                                                                        <Plus className="h-3 w-3" /> {group.addLabel}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}

                                                        <div className="grid gap-4 sm:grid-cols-2">
                                                            <div>
                                                                <label className={ITEM_LABEL} htmlFor="item-calories">
                                                                    Calories
                                                                </label>
                                                                <div className="relative">
                                                                    <Input
                                                                        id="item-calories"
                                                                        inputMode="numeric"
                                                                        value={itemForm.calories}
                                                                        onChange={(e) => setItemForm({ ...itemForm, calories: e.target.value.replace(/\D/g, "") })}
                                                                        placeholder="420"
                                                                        className={cn(ITEM_FIELD, "pr-12 tabular-nums")}
                                                                    />
                                                                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">kcal</span>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className={ITEM_LABEL} htmlFor="item-portion">
                                                                    Portion
                                                                </label>
                                                                <Input
                                                                    id="item-portion"
                                                                    value={itemForm.portionLabel}
                                                                    onChange={(e) => setItemForm({ ...itemForm, portionLabel: e.target.value })}
                                                                    placeholder="Serves 2"
                                                                    maxLength={80}
                                                                    className={ITEM_FIELD}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="grid gap-2 sm:grid-cols-2">
                                                            {(
                                                                [
                                                                    {
                                                                        key: "chefRecommended",
                                                                        label: "Chef's pick",
                                                                        icon: <Sparkles className="h-4 w-4 text-brand" aria-hidden />,
                                                                    },
                                                                    {
                                                                        key: "containsAlcohol",
                                                                        label: "Contains alcohol",
                                                                        icon: <Wine className="h-4 w-4 text-muted-foreground" aria-hidden />,
                                                                    },
                                                                ] as const
                                                            ).map((flag) => (
                                                                <label
                                                                    key={flag.key}
                                                                    className={cn(
                                                                        "flex h-11 cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 text-sm text-foreground transition-colors",
                                                                        itemForm[flag.key] ? "border-brand/60 bg-brand/5" : "border-border bg-background",
                                                                    )}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={itemForm[flag.key]}
                                                                        onChange={(e) => setItemForm({ ...itemForm, [flag.key]: e.target.checked })}
                                                                        className="h-4 w-4 cursor-pointer rounded accent-[var(--color-brand)]"
                                                                    />
                                                                    {flag.icon}
                                                                    {flag.label}
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-panel px-5 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-4 sm:px-6">
                                    <Button type="button" variant="ghost" className="h-10 px-4" onClick={closeItemModal}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" loading={saving} disabled={uploading} className="h-10 min-w-[140px] px-5">
                                        {uploading ? "Uploading photo…" : editingItem ? "Save changes" : "Add dish"}
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
                                    <code className="text-foreground">available</code>. Optional:{" "}
                                    <code className="text-foreground">spiceLevel</code> (NONE | MILD | MEDIUM | HOT),{" "}
                                    <code className="text-foreground">allergenCodes</code> (array of codes like GLUTEN, MILK, PEANUTS),{" "}
                                    <code className="text-foreground">dietaryTags</code> (VEGAN, HALAL, JAIN, …),{" "}
                                    <code className="text-foreground">calories</code>, <code className="text-foreground">portionLabel</code>,{" "}
                                    <code className="text-foreground">chefRecommended</code>, <code className="text-foreground">containsAlcohol</code>.
                                    Max 500 items per import. Category names are case-sensitive.
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
                                        review prices and names before importing. Large photos are reduced automatically.
                                        You can scan up to 10 photos every 15 minutes.
                                        A large or busy photo can take <span className="text-foreground/90">30–90 seconds</span>; keep
                                        this tab open until it finishes.
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
                                <h3 className="font-semibold text-foreground">{editingCategory ? "Edit category" : "New category"}</h3>
                                <button type="button" onClick={closeCatModal}><X className="w-5 h-5 text-muted-foreground" /></button>
                            </div>
                            <form onSubmit={saveCategory} className="p-6 space-y-4">
                                <Input placeholder="Category Name" value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} required />
                                <div className="rounded-xl border border-border/80 bg-secondary/20 p-4 space-y-3">
                                    <p className="text-xs font-semibold text-foreground">Serving schedule (optional)</p>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        Times use your hotel&apos;s timezone from <strong className="text-foreground">Settings</strong> (default India IST). Leave times empty to show this category all day. Set both start and end for a daily window (supports overnight e.g. 22:00–02:00).
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-medium text-muted-foreground block mb-1">From (HH:mm)</label>
                                            <Input
                                                placeholder="07:00"
                                                value={catForm.serveTimeStart}
                                                onChange={(e) => setCatForm({ ...catForm, serveTimeStart: e.target.value })}
                                                className="h-9 font-mono text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-medium text-muted-foreground block mb-1">To (HH:mm)</label>
                                            <Input
                                                placeholder="11:00"
                                                value={catForm.serveTimeEnd}
                                                onChange={(e) => setCatForm({ ...catForm, serveTimeEnd: e.target.value })}
                                                className="h-9 font-mono text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-medium text-muted-foreground mb-1.5">Days (empty = every day)</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {ISO_WEEKDAY_OPTIONS.map(({ iso, label }) => {
                                                const on = catForm.serveDaysOfWeek.includes(iso);
                                                return (
                                                    <button
                                                        key={iso}
                                                        type="button"
                                                        aria-pressed={on}
                                                        onClick={() =>
                                                            setCatForm({
                                                                ...catForm,
                                                                serveDaysOfWeek: toggleIsoDay(catForm.serveDaysOfWeek, iso),
                                                            })
                                                        }
                                                        className={cn(
                                                            "rounded-md border px-2 py-1 text-[10px] font-semibold",
                                                            on
                                                                ? "border-primary/50 bg-primary/15 text-primary"
                                                                : "border-border text-muted-foreground hover:border-primary/30",
                                                        )}
                                                    >
                                                        {label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
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
                                    <Button type="submit" loading={saving} className="flex-1">
                                        {editingCategory ? "Save" : "Create"}
                                    </Button>
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
                                            {deleteConfirm.type === "item"
                                            ? "Delete menu item?"
                                            : deleteConfirm.type === "category"
                                                ? "Delete category?"
                                                : "Delete tag?"}
                                        </h3>
                                        <p id="delete-confirm-desc" className="mt-1 text-sm text-muted-foreground">
                                            {deleteConfirm.type === "item" ? (
                                                <>
                                                    <span className="font-medium text-foreground">
                                                        &ldquo;{deleteConfirm.name}&rdquo;
                                                    </span>{" "}
                                                    will be removed from your menu. This cannot be undone.
                                                </>
                                            ) : deleteConfirm.type === "category" ? (
                                                <>
                                                    <span className="font-medium text-foreground">
                                                        &ldquo;{deleteConfirm.name}&rdquo;
                                                    </span>{" "}
                                                    and{" "}
                                                    <strong className="text-foreground">
                                                        all items in this category
                                                    </strong>{" "}
                                                    will be permanently removed. This cannot be undone.
                                                </>
                                            ) : (
                                                <>
                                                    <span className="font-medium text-foreground">
                                                        &ldquo;{deleteConfirm.name}&rdquo;
                                                    </span>{" "}
                                                    will be permanently removed from your custom tags. This
                                                    cannot be undone.
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

            {/* Tag create / edit modal */}
            <AnimatePresence>
                {tagModalOpen && (
                    <div
                        className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 pb-[env(safe-area-inset-bottom,0px)] bg-black/70 backdrop-blur-md overflow-y-auto"
                        onClick={() => {
                            if (!tagSaving) {
                                setTagModalOpen(false);
                            }
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 8 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md max-h-[90dvh] overflow-y-auto bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl"
                        >
                            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                                <h3 className="text-lg font-semibold text-foreground">
                                    {editingTag
                                        ? "Edit tag"
                                        : `Add ${
                                              tagType === "ALLERGEN"
                                                  ? "allergen"
                                                  : "dietary tag"
                                          }`}
                                </h3>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!tagSaving) {
                                            setTagModalOpen(false);
                                        }
                                    }}
                                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
                                    aria-label="Close"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">
                                        Name
                                    </label>

                                    <Input
                                        value={tagName}
                                        onChange={(e) => setTagName(e.target.value)}
                                        placeholder="Enter tag name"
                                        className="h-11"
                                        autoFocus
                                    />
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1 h-11"
                                        onClick={() => {
                                            if (!tagSaving) {
                                                setTagModalOpen(false);
                                            }
                                        }}
                                        disabled={tagSaving}
                                    >
                                        Cancel
                                    </Button>

                                    <Button
                                        type="button"
                                        className="flex-1 h-11"
                                        loading={tagSaving}
                                        disabled={!tagName.trim()}
                                        onClick={() => void saveTag()}
                                    >
                                        {editingTag ? "Update" : "Create"}
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
