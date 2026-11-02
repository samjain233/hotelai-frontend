"use client";

import { useState } from "react";
import { usePropertyQr } from "@/hooks/useSwrApi";
import { cn } from "@/lib/utils";
import { QrCardModal } from "./QrCardModal";

const LABEL_PRESETS = ["Menu", "Restaurant", "Reception", "Lobby"];

const inputClass =
    "h-9 w-full rounded-lg border border-border bg-secondary/40 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40";

/** The hotel-wide QR: opens the guest menu with no room attached. Label and tagline are for the printout only. */
export function PropertyQrModal({ open, onClose, canOrder }: { open: boolean; onClose: () => void; canOrder: boolean }) {
    const { data, error } = usePropertyQr(open);
    const [label, setLabel] = useState("Menu");
    const [tagline, setTagline] = useState(canOrder ? "Scan to order" : "Scan to see our menu");
    const fileSlug = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "hotel";

    return (
        <QrCardModal
            open={open}
            onClose={onClose}
            title="Hotel QR code"
            subtitle="No room attached · for reception, restaurant or lobby"
            qr={data}
            error={error}
            eyebrow={null}
            label={label.trim()}
            tagline={tagline.trim() || "Scan to see our menu"}
            downloadName={`${fileSlug}-qr.png`}
        >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <label htmlFor="property-qr-label" className="text-xs font-medium text-muted-foreground">
                        Label on the card
                    </label>
                    <input
                        id="property-qr-label"
                        value={label}
                        onChange={(e) => setLabel(e.target.value.slice(0, 24))}
                        placeholder="e.g. Restaurant"
                        autoComplete="off"
                        className={inputClass}
                    />
                </div>
                <div className="space-y-1.5">
                    <label htmlFor="property-qr-tagline" className="text-xs font-medium text-muted-foreground">
                        Tagline
                    </label>
                    <input
                        id="property-qr-tagline"
                        value={tagline}
                        onChange={(e) => setTagline(e.target.value.slice(0, 40))}
                        placeholder="Scan to see our menu"
                        autoComplete="off"
                        className={inputClass}
                    />
                </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
                {LABEL_PRESETS.map((preset) => (
                    <button
                        key={preset}
                        type="button"
                        aria-pressed={label.trim() === preset}
                        onClick={() => setLabel(preset)}
                        className={cn(
                            "rounded-md border px-2 py-1 text-xs transition-colors",
                            label.trim() === preset
                                ? "border-brand/50 bg-brand/10 text-foreground"
                                : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground",
                        )}
                    >
                        {preset}
                    </button>
                ))}
            </div>
        </QrCardModal>
    );
}
