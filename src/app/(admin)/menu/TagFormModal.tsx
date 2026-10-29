"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { MenuTag } from "@/lib/types";
import type { MenuTagType } from "./useMenuTags";

export interface TagModalState {
    editing: MenuTag | null;
    type: MenuTagType;
}

interface TagFormModalProps {
    state: TagModalState | null;
    onClose: () => void;
    /** Create or rename. Throw to keep the dialog open. */
    onSave: (editing: MenuTag | null, name: string, type: MenuTagType) => Promise<unknown>;
}

/** Create / rename a custom allergen or dietary tag. */
export function TagFormModal({ state, onClose, onSave }: TagFormModalProps) {
    return <AnimatePresence>{state && <TagFormDialog state={state} onClose={onClose} onSave={onSave} />}</AnimatePresence>;
}

function TagFormDialog({ state, onClose, onSave }: TagFormModalProps & { state: TagModalState }) {
    const { editing, type } = state;
    const [name, setName] = useState(editing?.name ?? "");
    const [saving, setSaving] = useState(false);

    function close() {
        if (!saving) onClose();
    }

    async function save() {
        const trimmed = name.trim();
        if (!trimmed) {
            toast.error("Tag name is required");
            return;
        }
        setSaving(true);
        try {
            await onSave(editing, trimmed, type);
            toast.success(editing ? "Tag updated" : "Tag created");
            onClose();
        } catch (err) {
            console.error("Failed to save tag:", err);
            toast.error("Failed to save tag");
            setSaving(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 pb-[env(safe-area-inset-bottom,0px)] bg-black/70 backdrop-blur-md overflow-y-auto"
            onClick={close}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md max-h-[90dvh] overflow-y-auto bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl"
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h3 className="text-lg font-semibold text-foreground">
                        {editing ? "Edit tag" : `Add ${type === "ALLERGEN" ? "allergen" : "dietary tag"}`}
                    </h3>
                    <button
                        type="button"
                        onClick={close}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="space-y-2">
                        <label htmlFor="tag-name" className="text-sm font-medium text-foreground">
                            Name
                        </label>
                        <Input
                            id="tag-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    void save();
                                }
                            }}
                            placeholder="Enter tag name"
                            className="h-11"
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-3 mt-6">
                        <Button type="button" variant="outline" className="flex-1 h-11" onClick={close} disabled={saving}>
                            Cancel
                        </Button>
                        <Button type="button" className="flex-1 h-11" loading={saving} disabled={!name.trim()} onClick={() => void save()}>
                            {editing ? "Update" : "Create"}
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
