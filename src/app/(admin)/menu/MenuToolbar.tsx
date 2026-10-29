"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MenuCategory } from "@/lib/types";

export type MenuTab = "items" | "categories";

interface MenuToolbarProps {
    activeTab: MenuTab;
    onTabChange: (tab: MenuTab) => void;
    itemCount: number;
    categories: MenuCategory[];
    search: string;
    onSearchChange: (value: string) => void;
    /** "all" or a category id */
    categoryFilter: string;
    onCategoryFilterChange: (id: string) => void;
}

/** Dishes/Categories tab switch, search box and category chips above the grid. */
export function MenuToolbar({
    activeTab,
    onTabChange,
    itemCount,
    categories,
    search,
    onSearchChange,
    categoryFilter,
    onCategoryFilterChange,
}: MenuToolbarProps) {
    const tabs = [
        { id: "items", label: "Dishes", count: itemCount },
        { id: "categories", label: "Categories", count: categories.length },
    ] as const;
    const chips = [{ id: "all", name: "All", count: itemCount }, ...categories.map((c) => ({ id: c.id, name: c.name, count: c._count?.items ?? 0 }))];

    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div role="tablist" aria-label="Menu view" className="inline-flex w-full rounded-xl border border-border bg-panel p-1 sm:w-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={cn(
                                "flex h-9 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors sm:flex-none",
                                activeTab === tab.id ? "bg-secondary text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
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
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="h-10 w-full rounded-xl border border-border bg-panel pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
                        />
                    </div>
                )}
            </div>

            {activeTab === "items" && categories.length > 0 && (
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {chips.map((chip) => (
                        <button
                            key={chip.id}
                            type="button"
                            onClick={() => onCategoryFilterChange(chip.id)}
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
                    ))}
                </div>
            )}
        </div>
    );
}
