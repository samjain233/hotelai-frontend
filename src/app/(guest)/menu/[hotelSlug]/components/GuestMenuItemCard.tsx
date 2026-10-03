"use client";

import { cn } from "@/lib/utils";
import { MenuItem } from "@/lib/types";
import { GuestMenuItemInsights } from "../GuestMenuItemInsights";
import { useGuestMenuContext } from "./GuestMenuContext";
import { formatPrice, GuestMenuDietMark, GuestMenuItemAction } from "./GuestMenuItemParts";

interface GuestMenuItemCardProps {
    item: MenuItem;
    itemIndex: number;
    isPriorityImage: boolean;
    expandedDescId: string | null;
    setExpandedDescId: React.Dispatch<React.SetStateAction<string | null>>;
}

export function GuestMenuItemCard({
    item,
    itemIndex,
    isPriorityImage,
    expandedDescId,
    setExpandedDescId,
}: GuestMenuItemCardProps) {
    const ctx = useGuestMenuContext();

    const desc = item.description?.trim() ?? "";
    const descLong = desc.length > 72;
    const descOpen = expandedDescId === item.id;
    const imageSrc = item.imageUrl?.trim() ?? "";
    const hasImage = imageSrc.length > 0;
    const actionBlock = <GuestMenuItemAction item={item} />;

    return (
        <li
            className="relative z-0 flex items-center justify-between gap-3.5 py-4 first:pt-0 animate-fade-in-up"
            style={{ animationDelay: `${itemIndex * 40}ms` }}
        >
            <div className="min-w-0 flex-1">
                <div className="flex gap-2">
                    <div className="mt-0.5 shrink-0">
                        <GuestMenuDietMark preference={item.dietaryPreference} placeholder />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-[15px] font-bold leading-snug text-[var(--guest-text)]" title={item.name}>
                            {item.name}
                        </h3>
                        <p className="mt-1 text-sm font-semibold text-[var(--guest-accent)]">{formatPrice(item.price)}</p>
                        <GuestMenuItemInsights hotel={ctx.hotel} item={item} />
                        {desc ? (
                            <div className="mt-1.5">
                                <p
                                    className={cn(
                                        "text-[13px] leading-relaxed text-[var(--guest-text-70)]",
                                        !descOpen && descLong && "line-clamp-2",
                                    )}
                                >
                                    {desc}
                                </p>
                                {descLong ? (
                                    <button
                                        type="button"
                                        className="mt-0.5 text-xs font-medium text-[var(--guest-accent-90)] hover:opacity-80"
                                        onClick={() => setExpandedDescId((id) => (id === item.id ? null : item.id))}
                                    >
                                        {descOpen ? "less" : "…more"}
                                    </button>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
            {hasImage ? (
                <div className={cn(
                    "relative flex w-[114px] sm:w-[124px] shrink-0 flex-col items-center self-start",
                    ctx.digitalOrderingEnabled && "pb-3"
                )}>
                    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[var(--guest-surface)] ring-1 ring-[var(--guest-line)] shadow-sm">
                        {/* Menu images are arbitrary hotel URLs; <img> avoids next/image domain config. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={imageSrc}
                            alt=""
                            width={240}
                            height={240}
                            loading={isPriorityImage ? "eager" : "lazy"}
                            decoding="async"
                            fetchPriority={isPriorityImage ? "high" : "auto"}
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-10">
                        {actionBlock}
                    </div>
                </div>
            ) : (
                <div className="flex w-[114px] sm:w-[124px] shrink-0 items-center justify-center self-center">
                    {actionBlock}
                </div>
            )}
        </li>
    );
}
