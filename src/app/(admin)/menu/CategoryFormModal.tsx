"use client";

import type { Dispatch, SetStateAction } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CATEGORY_ICON_MAP, CATEGORY_ICON_PICKER_OPTIONS } from "@/lib/categoryIcons";
import { cn } from "@/lib/utils";
import type { MenuCategory } from "@/lib/types";
import { ISO_WEEKDAY_OPTIONS, toggleIsoDay, type CategoryFormState } from "./menuForms";

interface CategoryFormModalProps {
    open: boolean;
    editing: MenuCategory | null;
    form: CategoryFormState;
    setForm: Dispatch<SetStateAction<CategoryFormState>>;
    saving: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
}

/** New / edit category: name, serving schedule and icon. */
export function CategoryFormModal({ open, editing, form, setForm, saving, onClose, onSubmit }: CategoryFormModalProps) {
    const update = (patch: Partial<CategoryFormState>) => setForm((prev) => ({ ...prev, ...patch }));

    return (
        <AnimatePresence>
            {open && (
                <div
                    className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm pb-[env(safe-area-inset-bottom,0px)]"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="category-modal-title"
                        className="w-full max-w-lg max-h-[90dvh] overflow-y-auto bg-card border border-border rounded-t-2xl sm:rounded-xl shadow-2xl"
                    >
                        <div className="flex justify-between items-center p-5 border-b border-border bg-muted/20">
                            <h3 id="category-modal-title" className="font-semibold text-foreground">
                                {editing ? "Edit category" : "New category"}
                            </h3>
                            <button type="button" onClick={onClose} aria-label="Close">
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>
                        <form onSubmit={onSubmit} className="p-6 space-y-4">
                            <Input placeholder="Category Name" value={form.name} onChange={(e) => update({ name: e.target.value })} required />

                            <div className="rounded-xl border border-border/80 bg-secondary/20 p-4 space-y-3">
                                <p className="text-xs font-semibold text-foreground">Serving schedule (optional)</p>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                    Times use your hotel&apos;s timezone from <strong className="text-foreground">Settings</strong> (default India IST).
                                    Leave times empty to show this category all day. Set both start and end for a daily window (supports overnight e.g.
                                    22:00–02:00).
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label htmlFor="category-serve-start" className="text-[10px] font-medium text-muted-foreground block mb-1">
                                            From (HH:mm)
                                        </label>
                                        <Input
                                            id="category-serve-start"
                                            placeholder="07:00"
                                            value={form.serveTimeStart}
                                            onChange={(e) => update({ serveTimeStart: e.target.value })}
                                            className="h-9 font-mono text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="category-serve-end" className="text-[10px] font-medium text-muted-foreground block mb-1">
                                            To (HH:mm)
                                        </label>
                                        <Input
                                            id="category-serve-end"
                                            placeholder="11:00"
                                            value={form.serveTimeEnd}
                                            onChange={(e) => update({ serveTimeEnd: e.target.value })}
                                            className="h-9 font-mono text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-medium text-muted-foreground mb-1.5">Days (empty = every day)</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {ISO_WEEKDAY_OPTIONS.map(({ iso, label }) => {
                                            const on = form.serveDaysOfWeek.includes(iso);
                                            return (
                                                <button
                                                    key={iso}
                                                    type="button"
                                                    aria-pressed={on}
                                                    onClick={() => update({ serveDaysOfWeek: toggleIsoDay(form.serveDaysOfWeek, iso) })}
                                                    className={cn(
                                                        "rounded-md border px-2 py-1 text-[10px] font-semibold",
                                                        on ? "border-primary/50 bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-primary/30",
                                                    )}
                                                >
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="category-icon" className="text-xs font-medium text-muted-foreground">
                                    Category icon
                                </label>
                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 p-3 rounded-xl bg-secondary/40 border border-border max-h-[240px] overflow-y-auto">
                                    {CATEGORY_ICON_PICKER_OPTIONS.map(({ key, label }) => {
                                        const LucideIcon = CATEGORY_ICON_MAP[key];
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                title={label}
                                                onClick={() => update({ icon: key })}
                                                className={cn(
                                                    "flex flex-col items-center gap-1 py-2 px-1 rounded-xl border border-transparent transition-all hover:bg-secondary",
                                                    form.icon === key && "ring-2 ring-primary bg-primary/15 border-border shadow-sm",
                                                )}
                                            >
                                                <LucideIcon className="w-5 h-5 text-foreground shrink-0" />
                                                <span className="text-[9px] text-muted-foreground text-center leading-tight line-clamp-2 px-0.5">{label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <Input
                                    id="category-icon"
                                    placeholder="Advanced: icon key (e.g. pizza) or emoji…"
                                    value={form.icon}
                                    onChange={(e) => update({ icon: e.target.value })}
                                    className="text-sm font-mono"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button type="submit" loading={saving} className="flex-1">
                                    {editing ? "Save" : "Create"}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
