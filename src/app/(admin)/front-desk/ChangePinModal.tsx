"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { KeyRound, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import type { Room } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { randomPin } from "./frontDesk";

interface ChangePinModalProps {
    room: Room | null;
    onClose: () => void;
    onChanged: () => Promise<unknown>;
}

export function ChangePinModal(props: ChangePinModalProps) {
    return <AnimatePresence>{props.room && <ChangePinDialog key={props.room.id} {...props} room={props.room} />}</AnimatePresence>;
}

function ChangePinDialog({ room, onClose, onChanged }: ChangePinModalProps & { room: Room }) {
    const [pin, setPin] = useState(randomPin);
    const [saving, setSaving] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!/^\d{4}$/.test(pin)) {
            toast.error("PIN must be a 4-digit number");
            return;
        }
        setSaving(true);
        try {
            const res = await api.regenerateRoomPin(room.id, pin);
            toast.success(`Room ${room.number} has a new PIN: ${res.pin}`);
            await onChanged();
            onClose();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Could not change the PIN");
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
                aria-labelledby="change-pin-title"
                className="w-full max-w-sm bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl"
            >
                <form onSubmit={handleSubmit}>
                    <div className="flex items-start gap-3 p-5">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <KeyRound className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <h3 id="change-pin-title" className="font-semibold text-foreground">
                                New PIN for room {room.number}
                            </h3>
                            <p className="mt-0.5 text-xs text-muted-foreground">The old PIN stops working, and guests must enter the new one on their phones to keep ordering.</p>
                            <div className="mt-3 flex gap-2">
                                <Input
                                    aria-label="New PIN"
                                    inputMode="numeric"
                                    maxLength={4}
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                    className="h-12 text-center font-mono text-2xl font-bold tracking-[0.4em]"
                                    autoFocus
                                    required
                                />
                                <Button type="button" variant="outline" onClick={() => setPin(randomPin())} className="h-12 px-3" aria-label="New random PIN" title="New random PIN">
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row gap-2 border-t border-border p-4">
                        <Button type="button" variant="outline" className="flex-1 min-h-11" onClick={onClose} disabled={saving}>
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1 min-h-11" loading={saving}>
                            Save PIN
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
