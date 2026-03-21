"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    Building2,
    MessageSquareWarning,
    BarChart3,
    Settings,
    LogOut,
    Shield,
    Menu as MenuIcon,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

const navItems = [
    { name: "Overview", href: "/superadmin", icon: LayoutDashboard },
    { name: "Hotels", href: "/superadmin/hotels", icon: Building2 },
    { name: "Complaints", href: "/superadmin/complaints", icon: MessageSquareWarning },
    { name: "Analytics", href: "/superadmin/analytics", icon: BarChart3 },
    { name: "Settings", href: "/superadmin/settings", icon: Settings },
];

export default function SuperAdminDashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [ready, setReady] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const key = sessionStorage.getItem("platform_key");
        if (!key) {
            router.replace("/superadmin/login");
        } else {
            setReady(true);
        }
    }, [router]);

    function handleLogout() {
        sessionStorage.removeItem("platform_key");
        router.replace("/superadmin/login");
    }

    if (!ready) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    function isActive(href: string) {
        if (href === "/superadmin") return pathname === "/superadmin";
        return pathname.startsWith(href);
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-[260px] flex-col fixed inset-y-0 z-40 bg-background/80 backdrop-blur-3xl border-r border-border">
                <div className="h-16 flex items-center px-6 border-b border-border">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 shadow-sm flex items-center justify-center text-primary mr-3">
                        <Shield className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-[15px] tracking-tight text-foreground">
                        Platform Admin
                    </span>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto no-scrollbar">
                    {navItems.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                                    active
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                )}
                            >
                                <item.icon className={cn("w-4 h-4 transition-colors", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                                <span>{item.name}</span>
                                {active && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-border">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign out
                    </button>
                </div>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0 lg:pl-[260px]">
                <header className="h-16 sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 lg:px-8">
                    <button
                        className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <MenuIcon className="w-6 h-6" />
                    </button>
                    <div className="hidden lg:block" />
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-muted-foreground bg-secondary/60 px-3 py-1.5 rounded-full border border-border">
                            Super Admin
                        </span>
                    </div>
                </header>

                <main className="flex-1 p-6 lg:p-10 max-w-[1600px] mx-auto w-full page-transition">
                    {children}
                </main>
            </div>

            {/* Mobile Drawer */}
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
                            className="fixed inset-y-0 left-0 w-[280px] bg-card border-r border-border z-50 lg:hidden flex flex-col"
                        >
                            <div className="h-16 flex items-center justify-between px-6 border-b border-border">
                                <span className="font-semibold text-lg">Platform Admin</span>
                                <button onClick={() => setMobileMenuOpen(false)}>
                                    <X className="w-6 h-6 text-muted-foreground" />
                                </button>
                            </div>
                            <nav className="flex-1 px-4 py-6 space-y-1">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium",
                                            isActive(item.href)
                                                ? "bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:bg-secondary"
                                        )}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        {item.name}
                                    </Link>
                                ))}
                            </nav>
                            <div className="p-4 border-t border-border">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign out
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
