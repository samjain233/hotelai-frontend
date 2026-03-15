"use client";

import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { useState, useEffect } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const allNavItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard, roles: ["OWNER", "MANAGER", "FRONT_DESK"] },
    { name: "Orders", href: "/orders", icon: ClipboardList, roles: ["OWNER", "MANAGER", "KITCHEN", "FRONT_DESK"] },
    { name: "Services", href: "/services", icon: Headset, roles: ["OWNER", "MANAGER", "FRONT_DESK"] },
    { name: "Menu", href: "/menu", icon: UtensilsCrossed, roles: ["OWNER", "MANAGER"] },
    { name: "Rooms & QR", href: "/rooms", icon: BedDouble, roles: ["OWNER", "MANAGER", "FRONT_DESK"] },
    { name: "Kitchen", href: "/kitchen", icon: ChefHat, roles: ["OWNER", "MANAGER", "KITCHEN"] },
    { name: "Staff", href: "/staff", icon: Users, roles: ["OWNER"] },
    { name: "Settings", href: "/settings", icon: Settings, roles: ["OWNER", "MANAGER", "KITCHEN", "FRONT_DESK"] },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {

    const { admin, logout, hotel, loading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // ─── Auth Guard: redirect to /login if not authenticated ───
    useEffect(() => {
        if (!loading && !admin) {
            router.replace("/login");
        }
    }, [loading, admin, router]);

    // Guard against accessing unauthorized routes directly via URL
    useEffect(() => {
        if (!loading && admin) {
            const currentNav = allNavItems.find(item => pathname.startsWith(item.href));
            // If the route exists in our nav system but the user's role isn't allowed to see it
            if (currentNav && !currentNav.roles.includes(admin.role)) {
                // Find first allowed route
                const allowedNavs = allNavItems.filter(item => item.roles.includes(admin.role));
                router.replace(allowedNavs[0]?.href || "/orders");
            }
        }
    }, [pathname, admin, loading, router]);

    const navItems = admin ? allNavItems.filter(item => item.roles.includes(admin.role)) : [];

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

    return (
        <div className="min-h-screen bg-background text-foreground flex">
            {/* 
               SIDEBAR - DESKTOP 
               Fixed width 260px, Z-index 40
            */}
            <aside className="hidden lg:flex w-[260px] flex-col fixed inset-y-0 z-40 bg-background/80 backdrop-blur-3xl border-r border-border">
                {/* Brand */}
                <div className="h-16 flex items-center px-6 border-b border-border">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 shadow-sm flex items-center justify-center text-primary mr-3">
                        <Hotel className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-[15px] tracking-tight truncate text-foreground">
                        {hotel?.name || "Hotel Admin"}
                    </span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto no-scrollbar">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                )}
                            >
                                <item.icon className={cn("w-4 h-4 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                                <span>{item.name}</span>
                                {isActive && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                                )}
                            </Link>
                        );
                    })}
                </nav>
                {/* User / Footer */}
                <div className="p-4 border-t border-border space-y-2">
                    <div className="px-3 py-2 rounded-lg bg-secondary/50 border border-border">
                        <p className="text-xs font-medium text-foreground truncate">{admin?.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{admin?.email}</p>
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

            {/* 
               MAIN CONTENT WRAPPER 
            */}
            <div className="flex-1 flex flex-col min-w-0 lg:pl-[260px] transition-all duration-300">
                {/* 
                   TOP HEADER 
                */}
                <header className="h-16 sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 lg:px-8">
                    {/* Mobile Toggle */}
                    <button
                        className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <MenuIcon className="w-6 h-6" />
                    </button>

                    {/* Search (Visual Only) */}
                    <div className="hidden md:flex items-center bg-secondary/50 rounded-lg px-3 py-1.5 w-64 border border-border focus-within:ring-1 focus-within:ring-primary/50 transition-all">
                        <Search className="w-4 h-4 text-muted-foreground mr-2" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="bg-transparent border-none outline-none text-sm text-foreground w-full placeholder:text-muted-foreground"
                        />
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4">
                        <NotificationsDropdown />
                        <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-sm font-medium text-muted-foreground">
                            A
                        </div>
                    </div>
                </header>

                {/* 
                   PAGE CONTENT
                   Added generous padding (p-6 lg:p-10) for that "airy" feel from the reference.
                   max-w-7xl to prevent stretching on huge screens.
                */}
                <main className="flex-1 p-6 lg:p-10 max-w-[1600px] mx-auto w-full">
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
                                <span className="font-semibold text-lg">{hotel?.name}</span>
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
                                            pathname === item.href
                                                ? "bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:bg-secondary"
                                        )}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        {item.name}
                                    </Link>
                                ))}
                            </nav>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
