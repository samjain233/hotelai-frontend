"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Beef, ChevronDown, Egg, Leaf, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { cn } from "@/lib/utils";
import type { MenuCategory, MenuItem, MenuTag } from "@/lib/types";
import { ITEM_FIELD, ITEM_LABEL, itemHasExtraDetails, type ItemFormState } from "./menuForms";
import { ItemDetailsFields } from "./ItemDetailsFields";
import { ItemPhotoField } from "./ItemPhotoField";
import { useImageUpload } from "./useImageUpload";
import type { MenuTagType } from "./useMenuTags";

interface ItemFormModalProps {
    open: boolean;
    editing: MenuItem | null;
    form: ItemFormState;
    setForm: Dispatch<SetStateAction<ItemFormState>>;
    categories: MenuCategory[];
    allergenTags: MenuTag[];
    dietaryTags: MenuTag[];
    saving: boolean;
    onClose: () => void;
    /** Only called when no photo upload is in flight. */
    onSubmit: (e: React.FormEvent) => void;
    /** "Create new category" from the category picker; `name` is what the user typed. */
    onCreateCategory: (name: string) => void;
    onCreateTag: (type: MenuTagType) => void;
    onEditTag: (tag: MenuTag) => void;
    onDeleteTag: (tag: MenuTag) => void;
}

const FOOD_TYPE_OPTIONS = [
    { value: "VEG", label: "Veg", icon: <Leaf className="h-4 w-4" />, on: "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
    { value: "NON_VEG", label: "Non-veg", icon: <Beef className="h-4 w-4" />, on: "border-red-500 bg-red-500/10 text-red-700 dark:text-red-300" },
    { value: "EGGITARIAN", label: "Egg", icon: <Egg className="h-4 w-4" />, on: "border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-300" },
    { value: "NONE", label: "Not set", icon: null, on: "border-foreground/40 bg-secondary text-foreground" },
] as const;

/** Add / edit a dish. Upload state lives inside so it resets whenever the dialog closes. */
export function ItemFormModal(props: ItemFormModalProps) {
    return <AnimatePresence>{props.open && <ItemFormDialog {...props} />}</AnimatePresence>;
}

function ItemFormDialog({
    editing,
    form,
    setForm,
    categories,
    allergenTags,
    dietaryTags,
    saving,
    onClose,
    onSubmit,
    onCreateCategory,
    onCreateTag,
    onEditTag,
    onDeleteTag,
}: ItemFormModalProps) {
    const [showDetails, setShowDetails] = useState(() => (editing ? itemHasExtraDetails(editing) : false));
    const { uploading, progress, uploadImage } = useImageUpload();
    const update = (patch: Partial<ItemFormState>) => setForm((prev) => ({ ...prev, ...patch }));

    async function handleFile(file: File) {
        const url = await uploadImage(file);
        if (url) update({ imageUrl: url });
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
            onClick={onClose}
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
                            {editing ? `Edit ${editing.name}` : "Add a dish"}
                        </h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {editing ? "Changes show on the guest menu as soon as you save." : "Name, price and category are all you need to start."}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="-mr-2 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form
                    onSubmit={(e) => {
                        if (uploading) {
                            e.preventDefault();
                            return;
                        }
                        onSubmit(e);
                    }}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <div className="min-h-0 flex-1 overflow-y-auto">
                        <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-[260px_minmax(0,1fr)]">
                            {/* Photo, sold-out note, food type */}
                            <div className="space-y-5 md:sticky md:top-0 md:self-start">
                                <ItemPhotoField
                                    imageUrl={form.imageUrl}
                                    uploading={uploading}
                                    progress={progress}
                                    onFile={(file) => void handleFile(file)}
                                    onRemove={() => update({ imageUrl: "" })}
                                />

                                {editing && !form.available && (
                                    <p className="rounded-xl border border-border bg-background px-4 py-3 text-xs text-muted-foreground">
                                        This dish is currently <span className="font-medium text-foreground">sold out</span>. Change that in{" "}
                                        <Link href="/menu/availability" className="font-medium text-foreground underline-offset-2 hover:underline">
                                            Availability
                                        </Link>
                                        .
                                    </p>
                                )}

                                <div>
                                    <p className={ITEM_LABEL}>Food type</p>
                                    <div role="radiogroup" aria-label="Food type" className="grid grid-cols-2 gap-2">
                                        {FOOD_TYPE_OPTIONS.map((opt) => {
                                            const selected = form.dietaryPreference === opt.value;
                                            return (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    role="radio"
                                                    aria-checked={selected}
                                                    onClick={() => update({ dietaryPreference: opt.value })}
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
                                        value={form.name}
                                        onChange={(e) => update({ name: e.target.value })}
                                        required
                                        autoFocus={!editing}
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
                                                value={form.price}
                                                onChange={(e) => update({ price: e.target.value })}
                                                required
                                                className={cn(ITEM_FIELD, "pl-8 tabular-nums")}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <p className={ITEM_LABEL}>Category</p>
                                        <SearchableSelect
                                            options={categories.map((c) => ({ value: c.id, label: c.name }))}
                                            value={form.categoryId}
                                            onChange={(v) => update({ categoryId: v })}
                                            placeholder="Select category"
                                            searchPlaceholder="Type to search..."
                                            emptyMessage="No categories found"
                                            footerAction={{
                                                label: "Create new category",
                                                onClick: (searchQuery) => onCreateCategory(searchQuery.trim()),
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
                                        <span className="text-xs tabular-nums text-muted-foreground">{form.description.length} characters</span>
                                    </div>
                                    <textarea
                                        id="item-description"
                                        placeholder="What's in it, how it's cooked, what it's served with."
                                        rows={4}
                                        className="w-full resize-none rounded-xl border border-border bg-background px-3.5 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/40"
                                        value={form.description}
                                        onChange={(e) => update({ description: e.target.value })}
                                    />
                                    <p className="mt-1 text-xs text-muted-foreground">Guests see the first two lines in the menu list.</p>
                                </div>

                                <div className="rounded-xl border border-border">
                                    <button
                                        type="button"
                                        onClick={() => setShowDetails((open) => !open)}
                                        aria-expanded={showDetails}
                                        className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left"
                                    >
                                        <span className="min-w-0">
                                            <span className="block text-sm font-medium text-foreground">More details</span>
                                            <span className="block text-xs text-muted-foreground">
                                                Spice, allergens, tags, calories. Shown when Menu design → Show extra dish details is on.
                                            </span>
                                        </span>
                                        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", showDetails && "rotate-180")} />
                                    </button>

                                    {showDetails && (
                                        <ItemDetailsFields
                                            form={form}
                                            update={update}
                                            allergenTags={allergenTags}
                                            dietaryTags={dietaryTags}
                                            onCreateTag={onCreateTag}
                                            onEditTag={onEditTag}
                                            onDeleteTag={onDeleteTag}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-panel px-5 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-4 sm:px-6">
                        <Button type="button" variant="ghost" className="h-10 px-4" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={saving} disabled={uploading} className="h-10 min-w-[140px] px-5">
                            {uploading ? "Uploading photo…" : editing ? "Save changes" : "Add dish"}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
