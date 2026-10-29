"use client";

import { Edit2, FolderOpen, Trash2 } from "lucide-react";
import { CategoryIconDisplay, hasCategoryIcon } from "@/lib/categoryIcons";
import type { MenuCategory } from "@/lib/types";
import { formatCategorySchedule } from "./menuForms";

interface CategoryCardProps {
    category: MenuCategory;
    /** Clicking the name area — used to filter the dishes view by this category. */
    onSelect: (category: MenuCategory) => void;
    onEdit: (category: MenuCategory) => void;
    onDelete: (category: MenuCategory) => void;
}

export function CategoryCard({ category: cat, onSelect, onEdit, onDelete }: CategoryCardProps) {
    const count = cat._count?.items ?? 0;
    return (
        <article className="flex items-center gap-4 rounded-2xl border border-border bg-panel p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
                {hasCategoryIcon(cat.icon) ? (
                    <CategoryIconDisplay icon={cat.icon} size="lg" className="text-brand" />
                ) : (
                    <FolderOpen className="h-5 w-5 text-muted-foreground" />
                )}
            </div>
            <button type="button" onClick={() => onSelect(cat)} className="min-w-0 flex-1 cursor-pointer text-left">
                <h3 className="truncate font-semibold text-foreground">{cat.name}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    {count} dish{count !== 1 ? "es" : ""}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{formatCategorySchedule(cat)}</p>
            </button>
            <div className="flex shrink-0 items-center gap-1">
                <button
                    type="button"
                    onClick={() => onEdit(cat)}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    aria-label={`Edit ${cat.name}`}
                >
                    <Edit2 className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={() => onDelete(cat)}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                    aria-label={`Delete ${cat.name}`}
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        </article>
    );
}
