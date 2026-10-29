"use client";

import Link from "next/link";
import { Edit2, Image as ImageIcon, Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MenuItem } from "@/lib/types";
import { DietMark, formatMenuPrice } from "./menuDisplay";

interface MenuItemCardProps {
    item: MenuItem;
    categoryName: string;
    onEdit: (item: MenuItem) => void;
    onDelete: (item: MenuItem) => void;
}

export function MenuItemCard({ item, categoryName, onEdit, onDelete }: MenuItemCardProps) {
    const soldOut = item.available === false;
    return (
        <article
            className={cn(
                "group flex flex-col overflow-hidden rounded-2xl border border-border bg-panel transition-colors hover:border-foreground/20",
                soldOut && "opacity-75",
            )}
        >
            <button
                type="button"
                onClick={() => onEdit(item)}
                className="relative block aspect-[16/10] w-full cursor-pointer overflow-hidden bg-secondary"
                aria-label={`Edit ${item.name}`}
            >
                {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={item.imageUrl}
                        alt=""
                        loading="lazy"
                        className={cn(
                            "h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]",
                            soldOut && "grayscale",
                        )}
                    />
                ) : (
                    <span className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-muted-foreground">
                        <ImageIcon className="h-6 w-6 opacity-40" />
                        <span className="text-xs">Add a photo</span>
                    </span>
                )}
                <span className="absolute left-3 top-3 flex items-center gap-1.5">
                    <DietMark preference={item.dietaryPreference} />
                    {item.chefRecommended && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                            <Sparkles className="h-3 w-3 text-brand" /> Chef&apos;s pick
                        </span>
                    )}
                </span>
                {soldOut && (
                    <span className="absolute right-3 top-3 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                        Sold out
                    </span>
                )}
            </button>

            <div className="flex flex-1 flex-col p-4">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{categoryName}</p>
                <div className="mt-1 flex items-start justify-between gap-3">
                    <h3 className="line-clamp-2 font-semibold leading-snug text-foreground">{item.name}</h3>
                    <span className="shrink-0 font-semibold tabular-nums text-foreground">{formatMenuPrice(item.price)}</span>
                </div>
                {item.description ? (
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                ) : (
                    <p className="mt-1.5 text-sm italic text-muted-foreground/70">No description</p>
                )}

                <div className="min-h-4 flex-1" />
                <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
                    {soldOut ? (
                        <Link
                            href="/menu/availability"
                            className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                            title="Change in Availability"
                        >
                            Sold out · manage
                        </Link>
                    ) : (
                        <span className="text-xs text-muted-foreground">{item.chefRecommended ? "Chef's pick" : "\u00a0"}</span>
                    )}
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => onEdit(item)}
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            aria-label={`Edit ${item.name}`}
                        >
                            <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => onDelete(item)}
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                            aria-label={`Delete ${item.name}`}
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
}
