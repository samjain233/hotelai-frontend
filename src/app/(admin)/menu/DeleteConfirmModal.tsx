"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { DELETE_CONFIRM_WORD } from "./menuForms";

export interface DeleteTarget {
    type: "item" | "category" | "tag";
    id: string;
    name: string;
}

interface DeleteConfirmModalProps {
    target: DeleteTarget | null;
    onClose: () => void;
    /** Perform the delete. Throw to keep the dialog open and show the message. */
    onConfirm: (target: DeleteTarget) => Promise<void>;
}

/** "Type delete to confirm" dialog shared by items, categories and custom tags. */
export function DeleteConfirmModal({ target, onClose, onConfirm }: DeleteConfirmModalProps) {
    return (
        <AnimatePresence>
            {target && <DeleteConfirmDialog key={`${target.type}-${target.id}`} target={target} onClose={onClose} onConfirm={onConfirm} />}
        </AnimatePresence>
    );
}

function DeleteConfirmDialog({ target, onClose, onConfirm }: DeleteConfirmModalProps & { target: DeleteTarget }) {
    const [input, setInput] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const phraseMatches = input.trim().toLowerCase() === DELETE_CONFIRM_WORD;

    async function confirm() {
        if (!phraseMatches || deleting) return;
        setDeleting(true);
        setError(null);
        try {
            await onConfirm(target);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong");
            setDeleting(false);
        }
    }

    const title = target.type === "item" ? "Delete menu item?" : target.type === "category" ? "Delete category?" : "Delete tag?";

    return (
        <div
            className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)]"
            onClick={() => {
                if (!deleting) onClose();
            }}
            role="presentation"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl shadow-black/40 max-h-[90dvh] overflow-y-auto"
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-confirm-title"
                aria-describedby="delete-confirm-desc"
            >
                <div className="px-6 pt-6 pb-4 border-b border-border bg-destructive/5">
                    <div className="flex items-start gap-3">
                        <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                            <AlertTriangle className="h-5 w-5" aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 id="delete-confirm-title" className="text-lg font-semibold text-foreground">
                                {title}
                            </h3>
                            <p id="delete-confirm-desc" className="mt-1 text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">&ldquo;{target.name}&rdquo;</span>{" "}
                                {target.type === "item" ? (
                                    <>will be removed from your menu. This cannot be undone.</>
                                ) : target.type === "category" ? (
                                    <>
                                        and <strong className="text-foreground">all items in this category</strong> will be permanently removed. This
                                        cannot be undone.
                                    </>
                                ) : (
                                    <>will be permanently removed from your custom tags. This cannot be undone.</>
                                )}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={deleting}
                            className="shrink-0 p-2 -m-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-50"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="delete-confirm-input" className="text-sm font-medium text-foreground block mb-1.5">
                            Type <span className="font-mono text-destructive">{DELETE_CONFIRM_WORD}</span> to confirm
                        </label>
                        <Input
                            id="delete-confirm-input"
                            autoComplete="off"
                            autoFocus
                            placeholder={DELETE_CONFIRM_WORD}
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                setError(null);
                            }}
                            disabled={deleting}
                            className={cn(
                                "h-11",
                                input.length > 0 && !phraseMatches && "border-destructive/50 focus-visible:ring-destructive/30",
                                phraseMatches && "border-emerald-500/50 focus-visible:ring-emerald-500/30",
                            )}
                        />
                    </div>
                    {error && (
                        <p className="text-sm text-destructive" role="alert">
                            {error}
                        </p>
                    )}
                    <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-1">
                        <Button type="button" variant="outline" className="flex-1 h-11 min-h-11" onClick={onClose} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            className="flex-1 h-11 min-h-11"
                            loading={deleting}
                            disabled={!phraseMatches || deleting}
                            onClick={() => void confirm()}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
