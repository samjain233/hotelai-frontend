"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
    children: React.ReactNode;
    variant?: "default" | "success" | "warning" | "danger" | "outline";
    className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
    const variants = {
        default: "bg-zinc-800 text-zinc-300 border-zinc-700",
        success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        danger: "bg-red-500/10 text-red-400 border-red-500/20",
        outline: "bg-transparent border-zinc-700 text-zinc-400",
    };

    return (
        <span className={cn("px-2 py-0.5 rounded-md text-xs font-medium border inline-flex items-center", variants[variant], className)}>
            {children}
        </span>
    );
}
