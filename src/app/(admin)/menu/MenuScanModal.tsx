"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Check, ImagePlus, Loader2, Sparkles, X } from "lucide-react";
import { api } from "@/lib/api";
import type { BulkMenuImportRow, MenuCategory, MenuItem } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { DietMark, formatMenuPrice } from "./menuDisplay";

/** Matches the API limit for the base64 request body. */
const MAX_MENU_PHOTO_BYTES = 8 * 1024 * 1024;
/** Matches the API. Gemini bills 768px tiles; 1536px stays inside four tiles. */
const MENU_SCAN_MAX_EDGE = 1536;
const MENU_SCAN_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"]);

function readBlobAsDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === "string") resolve(reader.result);
            else reject(new Error("Could not read the image."));
        };
        reader.onerror = () => reject(new Error("Could not read the file."));
        reader.readAsDataURL(blob);
    });
}

function parseImageDataUrl(dataUrl: string): { mimeType: string; imageBase64: string } | null {
    const match = /^data:([^;]+);base64,([\s\S]+)$/.exec(dataUrl);
    if (!match) return null;
    const declared = match[1].split(";")[0].trim().toLowerCase();
    return { mimeType: declared === "image/jpg" ? "image/jpeg" : declared, imageBase64: match[2] };
}

/** Draw onto a small canvas so phones never allocate a full-resolution canvas. */
async function shrinkMenuPhoto(file: File): Promise<Blob> {
    const bitmap = await createImageBitmap(file);
    try {
        const longest = Math.max(bitmap.width, bitmap.height);
        const scale = longest > MENU_SCAN_MAX_EDGE ? MENU_SCAN_MAX_EDGE / longest : 1;
        const width = Math.max(1, Math.round(bitmap.width * scale));
        const height = Math.max(1, Math.round(bitmap.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not prepare the image.");
        ctx.drawImage(bitmap, 0, 0, width, height);
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
        if (!blob) throw new Error("Could not prepare the image.");
        return blob;
    } finally {
        bitmap.close();
    }
}

const normalize = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();

type ScannedDish = {
    id: string;
    name: string;
    price: number;
    categoryName: string;
    description?: string;
    dietaryPreference?: BulkMenuImportRow["dietaryPreference"];
    alreadyOnMenu: boolean;
    selected: boolean;
};

type MenuScanModalProps = {
    open: boolean;
    onClose: () => void;
    existingItems: MenuItem[];
    categories: MenuCategory[];
    onSaved: (result: { created: number; categoriesCreated: number }) => void | Promise<void>;
};

export function MenuScanModal({ open, onClose, existingItems, categories, onSaved }: MenuScanModalProps) {
    const photoInputRef = useRef<HTMLInputElement>(null);
    const nextId = useRef(0);
    const [dishes, setDishes] = useState<ScannedDish[]>([]);
    const [photosScanned, setPhotosScanned] = useState(0);
    const [scanning, setScanning] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [confirmDiscard, setConfirmDiscard] = useState(false);

    const busy = scanning || saving;
    const selectedCount = dishes.filter((d) => d.selected).length;
    const duplicateCount = dishes.filter((d) => d.alreadyOnMenu).length;
    const allSelected = dishes.length > 0 && selectedCount === dishes.length;
    const existingSections = new Set(categories.map((c) => normalize(c.name)));

    const sections: { name: string; dishes: ScannedDish[] }[] = [];
    for (const dish of dishes) {
        const key = normalize(dish.categoryName);
        let section = sections.find((s) => normalize(s.name) === key);
        if (!section) {
            section = { name: dish.categoryName, dishes: [] };
            sections.push(section);
        }
        section.dishes.push(dish);
    }

    function reset() {
        setDishes([]);
        setPhotosScanned(0);
        setError(null);
        setNotice(null);
        setConfirmDiscard(false);
    }

    function requestClose() {
        if (busy) return;
        if (selectedCount > 0 && !confirmDiscard) {
            setConfirmDiscard(true);
            return;
        }
        reset();
        onClose();
    }

    function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        setError(null);
        setNotice(null);
        if (!file.type.startsWith("image/") || (file.type && !MENU_SCAN_MIME.has(file.type.toLowerCase()))) {
            setError("Choose a photo (JPEG, PNG or WebP).");
            return;
        }
        if (file.size > MAX_MENU_PHOTO_BYTES) {
            setError("This photo is larger than 8 MB. Choose a smaller photo.");
            return;
        }

        void (async () => {
            setScanning(true);
            try {
                let source: Blob = file;
                try {
                    source = await shrinkMenuPhoto(file);
                } catch {
                    source = file;
                }
                const parsed = parseImageDataUrl(await readBlobAsDataUrl(source));
                if (!parsed || !MENU_SCAN_MIME.has(parsed.mimeType)) {
                    setError("We couldn't open this photo. Try a different one.");
                    return;
                }
                const { items } = await api.extractMenuFromImage(parsed);

                const menuNames = new Set(existingItems.map((i) => normalize(i.name)));
                const listed = new Set(dishes.map((d) => `${normalize(d.name)}|${normalize(d.categoryName)}`));
                const added: ScannedDish[] = [];
                for (const item of items) {
                    const listKey = `${normalize(item.name)}|${normalize(item.categoryName ?? "")}`;
                    if (listed.has(listKey)) continue;
                    listed.add(listKey);
                    const alreadyOnMenu = menuNames.has(normalize(item.name));
                    added.push({
                        id: `scan-${nextId.current++}`,
                        name: item.name,
                        price: item.price,
                        categoryName: item.categoryName?.trim() || "General",
                        description: item.description,
                        dietaryPreference: item.dietaryPreference,
                        alreadyOnMenu,
                        selected: !alreadyOnMenu,
                    });
                }

                setPhotosScanned((n) => n + 1);
                setDishes((prev) => [...prev, ...added]);
                if (added.length === 0) {
                    setNotice("Every dish in this photo is already in the list below.");
                } else if (photosScanned > 0) {
                    setNotice(`Added ${added.length} dish${added.length === 1 ? "" : "es"} from this photo.`);
                }
            } catch (err) {
                const raw = err instanceof Error ? err.message : "";
                setError(
                    /too many requests/i.test(raw)
                        ? "You can scan 10 photos every 15 minutes. Wait a few minutes and try again."
                        : raw || "We couldn't scan this photo. Please try again.",
                );
            } finally {
                setScanning(false);
            }
        })();
    }

    async function save() {
        const picked = dishes.filter((d) => d.selected);
        if (picked.length === 0) return;
        setError(null);
        setSaving(true);
        try {
            const result = await api.bulkImportMenuItems({
                items: picked.map((d) => ({
                    name: d.name,
                    price: d.price,
                    categoryName: d.categoryName,
                    ...(d.description ? { description: d.description } : {}),
                    ...(d.dietaryPreference ? { dietaryPreference: d.dietaryPreference } : {}),
                })),
            });
            reset();
            onClose();
            await onSaved(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not add these dishes. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    function toggle(id: string) {
        setConfirmDiscard(false);
        setDishes((prev) => prev.map((d) => (d.id === id ? { ...d, selected: !d.selected } : d)));
    }

    function toggleAll() {
        setConfirmDiscard(false);
        setDishes((prev) => prev.map((d) => ({ ...d, selected: !allSelected })));
    }

    const hasDishes = dishes.length > 0;

    return (
        <AnimatePresence>
            {open && (
                <div
                    className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
                    onClick={requestClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: 10 }}
                        transition={{ duration: 0.18 }}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="menu-scan-title"
                        className="flex max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-border bg-panel shadow-2xl shadow-black/40 sm:max-h-[min(90dvh,48rem)] sm:rounded-2xl"
                    >
                        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
                            <div className="min-w-0">
                                <h3 id="menu-scan-title" className="text-lg font-semibold tracking-tight text-foreground">
                                    Scan your menu
                                </h3>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    {hasDishes
                                        ? `${dishes.length} dish${dishes.length === 1 ? "" : "es"} found in ${photosScanned} photo${photosScanned === 1 ? "" : "s"}. Untick anything you don't want.`
                                        : "Take a photo of your printed menu and we'll list the dishes for you."}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={requestClose}
                                disabled={busy}
                                className="-mr-2 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <input
                            ref={photoInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            disabled={busy}
                            onChange={handlePhoto}
                        />

                        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                            {error && (
                                <p role="alert" className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                                    {error}
                                </p>
                            )}
                            {notice && !error && (
                                <p role="status" className="mb-4 rounded-xl border border-border bg-secondary/60 px-4 py-3 text-sm text-foreground">
                                    {notice}
                                </p>
                            )}

                            {!hasDishes ? (
                                <button
                                    type="button"
                                    onClick={() => photoInputRef.current?.click()}
                                    disabled={busy}
                                    className="flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-background/50 px-6 py-12 text-center transition-colors hover:border-brand/50 hover:bg-brand/5 disabled:cursor-wait"
                                >
                                    {scanning ? (
                                        <>
                                            <Loader2 className="h-9 w-9 animate-spin text-brand" aria-hidden />
                                            <span className="text-base font-medium text-foreground">Reading your menu…</span>
                                            <span className="max-w-sm text-sm text-muted-foreground">
                                                This can take up to a minute. Keep this window open.
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                                                <Camera className="h-7 w-7" aria-hidden />
                                            </span>
                                            <span className="text-base font-medium text-foreground">Choose a menu photo</span>
                                            <span className="max-w-sm text-sm text-muted-foreground">
                                                One page per photo. Lay the menu flat, in good light, with the whole page in the frame.
                                            </span>
                                        </>
                                    )}
                                </button>
                            ) : (
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm text-muted-foreground">
                                            <span className="font-medium text-foreground">{selectedCount}</span> of {dishes.length} selected
                                            {duplicateCount > 0 && ` · ${duplicateCount} already on your menu`}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={toggleAll}
                                            disabled={busy}
                                            className="cursor-pointer text-sm font-medium text-brand hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {allSelected ? "Clear all" : "Select all"}
                                        </button>
                                    </div>

                                    {sections.map((section) => (
                                        <section key={section.name}>
                                            <div className="mb-2 flex items-center gap-2">
                                                <h4 className="text-sm font-semibold text-foreground">{section.name}</h4>
                                                {!existingSections.has(normalize(section.name)) && (
                                                    <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
                                                        New section
                                                    </span>
                                                )}
                                            </div>
                                            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-background/40">
                                                {section.dishes.map((dish) => (
                                                    <li key={dish.id}>
                                                        <label
                                                            className={cn(
                                                                "flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-secondary/50",
                                                                !dish.selected && "opacity-60",
                                                                busy && "pointer-events-none",
                                                            )}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={dish.selected}
                                                                onChange={() => toggle(dish.id)}
                                                                className="sr-only"
                                                            />
                                                            <span
                                                                aria-hidden
                                                                className={cn(
                                                                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                                                                    dish.selected ? "border-brand bg-brand text-white" : "border-border bg-background",
                                                                )}
                                                            >
                                                                {dish.selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                                                            </span>
                                                            <span className="min-w-0 flex-1">
                                                                <span className="flex items-center gap-2">
                                                                    <DietMark preference={dish.dietaryPreference ?? "NONE"} />
                                                                    <span className="truncate font-medium text-foreground">{dish.name}</span>
                                                                </span>
                                                                {dish.description && (
                                                                    <span className="mt-0.5 block truncate text-sm text-muted-foreground">{dish.description}</span>
                                                                )}
                                                                {dish.alreadyOnMenu && (
                                                                    <span className="mt-1 inline-block rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                                                                        Already on your menu
                                                                    </span>
                                                                )}
                                                            </span>
                                                            <span className="shrink-0 font-semibold tabular-nums text-foreground">
                                                                {formatMenuPrice(dish.price)}
                                                            </span>
                                                        </label>
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>
                                    ))}
                                </div>
                            )}
                        </div>

                        {hasDishes && (
                            <div className="shrink-0 border-t border-border px-5 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-3 sm:px-6 sm:pb-4">
                                {confirmDiscard ? (
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-sm text-foreground">Close without adding these dishes?</p>
                                        <div className="flex gap-2">
                                            <Button type="button" variant="outline" className="h-10 flex-1 sm:flex-none" onClick={() => setConfirmDiscard(false)}>
                                                Keep reviewing
                                            </Button>
                                            <Button type="button" variant="destructive" className="h-10 flex-1 sm:flex-none" onClick={requestClose}>
                                                Discard
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-11"
                                            disabled={busy}
                                            onClick={() => photoInputRef.current?.click()}
                                        >
                                            {scanning ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                                            ) : (
                                                <ImagePlus className="mr-2 h-4 w-4" aria-hidden />
                                            )}
                                            {scanning ? "Reading next page…" : "Scan another page"}
                                        </Button>
                                        <Button type="button" className="h-11" disabled={busy || selectedCount === 0} onClick={save}>
                                            {saving ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                                            ) : (
                                                <Sparkles className="mr-2 h-4 w-4" aria-hidden />
                                            )}
                                            {saving
                                                ? "Adding…"
                                                : selectedCount === 0
                                                  ? "Select dishes to add"
                                                  : `Add ${selectedCount} dish${selectedCount === 1 ? "" : "es"} to menu`}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
