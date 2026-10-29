"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Camera, FolderOpen, Plus, Search, UtensilsCrossed } from "lucide-react";
import { api } from "@/lib/api";
import type { MenuCategory, MenuItem, MenuTag } from "@/lib/types";
import { useCategories, useMenuItems, invalidateMenuCache } from "@/hooks/useSwrApi";
import { AdminPageSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { MenuScanModal } from "./MenuScanModal";
import { MenuSectionTabs } from "./MenuSectionTabs";
import { MenuToolbar, type MenuTab } from "./MenuToolbar";
import { MenuItemCard } from "./MenuItemCard";
import { CategoryCard } from "./CategoryCard";
import { ItemFormModal } from "./ItemFormModal";
import { CategoryFormModal } from "./CategoryFormModal";
import { DeleteConfirmModal, type DeleteTarget } from "./DeleteConfirmModal";
import { TagFormModal, type TagModalState } from "./TagFormModal";
import { useMenuTags, type MenuTagType } from "./useMenuTags";
import {
    categoryFormFromCategory,
    emptyCategoryForm,
    emptyItemForm,
    itemFormFromItem,
    type CategoryFormState,
    type ItemFormState,
} from "./menuForms";

function errorMessage(err: unknown): string {
    return err instanceof Error ? err.message : "Something went wrong";
}

export default function MenuPage() {
    const { data: categories = [], isLoading: categoriesLoading } = useCategories();
    const { data: items = [], isLoading: itemsLoading } = useMenuItems();
    const tagStore = useMenuTags();
    const loading = categoriesLoading || itemsLoading || tagStore.loading;

    // List view
    const [activeTab, setActiveTab] = useState<MenuTab>("items");
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");

    // Item modal
    const [showItemModal, setShowItemModal] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [itemForm, setItemForm] = useState<ItemFormState>(() => emptyItemForm());

    // Category modal
    const [showCatModal, setShowCatModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
    const [catForm, setCatForm] = useState<CategoryFormState>(() => emptyCategoryForm());
    /** When true, the next successfully created category is selected in the open item form. */
    const selectNewCategoryInItemForm = useRef(false);

    const [saving, setSaving] = useState(false);
    const [showMenuScan, setShowMenuScan] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
    const [tagModal, setTagModal] = useState<TagModalState | null>(null);

    // ─── Items ───────────────────────────────────────────────────────────────

    function openNewItem() {
        setEditingItem(null);
        setItemForm(emptyItemForm(categories[0]?.id || ""));
        setShowItemModal(true);
    }

    function openEditItem(item: MenuItem) {
        setEditingItem(item);
        setItemForm(itemFormFromItem(item));
        setShowItemModal(true);
    }

    async function saveItem(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            const calRaw = itemForm.calories.trim();
            let calories: number | null | undefined = undefined;
            if (calRaw !== "") {
                const n = Number(calRaw);
                if (Number.isNaN(n) || n < 0 || n > 20000) {
                    alert("Calories must be a number between 0 and 20000, or leave empty.");
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
                // Availability is managed on /menu/availability. Only set it for new dishes, so an
                // edit saved from a stale form never overwrites a sold-out flip the kitchen just made.
                ...(editingItem ? {} : { available: true }),
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
            setShowItemModal(false);
            invalidateMenuCache();
            toast.success(editingItem ? "Item updated successfully" : "Item added successfully");
        } catch (err: unknown) {
            alert(errorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    // ─── Categories ──────────────────────────────────────────────────────────

    function openNewCategory(prefillName = "", selectInItemForm = false) {
        selectNewCategoryInItemForm.current = selectInItemForm;
        setEditingCategory(null);
        setCatForm(emptyCategoryForm(prefillName));
        setShowCatModal(true);
    }

    function openEditCategory(cat: MenuCategory) {
        selectNewCategoryInItemForm.current = false;
        setEditingCategory(cat);
        setCatForm(categoryFormFromCategory(cat));
        setShowCatModal(true);
    }

    function closeCatModal() {
        selectNewCategoryInItemForm.current = false;
        setShowCatModal(false);
        setEditingCategory(null);
    }

    async function saveCategory(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            const timeOrClear = (value: string) => value.trim() || (editingCategory ? null : undefined);
            const payload = {
                name: catForm.name,
                icon: catForm.icon || undefined,
                serveTimeStart: timeOrClear(catForm.serveTimeStart),
                serveTimeEnd: timeOrClear(catForm.serveTimeEnd),
            };
            if (editingCategory) {
                await api.updateCategory(editingCategory.id, { ...payload, serveDaysOfWeek: catForm.serveDaysOfWeek });
                toast.success("Category updated");
            } else {
                const created = await api.createCategory({
                    ...payload,
                    serveDaysOfWeek: catForm.serveDaysOfWeek.length > 0 ? catForm.serveDaysOfWeek : undefined,
                });
                toast.success("Category created successfully");
                if (selectNewCategoryInItemForm.current) {
                    setItemForm((prev) => ({ ...prev, categoryId: created.id }));
                }
            }
            closeCatModal();
            invalidateMenuCache();
        } catch (err: unknown) {
            alert(errorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    // ─── Tags ────────────────────────────────────────────────────────────────

    function openCreateTag(type: MenuTagType) {
        setTagModal({ editing: null, type });
    }

    function openEditTag(tag: MenuTag) {
        if (!tag.hotelId) return; // built-in tags are read-only
        setTagModal({ editing: tag, type: tag.type });
    }

    function openDeleteTag(tag: MenuTag) {
        if (!tag.hotelId) return;
        setDeleteTarget({ type: "tag", id: String(tag.id), name: tag.name });
    }

    // ─── Delete ──────────────────────────────────────────────────────────────

    async function confirmDelete(target: DeleteTarget) {
        if (target.type === "item") {
            await api.deleteMenuItem(target.id);
        } else if (target.type === "category") {
            await api.deleteCategory(target.id);
        } else {
            await tagStore.removeTag(Number(target.id));
        }
        invalidateMenuCache();
        setDeleteTarget(null);
    }

    // ─── Scan ────────────────────────────────────────────────────────────────

    async function handleMenuScanSaved(result: { created: number; categoriesCreated: number }) {
        await invalidateMenuCache();
        setActiveTab("items");
        setCategoryFilter("all");
        toast.success(`Added ${result.created} dish${result.created === 1 ? "" : "es"} to your menu`, {
            description:
                result.categoriesCreated > 0
                    ? `${result.categoriesCreated} new categor${result.categoriesCreated === 1 ? "y" : "ies"} created.`
                    : undefined,
        });
    }

    // ─── Derived ─────────────────────────────────────────────────────────────

    const query = search.trim().toLowerCase();
    const categoryName = new Map(categories.map((c) => [c.id, c.name]));
    const soldOutCount = items.filter((i) => i.available === false).length;
    const filteredItems = items.filter(
        (i) =>
            (categoryFilter === "all" || i.categoryId === categoryFilter) &&
            (!query || i.name.toLowerCase().includes(query) || i.description?.toLowerCase().includes(query)),
    );

    if (loading) return <AdminPageSkeleton cardCount={9} />;

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-[env(safe-area-inset-bottom,0px)]">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">Menu</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {items.length} dish{items.length !== 1 ? "es" : ""} across {categories.length} categor{categories.length !== 1 ? "ies" : "y"}
                        {soldOutCount > 0 ? (
                            <>
                                {" · "}
                                <Link href="/menu/availability" className="underline-offset-2 hover:text-foreground hover:underline">
                                    {soldOutCount} sold out
                                </Link>
                            </>
                        ) : null}
                    </p>
                </div>
                <div className="flex flex-col gap-3 sm:items-end">
                    <MenuSectionTabs />
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                        <Button variant="ghost" className="h-10 justify-center text-muted-foreground hover:text-foreground" onClick={() => setShowMenuScan(true)}>
                            <Camera className="mr-2 h-4 w-4 shrink-0" /> Scan menu photo
                        </Button>
                        <Button variant="outline" className="h-10 justify-center border-border hover:bg-secondary" onClick={() => openNewCategory()}>
                            <FolderOpen className="mr-2 h-4 w-4 shrink-0" /> New category
                        </Button>
                        <Button className="col-span-2 h-10 justify-center sm:col-span-1" onClick={openNewItem}>
                            <Plus className="mr-2 h-4 w-4 shrink-0" /> Add item
                        </Button>
                    </div>
                </div>
            </div>

            <MenuToolbar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                itemCount={items.length}
                categories={categories}
                search={search}
                onSearchChange={setSearch}
                categoryFilter={categoryFilter}
                onCategoryFilterChange={setCategoryFilter}
            />

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
                                        ? "Add your first dish, or scan a photo of your printed menu. Guests see dishes as soon as they are added."
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
                                            <Button variant="outline" className="h-10" onClick={() => setShowMenuScan(true)}>
                                                <Camera className="mr-2 h-4 w-4" /> Scan menu photo
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
                        {filteredItems.map((item) => (
                            <MenuItemCard
                                key={item.id}
                                item={item}
                                categoryName={categoryName.get(item.categoryId) ?? "Uncategorised"}
                                onEdit={openEditItem}
                                onDelete={(i) => setDeleteTarget({ type: "item", id: i.id, name: i.name })}
                            />
                        ))}
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
                                    <Button className="h-10" onClick={() => openNewCategory()}>
                                        <Plus className="mr-2 h-4 w-4" /> New category
                                    </Button>
                                }
                            />
                        )}
                        {categories.map((cat) => (
                            <CategoryCard
                                key={cat.id}
                                category={cat}
                                onSelect={(c) => {
                                    setCategoryFilter(c.id);
                                    setActiveTab("items");
                                }}
                                onEdit={openEditCategory}
                                onDelete={(c) => setDeleteTarget({ type: "category", id: c.id, name: c.name })}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <ItemFormModal
                open={showItemModal}
                editing={editingItem}
                form={itemForm}
                setForm={setItemForm}
                categories={categories}
                allergenTags={tagStore.allergenTags}
                dietaryTags={tagStore.dietaryTags}
                saving={saving}
                onClose={() => setShowItemModal(false)}
                onSubmit={(e) => void saveItem(e)}
                onCreateCategory={(name) => openNewCategory(name, true)}
                onCreateTag={openCreateTag}
                onEditTag={openEditTag}
                onDeleteTag={openDeleteTag}
            />

            <MenuScanModal
                open={showMenuScan}
                onClose={() => setShowMenuScan(false)}
                existingItems={items}
                categories={categories}
                onSaved={handleMenuScanSaved}
            />

            <CategoryFormModal
                open={showCatModal}
                editing={editingCategory}
                form={catForm}
                setForm={setCatForm}
                saving={saving}
                onClose={closeCatModal}
                onSubmit={(e) => void saveCategory(e)}
            />

            <DeleteConfirmModal target={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} />

            <TagFormModal state={tagModal} onClose={() => setTagModal(null)} onSave={tagStore.saveTag} />
        </div>
    );
}
