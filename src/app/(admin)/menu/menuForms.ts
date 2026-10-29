import type { MenuCategory, MenuItem } from "@/lib/types";

/** Shared field styling for the item form. */
export const ITEM_LABEL = "mb-1.5 block text-sm font-medium text-foreground";
export const ITEM_FIELD = "h-11 rounded-xl border-border bg-background shadow-none focus:border-brand/60 focus:ring-brand/40";

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

export const DELETE_CONFIRM_WORD = "delete";

/** ISO weekday 1 = Monday … 7 = Sunday (matches backend category schedule). */
export const ISO_WEEKDAY_OPTIONS: { iso: number; label: string }[] = [
    { iso: 1, label: "Mon" },
    { iso: 2, label: "Tue" },
    { iso: 3, label: "Wed" },
    { iso: 4, label: "Thu" },
    { iso: 5, label: "Fri" },
    { iso: 6, label: "Sat" },
    { iso: 7, label: "Sun" },
];

export function toggleIsoDay(list: number[], day: number): number[] {
    return list.includes(day) ? list.filter((d) => d !== day) : [...list, day].sort((a, b) => a - b);
}

export function toggleNumberList(list: number[], id: number): number[] {
    return list.includes(id) ? list.filter((value) => value !== id) : [...list, id];
}

// ─── Item form ──────────────────────────────────────────────────────────────

export type SpiceLevel = NonNullable<MenuItem["spiceLevel"]>;
export type DietaryPreference = NonNullable<MenuItem["dietaryPreference"]>;

export interface ItemFormState {
    name: string;
    description: string;
    price: string;
    categoryId: string;
    imageUrl: string;
    dietaryPreference: DietaryPreference;
    /** Read-only in the form; availability is managed on /menu/availability. */
    available: boolean;
    spiceLevel: SpiceLevel;
    allergenTagIds: number[];
    dietaryTagIds: number[];
    calories: string;
    portionLabel: string;
    chefRecommended: boolean;
    containsAlcohol: boolean;
}

export function emptyItemForm(categoryId = ""): ItemFormState {
    return {
        name: "",
        description: "",
        price: "",
        categoryId,
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
    };
}

export function itemFormFromItem(item: MenuItem): ItemFormState {
    return {
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
    };
}

/** True when the "More details" section has anything worth showing expanded on edit. */
export function itemHasExtraDetails(item: MenuItem): boolean {
    return (
        (item.spiceLevel ?? "NONE") !== "NONE" ||
        (item.allergens?.length ?? 0) > 0 ||
        (item.dietaryTags?.length ?? 0) > 0 ||
        (item.calories ?? 0) > 0 ||
        Boolean(item.portionLabel) ||
        Boolean(item.chefRecommended) ||
        Boolean(item.containsAlcohol)
    );
}

// ─── Category form ──────────────────────────────────────────────────────────

export interface CategoryFormState {
    name: string;
    icon: string;
    serveTimeStart: string;
    serveTimeEnd: string;
    serveDaysOfWeek: number[];
}

export function emptyCategoryForm(name = ""): CategoryFormState {
    return { name, icon: "", serveTimeStart: "", serveTimeEnd: "", serveDaysOfWeek: [] };
}

export function categoryFormFromCategory(cat: MenuCategory): CategoryFormState {
    return {
        name: cat.name,
        icon: cat.icon ?? "",
        serveTimeStart: cat.serveTimeStart?.trim() ?? "",
        serveTimeEnd: cat.serveTimeEnd?.trim() ?? "",
        serveDaysOfWeek: [...(cat.serveDaysOfWeek ?? [])],
    };
}

export function hasCategorySchedule(cat: MenuCategory): boolean {
    return Boolean((cat.serveTimeStart && cat.serveTimeEnd) || (cat.serveDaysOfWeek && cat.serveDaysOfWeek.length > 0));
}

/** "07:00–11:00 · Sat, Sun", "All day · Mon", or "Served all day". */
export function formatCategorySchedule(cat: MenuCategory): string {
    if (!hasCategorySchedule(cat)) return "Served all day";
    const window = cat.serveTimeStart && cat.serveTimeEnd ? `${cat.serveTimeStart}–${cat.serveTimeEnd}` : "All day";
    const days =
        cat.serveDaysOfWeek && cat.serveDaysOfWeek.length > 0
            ? ` · ${cat.serveDaysOfWeek.map((d) => ISO_WEEKDAY_OPTIONS.find((o) => o.iso === d)?.label ?? d).join(", ")}`
            : "";
    return `${window}${days}`;
}
