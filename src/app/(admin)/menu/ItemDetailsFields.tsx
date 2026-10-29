"use client";

import { Check, Edit2, Flame, Plus, Sparkles, Trash2, Wine } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import type { MenuTag } from "@/lib/types";
import { ITEM_FIELD, ITEM_LABEL, toggleNumberList, type ItemFormState } from "./menuForms";
import type { MenuTagType } from "./useMenuTags";

interface ItemDetailsFieldsProps {
    form: ItemFormState;
    update: (patch: Partial<ItemFormState>) => void;
    allergenTags: MenuTag[];
    dietaryTags: MenuTag[];
    onCreateTag: (type: MenuTagType) => void;
    onEditTag: (tag: MenuTag) => void;
    onDeleteTag: (tag: MenuTag) => void;
}

const SPICE_OPTIONS = [
    { value: "NONE", label: "None", flames: 0 },
    { value: "MILD", label: "Mild", flames: 1 },
    { value: "MEDIUM", label: "Medium", flames: 2 },
    { value: "HOT", label: "Hot", flames: 3 },
] as const;

/** The collapsible "More details" block: spice, allergens, dietary tags, calories, portion, flags. */
export function ItemDetailsFields({ form, update, allergenTags, dietaryTags, onCreateTag, onEditTag, onDeleteTag }: ItemDetailsFieldsProps) {
    const tagGroups = [
        {
            type: "ALLERGEN" as const,
            title: "Allergens",
            addLabel: "Add allergen",
            tags: allergenTags,
            selectedIds: form.allergenTagIds,
            on: "border-rose-500/60 bg-rose-500/10 text-rose-700 dark:text-rose-300",
            toggle: (id: number) => update({ allergenTagIds: toggleNumberList(form.allergenTagIds, id) }),
        },
        {
            type: "DIETARY" as const,
            title: "Dietary tags",
            addLabel: "Add tag",
            tags: dietaryTags,
            selectedIds: form.dietaryTagIds,
            on: "border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
            toggle: (id: number) => update({ dietaryTagIds: toggleNumberList(form.dietaryTagIds, id) }),
        },
    ];

    const flags = [
        { key: "chefRecommended" as const, label: "Chef's pick", icon: <Sparkles className="h-4 w-4 text-brand" aria-hidden /> },
        { key: "containsAlcohol" as const, label: "Contains alcohol", icon: <Wine className="h-4 w-4 text-muted-foreground" aria-hidden /> },
    ];

    return (
        <div className="space-y-5 border-t border-border px-4 py-4">
            <div>
                <p className={ITEM_LABEL}>Spice level</p>
                <div className="inline-flex rounded-xl border border-border bg-background p-1">
                    {SPICE_OPTIONS.map((opt) => {
                        const selected = form.spiceLevel === opt.value;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => update({ spiceLevel: opt.value })}
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

            {tagGroups.map((group) => (
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
                                                    onEditTag(tag);
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
                                                    onDeleteTag(tag);
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
                            onClick={() => onCreateTag(group.type)}
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
                            value={form.calories}
                            onChange={(e) => update({ calories: e.target.value.replace(/\D/g, "") })}
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
                        value={form.portionLabel}
                        onChange={(e) => update({ portionLabel: e.target.value })}
                        placeholder="Serves 2"
                        maxLength={80}
                        className={ITEM_FIELD}
                    />
                </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
                {flags.map((flag) => (
                    <label
                        key={flag.key}
                        className={cn(
                            "flex h-11 cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 text-sm text-foreground transition-colors",
                            form[flag.key] ? "border-brand/60 bg-brand/5" : "border-border bg-background",
                        )}
                    >
                        <input
                            type="checkbox"
                            checked={form[flag.key]}
                            onChange={(e) => update({ [flag.key]: e.target.checked })}
                            className="h-4 w-4 cursor-pointer rounded accent-[var(--color-brand)]"
                        />
                        {flag.icon}
                        {flag.label}
                    </label>
                ))}
            </div>
        </div>
    );
}
