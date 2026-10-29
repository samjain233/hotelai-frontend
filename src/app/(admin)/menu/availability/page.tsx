"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { mutate } from "swr";
import { toast } from "sonner";
import { Search, ListChecks, UtensilsCrossed, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { MenuCategory, MenuItem } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { useCategories, useMenuItems, invalidateMenuCache } from "@/hooks/useSwrApi";
import { AdminPageSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CategoryIconDisplay, hasCategoryIcon } from "@/lib/categoryIcons";
import { cn } from "@/lib/utils";
import { DietMark, formatMenuPrice } from "../menuDisplay";
import { MenuSectionTabs } from "../MenuSectionTabs";

const ITEMS_KEY = "/admin/menu";
const MENU_EDITOR_ROLES = new Set(["OWNER", "GENERAL_MANAGER", "MANAGER"]);

type Filter = "all" | "soldOut";

type Group = { category: MenuCategory | null; items: MenuItem[] };

function isSoldOut(item: MenuItem) {
    return item.available === false;
}

/** Group items by category in menu order; items whose category is missing go last. */
function groupItems(categories: MenuCategory[], items: MenuItem[]): Group[] {
    const byCategory = new Map<string, MenuItem[]>();
    for (const item of items) {
        const list = byCategory.get(item.categoryId) ?? [];
        list.push(item);
        byCategory.set(item.categoryId, list);
    }
    const ordered = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
    const groups: Group[] = ordered
        .filter((c) => byCategory.has(c.id))
        .map((c) => ({
            category: c,
            items: (byCategory.get(c.id) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
        }));
    const known = new Set(categories.map((c) => c.id));
    const orphans = items.filter((i) => !known.has(i.categoryId)).sort((a, b) => a.name.localeCompare(b.name));
    if (orphans.length) groups.push({ category: null, items: orphans });
    return groups;
}

export default function MenuAvailabilityPage() {
    const { admin } = useAuth();
    const canEdit = admin ? MENU_EDITOR_ROLES.has(admin.role) : false;
    const { data: categories = [], isLoading: categoriesLoading } = useCategories();
    const { data: items = [], isLoading: itemsLoading } = useMenuItems();
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<Filter>("all");
    const [pending, setPending] = useState<Set<string>>(() => new Set());
    const [pendingCategory, setPendingCategory] = useState<string | null>(null);

    const soldOutCount = items.filter(isSoldOut).length;
    const query = search.trim().toLowerCase();

    const groups = useMemo(() => {
        const visible = items.filter(
            (i) =>
                (filter === "all" || isSoldOut(i)) &&
                (!query || i.name.toLowerCase().includes(query) || i.description?.toLowerCase().includes(query)),
        );
        return groupItems(categories, visible);
    }, [categories, items, filter, query]);

    /** Optimistically update the SWR cache for the item list, then confirm with the server. */
    async function applyOptimistic(
        update: (list: MenuItem[]) => MenuItem[],
        request: () => Promise<unknown>,
        successMessage: string,
    ) {
        let previous: MenuItem[] | undefined;
        await mutate(
            ITEMS_KEY,
            (current: MenuItem[] | undefined) => {
                previous = current;
                return current ? update(current) : current;
            },
            { revalidate: false },
        );
        try {
            await request();
            toast.success(successMessage);
            // Guest menu caches and the item list get the server's truth.
            void invalidateMenuCache();
        } catch (err: unknown) {
            await mutate(ITEMS_KEY, previous, { revalidate: false });
            toast.error(err instanceof Error ? err.message : "Could not update availability");
        }
    }

    async function toggleItem(item: MenuItem) {
        const next = isSoldOut(item);
        setPending((prev) => new Set(prev).add(item.id));
        try {
            await applyOptimistic(
                (list) => list.map((i) => (i.id === item.id ? { ...i, available: next } : i)),
                () => api.setMenuItemAvailability(item.id, next),
                next ? `${item.name} is back on the menu` : `${item.name} marked sold out`,
            );
        } finally {
            setPending((prev) => {
                const copy = new Set(prev);
                copy.delete(item.id);
                return copy;
            });
        }
    }

    async function setCategory(category: MenuCategory, available: boolean) {
        setPendingCategory(category.id);
        try {
            await applyOptimistic(
                (list) => list.map((i) => (i.categoryId === category.id ? { ...i, available } : i)),
                () => api.setCategoryAvailability(category.id, available),
                available ? `${category.name}: everything back on the menu` : `${category.name} marked sold out`,
            );
        } finally {
            setPendingCategory(null);
        }
    }

    if (categoriesLoading || itemsLoading) return <AdminPageSkeleton cardCount={6} />;

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-[env(safe-area-inset-bottom,0px)]">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">Availability</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {items.length - soldOutCount} of {items.length} dish{items.length !== 1 ? "es" : ""} on the menu
                        {soldOutCount > 0 ? ` · ${soldOutCount} sold out` : ""}
                    </p>
                </div>
                <MenuSectionTabs />
            </div>

            {items.length === 0 ? (
                <EmptyState
                    icon={UtensilsCrossed}
                    title="No dishes yet"
                    description={
                        canEdit
                            ? "Add dishes in Build menu first. You can mark them sold out from here afterwards."
                            : "Nothing to manage yet. Ask a manager to add dishes to the menu."
                    }
                    action={
                        canEdit ? (
                            <Link
                                href="/menu"
                                className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                            >
                                Go to Build menu
                            </Link>
                        ) : undefined
                    }
                />
            ) : (
                <>
                    {/* Toolbar */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div role="group" aria-label="Filter" className="inline-flex w-full rounded-xl border border-border bg-panel p-1 sm:w-auto">
                            {(
                                [
                                    { id: "all", label: "All", count: items.length },
                                    { id: "soldOut", label: "Sold out", count: soldOutCount },
                                ] as const
                            ).map((chip) => (
                                <button
                                    key={chip.id}
                                    type="button"
                                    aria-pressed={filter === chip.id}
                                    onClick={() => setFilter(chip.id)}
                                    className={cn(
                                        "flex h-9 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors sm:flex-none",
                                        filter === chip.id ? "bg-secondary text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                                    )}
                                >
                                    {chip.label}
                                    <span
                                        className={cn(
                                            "rounded-md px-1.5 py-0.5 text-[11px] tabular-nums",
                                            filter === chip.id ? "bg-background text-foreground" : "bg-secondary/60 text-muted-foreground",
                                        )}
                                    >
                                        {chip.count}
                                    </span>
                                </button>
                            ))}
                        </div>
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
                    </div>

                    {groups.length === 0 ? (
                        <EmptyState
                            icon={filter === "soldOut" && !query ? ListChecks : Search}
                            title={filter === "soldOut" && !query ? "Nothing is sold out" : "No dishes match"}
                            description={
                                filter === "soldOut" && !query
                                    ? "Every dish is on the menu right now."
                                    : `Nothing found for "${search.trim()}"${filter === "soldOut" ? " among sold-out dishes" : ""}.`
                            }
                            action={
                                <Button
                                    variant="outline"
                                    className="h-10"
                                    onClick={() => {
                                        setSearch("");
                                        setFilter("all");
                                    }}
                                >
                                    Show all dishes
                                </Button>
                            }
                        />
                    ) : (
                        <div className="space-y-6">
                            {groups.map((group) => {
                                const category = group.category;
                                const key = category?.id ?? "uncategorised";
                                // Counts use the full item list, not the filtered one, so "3 of 8" stays true while searching.
                                const all = category ? items.filter((i) => i.categoryId === category.id) : group.items;
                                const soldOutHere = all.filter(isSoldOut).length;
                                const allSoldOut = soldOutHere === all.length;
                                const busy = pendingCategory === key;
                                return (
                                    <section key={key} aria-labelledby={`cat-${key}`} className="overflow-hidden rounded-2xl border border-border bg-panel">
                                        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border px-4 py-3 sm:px-5">
                                            <div className="flex min-w-0 items-center gap-2.5">
                                                {category && hasCategoryIcon(category.icon) && (
                                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
                                                        <CategoryIconDisplay icon={category.icon} size="sm" />
                                                    </span>
                                                )}
                                                <div className="min-w-0">
                                                    <h2 id={`cat-${key}`} className="truncate text-sm font-semibold text-foreground">
                                                        {category?.name ?? "Uncategorised"}
                                                    </h2>
                                                    <p className="text-xs tabular-nums text-muted-foreground">
                                                        {all.length - soldOutHere} of {all.length} on the menu
                                                    </p>
                                                </div>
                                            </div>
                                            {category && all.length > 1 && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={busy}
                                                    onClick={() => setCategory(category, allSoldOut)}
                                                    className="h-8 text-xs"
                                                >
                                                    {busy ? (
                                                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
                                                    ) : null}
                                                    {allSoldOut ? "Put all back on the menu" : "Mark all sold out"}
                                                </Button>
                                            )}
                                        </header>
                                        <ul className="divide-y divide-border">
                                            {group.items.map((item) => {
                                                const soldOut = isSoldOut(item);
                                                const isPending = pending.has(item.id);
                                                return (
                                                    <li key={item.id}>
                                                        <label
                                                            className={cn(
                                                                "flex min-h-14 cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-secondary/40 sm:px-5",
                                                                soldOut && "bg-secondary/20",
                                                            )}
                                                        >
                                                            <DietMark preference={item.dietaryPreference} />
                                                            <span className="min-w-0 flex-1">
                                                                <span
                                                                    className={cn(
                                                                        "block truncate text-sm font-medium",
                                                                        soldOut ? "text-muted-foreground line-through decoration-muted-foreground/50" : "text-foreground",
                                                                    )}
                                                                >
                                                                    {item.name}
                                                                </span>
                                                                <span className="block text-xs tabular-nums text-muted-foreground">
                                                                    {formatMenuPrice(item.price)}
                                                                </span>
                                                            </span>
                                                            <span
                                                                className={cn(
                                                                    "hidden w-20 shrink-0 text-right text-xs font-medium sm:block",
                                                                    soldOut ? "text-muted-foreground" : "text-emerald-600 dark:text-emerald-400",
                                                                )}
                                                            >
                                                                {soldOut ? "Sold out" : "On the menu"}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                role="switch"
                                                                aria-checked={!soldOut}
                                                                aria-label={soldOut ? `Put ${item.name} back on the menu` : `Mark ${item.name} sold out`}
                                                                disabled={isPending}
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    void toggleItem(item);
                                                                }}
                                                                className={cn(
                                                                    "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:cursor-wait disabled:opacity-60",
                                                                    soldOut ? "bg-secondary" : "bg-emerald-500",
                                                                )}
                                                            >
                                                                <span
                                                                    className={cn(
                                                                        "inline-block h-6 w-6 rounded-full bg-white shadow transition-transform",
                                                                        soldOut ? "translate-x-0.5" : "translate-x-[22px]",
                                                                    )}
                                                                />
                                                            </button>
                                                        </label>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </section>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
