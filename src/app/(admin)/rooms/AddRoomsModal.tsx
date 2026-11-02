"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { api } from "@/lib/api";
import type { Room } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MAX_ROOMS_PER_BATCH, parseRoomNumbersInput } from "@/lib/parseRoomNumbersInput";
import { cn } from "@/lib/utils";

const PREVIEW_LIMIT = 30;

interface AddRoomsModalProps {
    open: boolean;
    onClose: () => void;
    rooms: Room[];
    /** Floor to pre-fill, e.g. when adding from a floor section. */
    defaultFloor?: string;
    onCreated: () => Promise<unknown>;
}

export function AddRoomsModal(props: AddRoomsModalProps) {
    return (
        <AnimatePresence>
            {props.open && <AddRoomsDialog key={props.defaultFloor ?? ""} {...props} />}
        </AnimatePresence>
    );
}

function AddRoomsDialog({ onClose, rooms, defaultFloor, onCreated }: AddRoomsModalProps) {
    const [numbersInput, setNumbersInput] = useState("");
    const [floor, setFloor] = useState(defaultFloor ?? "");
    const [saving, setSaving] = useState(false);

    const existing = useMemo(() => new Set(rooms.map((r) => r.number.toLowerCase())), [rooms]);
    const knownFloors = useMemo(
        () =>
            Array.from(new Set(rooms.map((r) => r.floor?.trim()).filter((f): f is string => Boolean(f)))).sort((a, b) =>
                a.localeCompare(b, undefined, { numeric: true }),
            ),
        [rooms],
    );

    const parsed = useMemo(() => (numbersInput.trim() ? parseRoomNumbersInput(numbersInput) : null), [numbersInput]);
    const toCreate = parsed?.numbers.filter((n) => !existing.has(n.toLowerCase())) ?? [];
    const skipped = parsed?.numbers.filter((n) => existing.has(n.toLowerCase())) ?? [];

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!parsed || parsed.error) {
            toast.error(parsed?.error ?? "Enter at least one room number.");
            return;
        }
        if (toCreate.length === 0) {
            toast.error(skipped.length === 1 ? `Room ${skipped[0]} already exists.` : "All of these rooms already exist.");
            return;
        }
        setSaving(true);
        try {
            const f = floor.trim() || undefined;
            if (toCreate.length === 1) await api.createRoom({ number: toCreate[0], floor: f });
            else await api.createBulkRooms(toCreate.map((number) => ({ number, floor: f })));
            await onCreated();
            toast.success(
                `${toCreate.length === 1 ? `Room ${toCreate[0]} added` : `${toCreate.length} rooms added`}${
                    skipped.length ? ` · ${skipped.length} already existed` : ""
                }`,
            );
            onClose();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Could not add rooms");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm pb-[env(safe-area-inset-bottom,0px)]"
            onClick={() => !saving && onClose()}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.18 }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-rooms-title"
                className="w-full max-w-md max-h-[90dvh] overflow-y-auto bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl"
            >
                <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border">
                    <div>
                        <h3 id="add-rooms-title" className="font-semibold text-foreground">
                            Add rooms
                        </h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">Each room gets its own QR code straight away.</p>
                    </div>
                    <button
                        type="button"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-5">
                    <div className="space-y-1.5">
                        <label htmlFor="add-room-numbers" className="text-sm font-medium text-foreground">
                            Room numbers
                        </label>
                        <Input
                            id="add-room-numbers"
                            placeholder="e.g. 101-110, 201"
                            value={numbersInput}
                            onChange={(e) => setNumbersInput(e.target.value)}
                            required
                            autoFocus
                            autoComplete="off"
                            className="h-11"
                        />
                        <p className="text-xs text-muted-foreground">
                            One room <Code>101</Code>, a list <Code>101, 102</Code> or a range <Code>101-110</Code>. Up to {MAX_ROOMS_PER_BATCH} at
                            once.
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="add-room-floor" className="text-sm font-medium text-foreground">
                            Floor <span className="font-normal text-muted-foreground">(optional)</span>
                        </label>
                        <Input
                            id="add-room-floor"
                            placeholder="e.g. 1, Ground, Annexe"
                            value={floor}
                            onChange={(e) => setFloor(e.target.value)}
                            autoComplete="off"
                            className="h-11"
                        />
                        {knownFloors.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {knownFloors.map((f) => (
                                    <button
                                        key={f}
                                        type="button"
                                        onClick={() => setFloor(f)}
                                        aria-pressed={floor.trim() === f}
                                        className={cn(
                                            "rounded-md border px-2 py-1 text-xs transition-colors",
                                            floor.trim() === f
                                                ? "border-brand/50 bg-brand/10 text-foreground"
                                                : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground",
                                        )}
                                    >
                                        Floor {f}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {parsed && (
                        <div className="rounded-xl border border-border bg-panel p-3">
                            {parsed.error ? (
                                <p className="text-xs text-destructive" role="alert">
                                    {parsed.error}
                                </p>
                            ) : (
                                <>
                                    <p className="text-xs font-medium text-foreground">
                                        {toCreate.length === 0
                                            ? "Nothing new to add"
                                            : `${toCreate.length} new room${toCreate.length === 1 ? "" : "s"}${floor.trim() ? ` on floor ${floor.trim()}` : ""}`}
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {parsed.numbers.slice(0, PREVIEW_LIMIT).map((n) => {
                                            const exists = existing.has(n.toLowerCase());
                                            return (
                                                <span
                                                    key={n}
                                                    title={exists ? "Already exists — will be skipped" : undefined}
                                                    className={cn(
                                                        "rounded-md px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
                                                        exists
                                                            ? "bg-secondary/40 text-muted-foreground line-through decoration-muted-foreground/60"
                                                            : "bg-brand/10 text-foreground ring-1 ring-brand/25",
                                                    )}
                                                >
                                                    {n}
                                                </span>
                                            );
                                        })}
                                        {parsed.numbers.length > PREVIEW_LIMIT && (
                                            <span className="px-1.5 py-0.5 text-[11px] text-muted-foreground">
                                                +{parsed.numbers.length - PREVIEW_LIMIT} more
                                            </span>
                                        )}
                                    </div>
                                    {skipped.length > 0 && (
                                        <p className="mt-2 text-[11px] text-muted-foreground">
                                            {skipped.length} already exist{skipped.length === 1 ? "s" : ""} and will be skipped.
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                        <Button type="button" variant="outline" className="flex-1 min-h-11" onClick={onClose} disabled={saving}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={saving} disabled={!parsed || !!parsed.error || toCreate.length === 0} className="flex-1 min-h-11">
                            {!saving && <Plus className="w-4 h-4 mr-1.5" />}
                            {toCreate.length > 1 ? `Add ${toCreate.length} rooms` : "Add room"}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

function Code({ children }: { children: React.ReactNode }) {
    return <code className="rounded bg-secondary px-1 py-0.5 text-[11px] text-foreground">{children}</code>;
}
