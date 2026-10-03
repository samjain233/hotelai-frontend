"use client";

import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { useState, useEffect, useCallback, type ComponentType } from "react";
import { useAdminNavigation } from "@/hooks/useSwrApi";
import {
    LayoutDashboard,
    ClipboardList,
    UtensilsCrossed,
    BedDouble,
    ChefHat,
    LogOut,
    Menu as MenuIcon,
    X,
    Headset,
    Users,
    Settings,
    ShieldAlert,
    Palette,
    Wrench,
    ChevronDown,
    ChevronRight,
    PanelLeft,
    LifeBuoy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    ENABLE_ORDERING_ADMIN_NAV,
    filterVisibleNavItems,
    isOrderingAdminNavPath,
} from "@/lib/adminNavConfig";
import { motion, AnimatePresence } from "framer-motion";

type IconType = ComponentType<{ className?: string }>;

type NavItem = { name: string; href: string; iconName: string; isLocked?: boolean };

const iconMap: Record<string, IconType> = {
    LayoutDashboard,
    ClipboardList,
    Headset,
    Wrench,
    UtensilsCrossed,
    Palette,
    BedDouble,
    ChefHat,
    Users,
    Settings,
};

const NAV_GROUPS: { id: string; label: string; hrefs: string[] }[] = [
    { id: "operations", label: "Operations", hrefs: ["/dashboard", "/orders", "/kitchen", "/services"] },
    { id: "menu", label: "Menu", hrefs: ["/menu", "/menu-design"] },
    { id: "property", label: "Property", hrefs: ["/rooms", "/service-catalogue", "/staff"] },
    { id: "account", label: "Account", hrefs: ["/settings"] },
];

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL;
const SIDEBAR_COLLAPSED_KEY = "admin-sidebar-collapsed";
const CLOSED_GROUPS_KEY = "admin-nav-closed-groups";

function groupNav(items: NavItem[]) {
    const groups = NAV_GROUPS.map((group) => ({
        ...group,
        items: group.hrefs
            .map((href) => items.find((item) => item.href === href))
            .filter((item): item is NavItem => Boolean(item)),
    }));
    const known = new Set(NAV_GROUPS.flatMap((group) => group.hrefs));
    const rest = items.filter((item) => !known.has(item.href));
    if (rest.length) groups.push({ id: "more", label: "More", hrefs: [], items: rest });
    return groups.filter((group) => group.items.length > 0);
}

function isActivePath(pathname: string, href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
}

function initials(name?: string | null) {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
    const { admin, logout, hotel, loading, impersonating } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(
        () => typeof window !== "undefined" && localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true",
    );
    const [closedGroups, setClosedGroups] = useState<string[]>(() => {
        if (typeof window === "undefined") return [];
        try {
            return JSON.parse(localStorage.getItem(CLOSED_GROUPS_KEY) || "[]");
        } catch {
            return [];
        }
    });

    const { data: serverNavItems, isLoading: navLoading } = useAdminNavigation(!!admin);

    useEffect(() => {
        if (!loading && !admin) {
            router.replace("/login");
        }
    }, [loading, admin, router]);

    useEffect(() => {
        if (loading || !admin) return;
        if (ENABLE_ORDERING_ADMIN_NAV) return;
        if (isOrderingAdminNavPath(pathname)) {
            router.replace("/dashboard");
        }
    }, [pathname, admin, loading, router]);

    useEffect(() => {
        if (!loading && admin && serverNavItems && !navLoading) {
            const currentNav = (serverNavItems as NavItem[]).find((item) => pathname.startsWith(item.href));
            if (currentNav && currentNav.isLocked) {
                const allowedNavs = (serverNavItems as NavItem[]).filter((item) => !item.isLocked);
                router.replace(allowedNavs[0]?.href || "/dashboard");
            }
        }
    }, [pathname, admin, loading, navLoading, serverNavItems, router]);

    const toggleCollapsed = useCallback(() => {
        setCollapsed((prev) => {
            localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(!prev));
            return !prev;
        });
    }, []);

    const toggleGroup = useCallback((id: string) => {
        setClosedGroups((prev) => {
            const next = prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id];
            localStorage.setItem(CLOSED_GROUPS_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    const navItems = filterVisibleNavItems(((serverNavItems as NavItem[] | undefined) ?? []).filter((item) => !item.isLocked));
    const groups = groupNav(navItems);
    const currentItem = navItems.find((item) => isActivePath(pathname, item.href));
    const currentGroup = groups.find((group) => group.items.some((item) => item.href === currentItem?.href));

    if (loading || !admin) {
        return (
            <div className="min-h-screen bg-canvas flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                        {loading ? "Loading..." : "Redirecting to login..."}
                    </p>
                </div>
            </div>
        );
    }

    async function exitPlatformView() {
        await logout();
        router.push("/superadmin/hotels");
    }

    const navList = (opts: { compact: boolean; onNavigate?: () => void }) => (
        <nav className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-3 py-4 space-y-5" aria-label="Main">
            {navLoading && navItems.length === 0 && (
                <div className="space-y-2 px-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-9 rounded-lg bg-secondary/60 animate-pulse" />
                    ))}
                </div>
            )}
            {groups.map((group) => {
                const open = opts.compact || !closedGroups.includes(group.id);
                return (
                    <div key={group.id}>
                        {opts.compact ? (
                            <div className="mx-auto mb-2 h-px w-6 bg-border first:hidden" aria-hidden />
                        ) : (
                            <button
                                type="button"
                                onClick={() => toggleGroup(group.id)}
                                aria-expanded={open}
                                className="mb-1 flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                            >
                                {group.label}
                                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", !open && "-rotate-90")} />
                            </button>
                        )}
                        {open && (
                            <ul className="space-y-0.5">
                                {group.items.map((item) => {
                                    const active = isActivePath(pathname, item.href);
                                    const Icon = iconMap[item.iconName] || LayoutDashboard;
                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                onClick={opts.onNavigate}
                                                title={opts.compact ? item.name : undefined}
                                                aria-current={active ? "page" : undefined}
                                                className={cn(
                                                    "group relative flex h-9 items-center gap-3 rounded-lg text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60",
                                                    opts.compact ? "justify-center px-0" : "px-2.5",
                                                    active
                                                        ? "bg-secondary text-foreground font-medium"
                                                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                                                )}
                                            >
                                                {active && (
                                                    <span className="absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand" aria-hidden />
                                                )}
                                                <Icon className={cn("h-4 w-4 shrink-0", active && "text-brand")} />
                                                {!opts.compact && <span className="truncate">{item.name}</span>}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                );
            })}
        </nav>
    );

    const footer = (opts: { compact: boolean }) => (
        <div className="shrink-0 border-t border-border p-3 space-y-1 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
            {SUPPORT_EMAIL && (
                <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    title={opts.compact ? "Contact support" : undefined}
                    className={cn(
                        "flex h-9 cursor-pointer items-center gap-3 rounded-lg text-sm text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground",
                        opts.compact ? "justify-center" : "px-2.5",
                    )}
                >
                    <LifeBuoy className="h-4 w-4 shrink-0" />
                    {!opts.compact && "Contact support"}
                </a>
            )}
            <div className={cn("flex items-center gap-2.5 rounded-xl border border-border bg-canvas/60 p-2", opts.compact && "justify-center border-0 bg-transparent p-0")}>
                <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/15 text-xs font-semibold text-brand"
                    title={opts.compact ? `${admin?.name ?? ""} · ${admin?.email ?? ""}` : undefined}
                >
                    {initials(admin?.name)}
                </span>
                {!opts.compact && (
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{admin?.name}</p>
                        <p className="truncate text-[11px] text-muted-foreground" title={admin?.email || ""}>
                            {admin?.email}
                        </p>
                    </div>
                )}
                {!opts.compact && (
                    <button
                        type="button"
                        onClick={() => void logout()}
                        aria-label="Sign out"
                        title="Sign out"
                        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                )}
            </div>
            {opts.compact && (
                <button
                    type="button"
                    onClick={() => void logout()}
                    aria-label="Sign out"
                    title="Sign out"
                    className="flex h-9 w-full cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                    <LogOut className="h-4 w-4" />
                </button>
            )}
        </div>
    );

    const brand = (opts: { compact: boolean }) => (
        <Link
            href="/dashboard"
            className={cn("flex min-w-0 items-center gap-2.5", opts.compact && "justify-center")}
            title={opts.compact ? hotel?.name : undefined}
        >
            {hotel?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={hotel.logoUrl} alt="" className="h-8 w-8 shrink-0 rounded-lg object-cover ring-1 ring-border" />
            ) : (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-[#1f2340]">
                    <UtensilsCrossed className="h-4 w-4" />
                </span>
            )}
            {!opts.compact && (
                <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-foreground">{hotel?.name || "Your hotel"}</span>
                    <span className="block text-[11px] text-muted-foreground">DreamCanvas</span>
                </span>
            )}
        </Link>
    );

    return (
        <div className="flex min-h-screen flex-col bg-canvas text-foreground">
            {impersonating && (
                <div className="shrink-0 z-[60] flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-amber-500/15 border-b border-amber-500/40 text-amber-950 dark:text-amber-100 print:hidden">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                        <span>
                            Platform view: <span className="font-semibold">{hotel?.name ?? "Hotel"}</span>
                            <span className="font-normal text-amber-900/80 dark:text-amber-200/90">
                                {" "}
                                — you are signed in as this hotel&apos;s owner for support.
                            </span>
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => void exitPlatformView()}
                        className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                    >
                        Exit to platform
                    </button>
                </div>
            )}

            <div className="flex flex-1 min-h-0">
                <aside
                    className={cn(
                        "fixed bottom-2 left-2 z-40 hidden flex-col rounded-2xl border border-border bg-panel transition-[width] duration-200 print:hidden lg:flex",
                        impersonating ? "top-14" : "top-2",
                        collapsed ? "w-[68px]" : "w-[248px]",
                    )}
                >
                    <div className={cn("flex h-14 shrink-0 items-center border-b border-border", collapsed ? "justify-center px-2" : "justify-between gap-2 px-3")}>
                        {brand({ compact: collapsed })}
                        {!collapsed && (
                            <button
                                type="button"
                                onClick={toggleCollapsed}
                                aria-label="Collapse sidebar"
                                title="Collapse sidebar"
                                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            >
                                <PanelLeft className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    {collapsed && (
                        <button
                            type="button"
                            onClick={toggleCollapsed}
                            aria-label="Expand sidebar"
                            title="Expand sidebar"
                            className="mx-auto mt-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        >
                            <PanelLeft className="h-4 w-4 rotate-180" />
                        </button>
                    )}
                    {navList({ compact: collapsed })}
                    {footer({ compact: collapsed })}
                </aside>

                <div
                    className={cn(
                        "flex min-w-0 flex-1 flex-col transition-[padding] duration-200 print:pl-0",
                        collapsed ? "lg:pl-[84px]" : "lg:pl-[264px]",
                    )}
                >
                    <header className="sticky top-0 z-30 px-2 pt-2 print:hidden lg:pl-0">
                        <div className="flex h-14 items-center justify-between gap-3 rounded-2xl border border-border bg-panel/90 px-3 backdrop-blur-md sm:px-4">
                            <div className="flex min-w-0 items-center gap-2">
                                <button
                                    type="button"
                                    className="-ml-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:hidden"
                                    onClick={() => setMobileMenuOpen(true)}
                                    aria-label="Open navigation"
                                >
                                    <MenuIcon className="h-5 w-5" />
                                </button>
                                <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
                                    <span className="hidden truncate text-muted-foreground sm:inline">
                                        {currentGroup && currentGroup.label !== currentItem?.name ? currentGroup.label : hotel?.name}
                                    </span>
                                    <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground/60 sm:block" />
                                    <span className="truncate font-medium text-foreground">{currentItem?.name ?? "Dashboard"}</span>
                                </nav>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <NotificationsDropdown />
                                <span
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/15 text-xs font-semibold text-brand"
                                    title={admin?.name}
                                >
                                    {initials(admin?.name)}
                                </span>
                            </div>
                        </div>
                    </header>

                    <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 print:p-0 print:max-w-none">
                        {children}
                    </main>
                </div>

                <AnimatePresence>
                    {mobileMenuOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setMobileMenuOpen(false)}
                                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
                            />
                            <motion.aside
                                initial={{ x: "-100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "-100%" }}
                                transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                                className="fixed inset-y-2 left-2 z-50 flex w-[280px] max-w-[calc(100vw-1rem)] min-h-0 flex-col rounded-2xl border border-border bg-panel lg:hidden"
                            >
                                <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
                                    {brand({ compact: false })}
                                    <button
                                        type="button"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                                        aria-label="Close navigation"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                                {navList({ compact: false, onNavigate: () => setMobileMenuOpen(false) })}
                                {footer({ compact: false })}
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
