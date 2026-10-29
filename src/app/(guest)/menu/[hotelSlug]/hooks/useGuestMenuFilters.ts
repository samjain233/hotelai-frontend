"use client";

import { useCallback, useMemo, useState } from "react";
import type { GuestPublicMenuCategory } from "@/lib/types";
import {
    type GuestDietFilterKey,
    type GuestMenuSort,
    normalizeSearchText,
    filterCategoriesByDiet,
    filterCategoriesBySearch,
    applySortToCategories,
    flattenMenuItems,
    findDidYouMeanItem,
} from "@/lib/guestMenuSearch";

const SORT_LABELS: Record<GuestMenuSort, string> = {
    default: "Sort",
    "name-asc": "Name (A–Z)",
    "name-desc": "Name (Z–A)",
    "price-asc": "Price (low to high)",
    "price-desc": "Price (high to low)",
};

/**
 * Search, diet filters and sort over the categories visible right now, plus what to show when the
 * filters match nothing (fall back to the diet-filtered list, then the full menu, with a hint).
 */
export function useGuestMenuFilters(categories: GuestPublicMenuCategory[]) {
    const [searchQuery, setSearchQuery] = useState("");
    const [dietFilters, setDietFilters] = useState<GuestDietFilterKey[]>([]);
    const [sortBy, setSortBy] = useState<GuestMenuSort>("default");

    const searchNormalized = normalizeSearchText(searchQuery);
    const dietFilterSet = useMemo(() => new Set(dietFilters), [dietFilters]);

    const dietFilteredCategories = useMemo(
        () => filterCategoriesByDiet(categories, dietFilterSet),
        [categories, dietFilterSet],
    );

    const filteredCategories = useMemo(() => {
        const afterSearch = searchNormalized
            ? filterCategoriesBySearch(dietFilteredCategories, searchQuery)
            : dietFilteredCategories.map((c) => ({ ...c, items: [...(c.items ?? [])] }));
        return applySortToCategories(afterSearch, sortBy);
    }, [dietFilteredCategories, searchQuery, searchNormalized, sortBy]);

    const searchResultCount = useMemo(() => flattenMenuItems(filteredCategories).length, [filteredCategories]);
    const isSearchUnmatched = searchNormalized.length > 0 && searchResultCount === 0;
    const isDietUnmatched = dietFilters.length > 0 && searchResultCount === 0 && !isSearchUnmatched;

    const displayCategories = useMemo(() => {
        if (searchResultCount > 0) return filteredCategories;
        const fallback = applySortToCategories(dietFilteredCategories, sortBy);
        if (flattenMenuItems(fallback).length > 0) return fallback;
        return applySortToCategories(categories, sortBy);
    }, [searchResultCount, filteredCategories, dietFilteredCategories, categories, sortBy]);

    const didYouMeanItem = useMemo(() => {
        if (searchNormalized.length < 3 || searchResultCount > 0) return null;
        const pool = flattenMenuItems(dietFilteredCategories.length > 0 ? dietFilteredCategories : categories);
        return findDidYouMeanItem(searchQuery, pool);
    }, [searchQuery, searchNormalized, searchResultCount, dietFilteredCategories, categories]);

    const toggleDietFilter = useCallback((key: GuestDietFilterKey) => {
        setDietFilters((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    }, []);
    const removeDietFilter = useCallback((key: GuestDietFilterKey) => {
        setDietFilters((prev) => prev.filter((k) => k !== key));
    }, []);
    const clearAllMenuFilters = useCallback(() => {
        setSortBy("default");
        setDietFilters([]);
    }, []);

    return {
        searchQuery,
        setSearchQuery,
        searchNormalized,
        dietFilters,
        setDietFilters,
        sortBy,
        setSortBy,
        displayCategories,
        searchResultCount,
        isSearchUnmatched,
        isDietUnmatched,
        didYouMeanItem,
        hasActiveFilters: searchNormalized.length > 0 || dietFilters.length > 0 || sortBy !== "default",
        menuFiltersActive: sortBy !== "default" || dietFilters.length > 0,
        activeSortLabel: SORT_LABELS[sortBy],
        toggleDietFilter,
        removeDietFilter,
        clearAllMenuFilters,
    };
}
