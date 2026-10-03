"use client";

import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { useState, useEffect } from "react";
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
    Hotel,
    Search,
    Headset,
    Users,
    Settings,
    ShieldAlert,
    Palette,
    Wrench,
    Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    ENABLE_ORDERING_ADMIN_NAV,
    filterVisibleNavItems,
    isOrderingAdminNavPath,
} from "@/lib/adminNavConfig";
import { motion, AnimatePresence } from "framer-motion";

const iconMap: Record<string, any> = {
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

export default function AdminShell({ children }: { children: React.ReactNode }) {
    const { admin, logout, hotel, loading, impersonating } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            const currentNav = (serverNavItems as any[]).find((item) => pathname.startsWith(item.href));
            if (currentNav && currentNav.isLocked) {
                const allowedNavs = (serverNavItems as any[]).filter((item) => !item.isLocked);
                router.replace(allowedNavs[0]?.href || "/dashboard");
            }
        }
    }, [pathname, admin, loading, navLoading, serverNavItems, router]);

    const navItems = serverNavItems ? (serverNavItems as any[]) : [];

    if (loading || !admin) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
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

    return (
        <div className="dark flex min-h-screen flex-col bg-[#0e0e10] text-zinc-100">
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
                <aside className="fixed inset-y-0 z-40 hidden w-[240px] flex-col border-r border-white/[0.06] bg-[#0e0e10] print:hidden lg:flex">
                    <div className="h-16 flex items-center px-6 border-b border-border">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 shadow-sm flex items-center justify-center text-primary mr-3">
                            <Hotel className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-[15px] tracking-tight truncate text-foreground">
                            {hotel?.name || "Hotel Admin"}
                        </span>
                    </div>

                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto no-scrollbar">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            const IconComponent = iconMap[item.iconName] || LayoutDashboard;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                                        isActive
                                            ? "bg-white/[0.08] text-white"
                                            : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
                                    )}
                                >
                                    <IconComponent className="h-4 w-4 shrink-0" />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="p-4 border-t border-border space-y-2">
                        <div className="px-3 py-2 rounded-lg bg-secondary/50 border border-border min-w-0 overflow-hidden">
                            <p className="text-xs font-medium text-foreground truncate">{admin?.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate" title={admin?.email || ""}>{admin?.email}</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={logout}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors group"
                            >
                                <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-destructive transition-colors" />
                                Sign out
                            </button>
                        </div>
                    </div>
                </aside>

                <div className="flex min-w-0 flex-1 flex-col print:pl-0 lg:pl-[240px]">
                    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/[0.06] bg-[#0e0e10]/90 px-6 backdrop-blur-md print:hidden lg:px-8">
                        <button
                            className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => setMobileMenuOpen(true)}
                        >
                            <MenuIcon className="w-6 h-6" />
                        </button>

                        <div className="hidden md:flex items-center bg-secondary/50 rounded-lg px-3 py-1.5 w-full max-w-md border border-border focus-within:ring-1 focus-within:ring-primary/50 transition-all">
                            <Search className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="bg-transparent border-none outline-none text-sm text-foreground w-full placeholder:text-muted-foreground"
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            <NotificationsDropdown />
                            <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-sm font-medium text-muted-foreground">
                                A
                            </div>
                        </div>
                    </header>

                    <main className="mx-auto w-full max-w-[1600px] flex-1 p-6 lg:p-10 print:p-0 print:max-w-none">
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
                                className="fixed inset-0 bg-black/60 z-50 lg:hidden backdrop-blur-sm"
                            />
                            <motion.aside
                                initial={{ x: "-100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "-100%" }}
                                transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                                className="fixed inset-y-0 left-0 w-[280px] bg-card border-r border-border z-50 lg:hidden flex flex-col min-h-0"
                            >
                                <div className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-border">
                                    <span className="font-semibold text-lg truncate pr-2">{hotel?.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary shrink-0"
                                        aria-label="Close menu"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <nav className="flex-1 min-h-0 overflow-y-auto px-4 py-6 space-y-1">
                                    {navItems.map((item) => {
                                        const IconComponent = iconMap[item.iconName] || LayoutDashboard;

                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setMobileMenuOpen(false)}
                                                className={cn(
                                                    "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium",
                                                    pathname === item.href
                                                        ? "bg-primary/10 text-primary"
                                                        : "text-muted-foreground hover:bg-secondary"
                                                )}
                                            >
                                                <IconComponent className="w-5 h-5 shrink-0" />
                                                {item.name}
                                            </Link>
                                        );
                                    })}
                                </nav>
                                <div className="shrink-0 border-t border-border px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom,0px))] space-y-2">
                                    <div className="px-3 py-2 rounded-lg bg-secondary/50 border border-border min-w-0 overflow-hidden">
                                        <p className="text-xs font-medium text-foreground truncate">{admin?.name}</p>
                                        <p className="text-[10px] text-muted-foreground truncate" title={admin?.email || ""}>{admin?.email}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMobileMenuOpen(false);
                                            void logout();
                                        }}
                                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors group"
                                    >
                                        <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-destructive transition-colors shrink-0" />
                                        Sign out
                                    </button>
                                </div>
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
