"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Check, ChevronDown, LogIn, RefreshCw, Users, X } from "lucide-react";
import { api } from "@/lib/api";
import type { Room } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { randomPin } from "./frontDesk";

interface CheckinModalProps {
    room: Room | null;
    rooms: Room[];
    onClose: () => void;
    onCheckedIn: () => Promise<unknown>;
}

export function CheckinModal(props: CheckinModalProps) {
    return <AnimatePresence>{props.room && <CheckinDialog key={props.room.id} {...props} room={props.room} />}</AnimatePresence>;
}

function CheckinDialog({ room, rooms, onClose, onCheckedIn }: CheckinModalProps & { room: Room }) {
    const [pin, setPin] = useState(randomPin);
    const [guestName, setGuestName] = useState("");
    const [guestPhone, setGuestPhone] = useState("");
    const [guestEmail, setGuestEmail] = useState("");
    const [linkedRoomIds, setLinkedRoomIds] = useState<string[]>([]);
    const [showGroup, setShowGroup] = useState(false);
    const [saving, setSaving] = useState(false);

    const vacantOthers = useMemo(() => rooms.filter((r) => !r.isOccupied && r.id !== room.id), [rooms, room.id]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!/^\d{4}$/.test(pin.trim())) {
            toast.error("PIN must be a 4-digit number");
            return;
        }
        setSaving(true);
        try {
            const res = await api.checkinRoom(room.id, {
                pin: pin.trim(),
                guestName: guestName.trim() || undefined,
                guestPhone: guestPhone.trim() || undefined,
                guestEmail: guestEmail.trim() || undefined,
                additionalRoomIds: linkedRoomIds.length > 0 ? linkedRoomIds : undefined,
            });
            toast.success(
                linkedRoomIds.length > 0
                    ? `${linkedRoomIds.length + 1} rooms checked in · PIN ${res.pin}`
                    : `Room ${room.number} checked in · PIN ${res.pin}`,
            );
            await onCheckedIn();
            onClose();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Could not check in");
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
                aria-labelledby="checkin-title"
                className="w-full max-w-md max-h-[92dvh] overflow-y-auto bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl text-foreground"
            >
                <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <LogIn className="h-5 w-5" />
                        </span>
                        <div>
                            <h3 id="checkin-title" className="font-semibold">
                                Check in room {room.number}
                            </h3>
                            <p className="text-xs text-muted-foreground">The guest uses the PIN to order and request services.</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 p-5">
                    <div className="space-y-1.5">
                        <label htmlFor="checkin-pin" className="text-sm font-medium">
                            Stay PIN
                        </label>
                        <div className="flex gap-2">
                            <Input
                                id="checkin-pin"
                                inputMode="numeric"
                                maxLength={4}
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                className="h-12 text-center font-mono text-2xl font-bold tracking-[0.4em]"
                                required
                            />
                            <Button type="button" variant="outline" onClick={() => setPin(randomPin())} className="h-12 px-3" title="New random PIN" aria-label="New random PIN">
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">Write it on the key card or tell the guest at the desk.</p>
                    </div>

                    <div className="space-y-3 rounded-xl border border-border bg-panel p-3">
                        <p className="text-xs font-medium text-muted-foreground">Guest details (optional, shown on the bill)</p>
                        <Input
                            aria-label="Guest name"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            placeholder="Guest name"
                            className="h-10"
                            autoComplete="off"
                        />
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <Input
                                aria-label="Phone"
                                type="tel"
                                value={guestPhone}
                                onChange={(e) => setGuestPhone(e.target.value)}
                                placeholder="Phone"
                                className="h-10"
                                autoComplete="off"
                            />
                            <Input
                                aria-label="Email"
                                type="email"
                                value={guestEmail}
                                onChange={(e) => setGuestEmail(e.target.value)}
                                placeholder="Email"
                                className="h-10"
                                autoComplete="off"
                            />
                        </div>
                    </div>

                    {vacantOthers.length > 0 && (
                        <div className="rounded-xl border border-border bg-panel">
                            <button
                                type="button"
                                onClick={() => setShowGroup((v) => !v)}
                                aria-expanded={showGroup}
                                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium"
                            >
                                <span className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    Booking more than one room?
                                    {linkedRoomIds.length > 0 && (
                                        <span className="rounded-full bg-brand/15 px-1.5 py-0.5 text-[11px] font-semibold text-foreground tabular-nums">
                                            +{linkedRoomIds.length}
                                        </span>
                                    )}
                                </span>
                                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", showGroup && "rotate-180")} />
                            </button>
                            {showGroup && (
                                <div className="space-y-2 border-t border-border px-3 pb-3 pt-2.5">
                                    <p className="text-xs text-muted-foreground">
                                        Linked rooms share this PIN and can be billed together on one group folio.
                                    </p>
                                    <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto">
                                        {vacantOthers.map((r) => {
                                            const selected = linkedRoomIds.includes(r.id);
                                            return (
                                                <button
                                                    key={r.id}
                                                    type="button"
                                                    aria-pressed={selected}
                                                    onClick={() =>
                                                        setLinkedRoomIds((prev) => (selected ? prev.filter((id) => id !== r.id) : [...prev, r.id]))
                                                    }
                                                    className={cn(
                                                        "flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium tabular-nums transition-colors",
                                                        selected
                                                            ? "border-primary bg-primary text-primary-foreground"
                                                            : "border-border bg-background text-muted-foreground hover:text-foreground",
                                                    )}
                                                >
                                                    {r.number}
                                                    {selected && <Check className="h-3 w-3" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row">
                        <Button type="button" variant="outline" className="min-h-11 flex-1" onClick={onClose} disabled={saving}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={saving} className="min-h-11 flex-1 bg-emerald-600 text-white hover:bg-emerald-700">
                            {linkedRoomIds.length > 0 ? `Check in ${linkedRoomIds.length + 1} rooms` : "Check in"}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
