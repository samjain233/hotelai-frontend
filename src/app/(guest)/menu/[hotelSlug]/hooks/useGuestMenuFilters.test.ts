import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { GuestPublicMenuCategory, MenuItem } from "@/lib/types";
import { useGuestMenuFilters } from "./useGuestMenuFilters";

function item(
    id: string,
    name: string,
    price: number,
    dietaryPreference: MenuItem["dietaryPreference"],
    description?: string,
): MenuItem {
    return { id, name, price, dietaryPreference, description, categoryId: "", hotelId: "hotel-1", createdAt: "2026-10-01T00:00:00.000Z" };
}

const MENU: GuestPublicMenuCategory[] = [
    {
        id: "starters",
        name: "Starters",
        items: [
            item("paneer-tikka", "Paneer Tikka", 250, "VEG"),
            item("chicken-tikka", "Chicken Tikka", 320, "NON_VEG"),
            item("masala-omelette", "Masala Omelette", 120, "EGGITARIAN"),
        ],
    },
    {
        id: "soups",
        name: "Soups",
        items: [item("tomato-soup", "Tomato Soup", 150, "VEG"), item("sweet-corn", "Sweet Corn Soup", 160, "VEG")],
    },
    {
        id: "mains",
        name: "Mains",
        items: [item("butter-chicken", "Butter Chicken", 420, "NON_VEG"), item("dal-makhani", "Dal Makhani", 280, "VEG")],
    },
    {
        id: "desserts",
        name: "Desserts",
        items: [item("gulab-jamun", "Gulab Jamun", 90, "VEG", "Warm milk dumplings in rose syrup")],
    },
];

function renderFilters(categories = MENU) {
    return renderHook(() => useGuestMenuFilters(categories));
}

function shownIds(categories: GuestPublicMenuCategory[]): string[] {
    return categories.flatMap((c) => c.items.map((i) => i.id));
}

describe("search", () => {
    it("shows the whole menu with no query", () => {
        const { result } = renderFilters();
        expect(shownIds(result.current.displayCategories)).toHaveLength(8);
        expect(result.current.isSearchUnmatched).toBe(false);
        expect(result.current.hasActiveFilters).toBe(false);
    });

    it("matches names and keeps only categories with hits", () => {
        const { result } = renderFilters();
        act(() => result.current.setSearchQuery("  TIKKA "));
        expect(result.current.displayCategories.map((c) => c.id)).toEqual(["starters"]);
        expect(shownIds(result.current.displayCategories)).toEqual(["paneer-tikka", "chicken-tikka"]);
        expect(result.current.searchResultCount).toBe(2);
    });

    it("matches descriptions", () => {
        const { result } = renderFilters();
        act(() => result.current.setSearchQuery("dumplings"));
        expect(shownIds(result.current.displayCategories)).toEqual(["gulab-jamun"]);
    });

    it.each([
        ["chiken", ["chicken-tikka", "butter-chicken"]],
        ["makhni", ["dal-makhani"]],
        ["gulab jamon", ["gulab-jamun"]],
    ])("tolerates the typo %j", (query, expected) => {
        const { result } = renderFilters();
        act(() => result.current.setSearchQuery(query));
        expect(shownIds(result.current.displayCategories)).toEqual(expected);
        expect(result.current.isSearchUnmatched).toBe(false);
    });

    it("falls back to the full menu when nothing matches", () => {
        const { result } = renderFilters();
        act(() => result.current.setSearchQuery("pizza"));
        expect(result.current.isSearchUnmatched).toBe(true);
        expect(result.current.searchResultCount).toBe(0);
        expect(shownIds(result.current.displayCategories)).toHaveLength(8);
        expect(result.current.didYouMeanItem).toBeNull();
    });

    it("suggests the closest dish when the query is just past the fuzzy match", () => {
        const { result } = renderFilters();
        act(() => result.current.setSearchQuery("tamatr sup"));
        expect(result.current.isSearchUnmatched).toBe(true);
        expect(result.current.didYouMeanItem?.id).toBe("tomato-soup");
    });

    it("offers no suggestion for queries shorter than three characters", () => {
        const { result } = renderFilters();
        act(() => result.current.setSearchQuery("zq"));
        expect(result.current.isSearchUnmatched).toBe(true);
        expect(result.current.didYouMeanItem).toBeNull();
    });
});

describe("diet filters", () => {
    it("toggles filters on and off", () => {
        const { result } = renderFilters();
        act(() => result.current.toggleDietFilter("VEG"));
        expect(shownIds(result.current.displayCategories)).toEqual([
            "paneer-tikka",
            "tomato-soup",
            "sweet-corn",
            "dal-makhani",
            "gulab-jamun",
        ]);

        act(() => result.current.toggleDietFilter("NON_VEG"));
        expect(result.current.searchResultCount).toBe(7);

        act(() => result.current.toggleDietFilter("VEG"));
        expect(shownIds(result.current.displayCategories)).toEqual(["chicken-tikka", "butter-chicken"]);
        expect(result.current.dietFilters).toEqual(["NON_VEG"]);
    });

    it("falls back to the diet-filtered list when the search misses inside it", () => {
        const { result } = renderFilters();
        act(() => result.current.toggleDietFilter("VEG"));
        act(() => result.current.setSearchQuery("chicken"));

        expect(result.current.isSearchUnmatched).toBe(true);
        expect(result.current.isDietUnmatched).toBe(false);
        expect(shownIds(result.current.displayCategories)).not.toContain("butter-chicken");
        expect(shownIds(result.current.displayCategories)).toHaveLength(5);
    });

    it("flags a diet filter that matches nothing and shows the full menu", () => {
        const soupsOnly = MENU.filter((c) => c.id === "soups");
        const { result } = renderFilters(soupsOnly);
        act(() => result.current.toggleDietFilter("NON_VEG"));

        expect(result.current.isDietUnmatched).toBe(true);
        expect(result.current.isSearchUnmatched).toBe(false);
        expect(shownIds(result.current.displayCategories)).toEqual(["tomato-soup", "sweet-corn"]);
    });
});

describe("sort and reset", () => {
    it("sorts within each category", () => {
        const { result } = renderFilters();
        act(() => result.current.setSortBy("price-desc"));
        expect(result.current.displayCategories[0].items.map((i) => i.id)).toEqual([
            "chicken-tikka",
            "paneer-tikka",
            "masala-omelette",
        ]);
        expect(result.current.activeSortLabel).toBe("Price (high to low)");
    });

    it("clearing filters resets sort and diet but keeps the search", () => {
        const { result } = renderFilters();
        act(() => {
            result.current.setSearchQuery("soup");
            result.current.toggleDietFilter("VEG");
            result.current.setSortBy("name-desc");
        });
        expect(result.current.menuFiltersActive).toBe(true);

        act(() => result.current.clearAllMenuFilters());

        expect(result.current.sortBy).toBe("default");
        expect(result.current.dietFilters).toEqual([]);
        expect(result.current.searchQuery).toBe("soup");
        expect(result.current.menuFiltersActive).toBe(false);
        expect(result.current.hasActiveFilters).toBe(true);
        expect(result.current.activeSortLabel).toBe("Sort");
    });
});
