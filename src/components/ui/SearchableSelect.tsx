"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export interface SearchableSelectOption {
    value: string;
    label: string;
}

interface SearchableSelectProps {
    options: SearchableSelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    /** Shown under emptyMessage when there are no matching options (e.g. “Add category”). Receives current search text. */
    emptyAction?: {
        label: string;
        onClick: (searchQuery: string) => void;
    };
    disabled?: boolean;
    className?: string;
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Select...",
    searchPlaceholder = "Search...",
    emptyMessage = "No results found",
    emptyAction,
    disabled = false,
    className,
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedLabel = options.find((o) => o.value === value)?.label ?? "";
    const filteredOptions = options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen((o) => !o)}
                className={cn(
                    "w-full flex items-center justify-between gap-2 bg-secondary/50 border border-border rounded-lg px-3 py-2.5 text-sm text-left text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
            >
                <span className={value ? "text-foreground" : "text-muted-foreground"}>
                    {selectedLabel || placeholder}
                </span>
                <ChevronDown className={cn("w-4 h-4 text-muted-foreground shrink-0 transition-transform", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-lg shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-border">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full pl-8 pr-3 py-2 bg-secondary/50 border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto py-1">
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-4 text-center space-y-3">
                                <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                                {emptyAction && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => {
                                            const q = search;
                                            setIsOpen(false);
                                            setSearch("");
                                            emptyAction.onClick(q);
                                        }}
                                    >
                                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                                        {emptyAction.label}
                                    </Button>
                                )}
                            </div>
                        ) : (
                            filteredOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                        setSearch("");
                                    }}
                                    className={cn(
                                        "w-full px-3 py-2 text-left text-sm hover:bg-secondary/80 transition-colors",
                                        opt.value === value && "bg-primary/10 text-primary font-medium"
                                    )}
                                >
                                    {opt.label}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
