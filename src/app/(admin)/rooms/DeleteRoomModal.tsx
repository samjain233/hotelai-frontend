"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Trash2 } from "lucide-react";
import type { Room } from "@/lib/types";
import { Button } from "@/components/ui/Button";

interface DeleteRoomModalProps {
    room: Room | null;
    onClose: () => void;
    /** Throw to keep the dialog open and show the message. */
    onConfirm: (room: Room) => Promise<void>;
}

export function DeleteRoomModal({ room, onClose, onConfirm }: DeleteRoomModalProps) {
    return <AnimatePresence>{room && <DeleteRoomDialog key={room.id} room={room} onClose={onClose} onConfirm={onConfirm} />}</AnimatePresence>;
}

function DeleteRoomDialog({ room, onClose, onConfirm }: DeleteRoomModalProps & { room: Room }) {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const orderCount = room._count?.orders ?? 0;
    // Orders and service requests keep a hard reference to the room, so the database refuses the delete.
    const blockedReason = room.isOccupied
        ? "A guest is checked in to this room. Check them out from Front desk first."
        : orderCount > 0
          ? `This room has ${orderCount} order${orderCount === 1 ? "" : "s"} on record, so it can't be deleted. Keep it to preserve the guest bill history.`
          : null;

    async function confirm() {
        setDeleting(true);
        setError(null);
        try {
            await onConfirm(room);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Could not delete the room");
            setDeleting(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm pb-[env(safe-area-inset-bottom,0px)]"
            onClick={() => !deleting && onClose()}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.18 }}
                onClick={(e) => e.stopPropagation()}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="delete-room-title"
                aria-describedby="delete-room-desc"
                className="w-full max-w-sm bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl"
            >
                <div className="flex items-start gap-3 p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                        <AlertTriangle className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0">
                        <h3 id="delete-room-title" className="font-semibold text-foreground">
                            Delete room {room.number}?
                        </h3>
                        <p id="delete-room-desc" className="mt-1 text-sm text-muted-foreground">
                            {blockedReason ?? "Its QR code stops working straight away, so remove any printed card from the room."}
                        </p>
                        {error && (
                            <p className="mt-2 text-sm text-destructive" role="alert">
                                {error}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex flex-col-reverse sm:flex-row gap-2 border-t border-border p-4">
                    <Button type="button" variant="outline" className="flex-1 min-h-11" onClick={onClose} disabled={deleting}>
                        {blockedReason ? "Close" : "Cancel"}
                    </Button>
                    {!blockedReason && (
                        <Button type="button" variant="destructive" className="flex-1 min-h-11" loading={deleting} onClick={() => void confirm()}>
                            {!deleting && <Trash2 className="w-4 h-4 mr-1.5" />}
                            Delete room
                        </Button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
