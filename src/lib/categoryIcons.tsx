import type { LucideIcon } from "lucide-react";
import {
    Beef,
    Beer,
    Cake,
    ChefHat,
    Coffee,
    Cookie,
    Croissant,
    CupSoda,
    Donut,
    Egg,
    Fish,
    GlassWater,
    IceCreamCone,
    Martini,
    Milk,
    Pizza,
    Salad,
    Sandwich,
    Soup,
    UtensilsCrossed,
    Wine,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Stored in DB as `MenuCategory.icon` (e.g. `"pizza"`).
 * Values not in this map are shown as legacy emoji / text.
 */
export const CATEGORY_ICON_MAP = {
    utensils: UtensilsCrossed,
    chef: ChefHat,
    soup: Soup,
    pizza: Pizza,
    sandwich: Sandwich,
    salad: Salad,
    beef: Beef,
    fish: Fish,
    croissant: Croissant,
    egg: Egg,
    coffee: Coffee,
    wine: Wine,
    beer: Beer,
    soda: CupSoda,
    milk: Milk,
    cake: Cake,
    cookie: Cookie,
    donut: Donut,
    dessert: IceCreamCone,
    martini: Martini,
    water: GlassWater,
} as const satisfies Record<string, LucideIcon>;

export type CategoryIconKey = keyof typeof CATEGORY_ICON_MAP;

/** Curated order for the “New category” picker (20 icons, Lucide React) */
export const CATEGORY_ICON_PICKER_OPTIONS: { key: CategoryIconKey; label: string }[] = [
    { key: "utensils", label: "General" },
    { key: "chef", label: "Chef special" },
    { key: "soup", label: "Soup & bowls" },
    { key: "pizza", label: "Pizza" },
    { key: "sandwich", label: "Sandwiches" },
    { key: "salad", label: "Salads" },
    { key: "beef", label: "Grill / meat" },
    { key: "fish", label: "Seafood" },
    { key: "croissant", label: "Bakery" },
    { key: "egg", label: "Breakfast / egg" },
    { key: "coffee", label: "Coffee" },
    { key: "wine", label: "Wine" },
    { key: "beer", label: "Beer" },
    { key: "soda", label: "Soft drinks" },
    { key: "cake", label: "Cakes" },
    { key: "cookie", label: "Cookies" },
    { key: "donut", label: "Donuts" },
    { key: "dessert", label: "Ice cream" },
    { key: "martini", label: "Cocktails" },
    { key: "water", label: "Water" },
];

const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-10 h-10",
} as const;

/** Renders a Lucide icon for known keys, or legacy emoji text, or default utensils. */
export function CategoryIconDisplay({
    icon,
    className,
    size = "md",
}: {
    icon?: string | null;
    className?: string;
    size?: keyof typeof sizeClasses;
}) {
    const sz = sizeClasses[size];
    const trimmed = icon?.trim() ?? "";
    const Lucide = trimmed ? (CATEGORY_ICON_MAP as Record<string, LucideIcon>)[trimmed] : undefined;

    if (Lucide) {
        return <Lucide className={cn(sz, "shrink-0", className)} aria-hidden />;
    }
    if (trimmed) {
        return (
            <span
                className={cn(
                    "shrink-0 leading-none inline-flex items-center justify-center",
                    size === "sm" && "text-base",
                    size === "md" && "text-lg",
                    size === "lg" && "text-2xl",
                    size === "xl" && "text-3xl",
                    className,
                )}
                role="img"
            >
                {trimmed}
            </span>
        );
    }
    return <UtensilsCrossed className={cn(sz, "shrink-0 text-muted-foreground", className)} aria-hidden />;
}
