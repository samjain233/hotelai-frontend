/** Labels for guest menu chips (codes match hotel-ai `menu-item-insights.constants.ts`). */
export const ALLERGEN_LABELS: Record<string, string> = {
    CELERY: "Celery",
    GLUTEN: "Gluten",
    CRUSTACEANS: "Shellfish (crustaceans)",
    EGGS: "Eggs",
    FISH: "Fish",
    LUPIN: "Lupin",
    MILK: "Milk",
    MOLLUSCS: "Molluscs",
    MUSTARD: "Mustard",
    PEANUTS: "Peanuts",
    SESAME: "Sesame",
    SOY: "Soy",
    SULPHITES: "Sulphites",
    TREE_NUTS: "Tree nuts",
};

export const DIETARY_TAG_LABELS: Record<string, string> = {
    VEGAN: "Vegan",
    JAIN: "Jain",
    HALAL: "Halal",
    KOSHER: "Kosher",
    GLUTEN_FREE: "Gluten-free",
    DAIRY_FREE: "Dairy-free",
    NUT_FREE: "Nut-free",
    KETO: "Keto",
};

export const SPICE_LABELS: Record<string, string> = {
    NONE: "",
    MILD: "Mild",
    MEDIUM: "Medium",
    HOT: "Hot",
};

export const MENU_ALLERGEN_CODES = Object.keys(ALLERGEN_LABELS);
export const MENU_DIETARY_TAG_CODES = Object.keys(DIETARY_TAG_LABELS);
