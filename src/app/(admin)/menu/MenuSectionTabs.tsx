"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListChecks, UtensilsCrossed } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

/** Roles allowed to add, edit or delete menu content. Everyone else only gets Availability. */
const MENU_EDITOR_ROLES = new Set(["OWNER", "GENERAL_MANAGER", "MANAGER"]);

const SECTIONS = [
    { href: "/menu", label: "Build menu", hint: "Dishes, categories, photos", icon: UtensilsCrossed, editorsOnly: true },
    { href: "/menu/availability", label: "Availability", hint: "Sold out and back on", icon: ListChecks, editorsOnly: false },
] as const;

/**
 * Switch between the two menu sections. Building the menu is an occasional owner task;
 * availability is a several-times-a-day kitchen task, so they are separate pages.
 */
export function MenuSectionTabs() {
    const pathname = usePathname();
    const { admin } = useAuth();
    const canEdit = admin ? MENU_EDITOR_ROLES.has(admin.role) : false;
    const visible = SECTIONS.filter((s) => canEdit || !s.editorsOnly);
    if (visible.length < 2) return null;

    return (
        <nav aria-label="Menu sections" className="inline-flex w-full rounded-xl border border-border bg-panel p-1 sm:w-auto">
            {visible.map((section) => {
                const active = pathname === section.href;
                const Icon = section.icon;
                return (
                    <Link
                        key={section.href}
                        href={section.href}
                        aria-current={active ? "page" : undefined}
                        title={section.hint}
                        className={cn(
                            "flex h-9 flex-1 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors sm:flex-none",
                            active ? "bg-secondary text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                        )}
                    >
                        <Icon className={cn("h-4 w-4", active && "text-brand")} aria-hidden />
                        {section.label}
                    </Link>
                );
            })}
        </nav>
    );
}
