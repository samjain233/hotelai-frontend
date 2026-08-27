"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
    DEFAULT_SERVICE_ICON,
    SERVICE_ICON_OPTIONS,
} from "@/lib/serviceIcons";
import { cn } from "@/lib/utils";

interface ServiceIconPickerProps {
    value?: string | null;
    onChange: (value: string) => void;
}

export function ServiceIconPicker({
    value,
    onChange,
}: ServiceIconPickerProps) {
    const [search, setSearch] = useState("");

    const filteredIcons = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return SERVICE_ICON_OPTIONS;
        }

        return SERVICE_ICON_OPTIONS.filter(
            (item) =>
                item.label.toLowerCase().includes(query) ||
                item.key.toLowerCase().includes(query),
        );
    }, [search]);

    const selectedValue = value || DEFAULT_SERVICE_ICON;

    return (
        <div className="space-y-3">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />

                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search icons..."
                    className="w-full h-10 bg-secondary/50 border border-border rounded-lg pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
            </div>

            {/* Icons */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-56 overflow-y-auto pr-1">
                {filteredIcons.map((item) => {
                    const Icon = item.icon;
                    const selected = selectedValue === item.key;

                    return (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => onChange(item.key)}
                            title={item.label}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 min-h-[72px] transition-all",
                                selected
                                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30"
                                    : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary hover:text-foreground",
                            )}
                        >
                            <Icon className="w-5 h-5" />

                            <span className="text-[10px] leading-tight text-center line-clamp-2">
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {filteredIcons.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                    No matching icons.
                </p>
            )}
        </div>
    );
}