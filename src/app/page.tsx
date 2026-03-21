import Link from "next/link";
import {
    QrCode,
    UtensilsCrossed,
    BedDouble,
    Smartphone,
    BarChart3,
    Users,
    Printer,
    Shield,
    Zap,
    ArrowRight,
    Check,
    Star,
    Search,
    ShoppingCart,
    Wifi,
    ImageIcon,
    Plus,
    LayoutGrid,
    Settings,
} from "lucide-react";

/* ─── Reusable mockup sub-components (server components, zero JS) ─── */

function PhoneMockup({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`relative mx-auto w-[280px] md:w-[300px] ${className}`}>
            {/* Phone shell */}
            <div className="rounded-[2.5rem] border border-white/[0.08] bg-[#111113] p-3 shadow-2xl shadow-black/60 ring-1 ring-white/[0.04]">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 z-10 h-6 w-28 -translate-x-1/2 rounded-b-2xl bg-[#111113]" />
                {/* Screen */}
                <div className="overflow-hidden rounded-[2rem] bg-[#09090b]">
                    {children}
                </div>
            </div>
        </div>
    );
}

function BrowserMockup({ children, title, className = "" }: { children: React.ReactNode; title: string; className?: string }) {
    return (
        <div className={`overflow-hidden rounded-xl border border-white/[0.08] bg-[#111113] shadow-2xl shadow-black/40 ${className}`}>
            {/* Title bar */}
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
                <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                    <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                    <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                </div>
                <div className="ml-3 flex-1 rounded-md bg-white/[0.04] px-3 py-1 text-[10px] text-zinc-500 truncate">
                    {title}
                </div>
            </div>
            {/* Content */}
            <div className="bg-[#09090b]">
                {children}
            </div>
        </div>
    );
}

function MockupMenuItem({ name, price, tag, veg }: { name: string; price: string; tag?: string; veg?: boolean }) {
    return (
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-2.5">
            <div className="h-11 w-11 shrink-0 rounded-lg bg-gradient-to-br from-zinc-700/60 to-zinc-800/60 flex items-center justify-center">
                <ImageIcon className="h-4 w-4 text-zinc-500" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                    {veg !== undefined && (
                        <div className={`h-3 w-3 rounded-sm border ${veg ? "border-green-500" : "border-red-500"} flex items-center justify-center`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${veg ? "bg-green-500" : "bg-red-500"}`} />
                        </div>
                    )}
                    <p className="truncate text-[11px] font-medium text-white">{name}</p>
                </div>
                {tag && <p className="mt-0.5 text-[9px] text-zinc-500">{tag}</p>}
            </div>
            <span className="shrink-0 text-[11px] font-bold text-[#d4a853]">{price}</span>
        </div>
    );
}

function MockupQrCard({ room }: { room: string }) {
    return (
        <div className="flex flex-col items-center rounded-lg border border-zinc-700/50 bg-zinc-800/50 p-3">
            <div className="mb-2 grid h-14 w-14 grid-cols-5 grid-rows-5 gap-px rounded bg-white p-1">
                {Array.from({ length: 25 }).map((_, i) => (
                    <div key={i} className={`rounded-[1px] ${[0,1,2,4,5,6,10,12,14,18,20,21,22,24].includes(i) ? "bg-zinc-900" : "bg-white"}`} />
                ))}
            </div>
            <span className="text-[10px] font-bold text-white">{room}</span>
            <span className="text-[7px] text-zinc-500">Scan to view menu</span>
        </div>
    );
}

export const metadata = {
    title: "DreamCanvas — Digital Menu for Hotels",
    description:
        "Give your guests a premium digital menu experience. QR-based room service menus, real-time updates, and beautiful print-ready QR codes.",
};

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#09090b] text-white overflow-hidden">
            {/* ─── Navbar ─── */}
            <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#d4a853] to-[#b8862d]">
                            <UtensilsCrossed className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-lg font-bold tracking-tight">dreamcanvas</span>
                    </Link>
                    <div className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
                        <a href="#features" className="transition-colors hover:text-white">Features</a>
                        <a href="#pricing" className="transition-colors hover:text-white">Pricing</a>
                        <a href="#how-it-works" className="transition-colors hover:text-white">How it works</a>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/login"
                            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:text-white"
                        >
                            Sign in
                        </Link>
                        <Link
                            href="/register"
                            className="rounded-lg bg-gradient-to-r from-[#d4a853] to-[#b8862d] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#d4a853]/20 transition-all hover:shadow-[#d4a853]/30 hover:brightness-110"
                        >
                            Get started free
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ─── Hero ─── */}
            <section className="relative pt-32 pb-20 md:pt-44 md:pb-32">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,168,83,0.12)_0%,_transparent_60%)]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-[#d4a853]/[0.04] blur-[120px]" />

                <div className="relative mx-auto max-w-4xl px-6 text-center">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d4a853]/20 bg-[#d4a853]/[0.06] px-4 py-1.5 text-xs font-medium text-[#d4a853]">
                        <Zap className="h-3.5 w-3.5" />
                        Now serving 50+ hotels across India
                    </div>

                    <h1 className="text-4xl font-bold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl">
                        Your menu, on every{" "}
                        <span className="bg-gradient-to-r from-[#d4a853] via-[#e8c875] to-[#d4a853] bg-clip-text text-transparent">
                            guest&apos;s phone
                        </span>
                    </h1>

                    <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 md:text-xl">
                        Replace printed room menus with a beautiful digital experience.
                        Guests scan a QR code, browse your menu, and you update prices in seconds — not days.
                    </p>

                    <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                        <Link
                            href="/register"
                            className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#d4a853] to-[#b8862d] px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-[#d4a853]/25 transition-all hover:shadow-[#d4a853]/40 hover:brightness-110"
                        >
                            Start for free
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                        <a
                            href="#how-it-works"
                            className="flex items-center gap-2 rounded-xl border border-white/10 px-8 py-3.5 text-base font-medium text-zinc-300 transition-all hover:border-white/20 hover:text-white"
                        >
                            See how it works
                        </a>
                    </div>

                    <p className="mt-5 text-xs text-zinc-500">No credit card required. Set up in under 5 minutes.</p>
                </div>

                {/* Hero phone mockup */}
                <div className="relative mx-auto mt-16 max-w-5xl px-6 md:mt-24">
                    <div className="absolute inset-0 -top-20 bg-[radial-gradient(ellipse_at_center,_rgba(212,168,83,0.08)_0%,_transparent_70%)]" />
                    <div className="relative flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-center md:gap-12">

                        {/* Phone: Guest Menu */}
                        <PhoneMockup className="z-10">
                            <div className="px-4 pt-8 pb-6">
                                {/* Header */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#d4a853] to-[#c9973a] flex items-center justify-center text-white text-xs font-bold">H</div>
                                    <div>
                                        <p className="text-[12px] font-semibold text-white">The Grand Palace</p>
                                        <p className="text-[9px] text-zinc-500">Room 204</p>
                                    </div>
                                </div>
                                {/* Search */}
                                <div className="flex items-center gap-2 rounded-lg bg-white/[0.05] px-3 py-2 mb-4">
                                    <Search className="h-3 w-3 text-zinc-500" />
                                    <span className="text-[10px] text-zinc-500">Search dishes...</span>
                                </div>
                                {/* Category pills */}
                                <div className="flex gap-1.5 mb-4 overflow-hidden">
                                    <span className="shrink-0 rounded-full bg-[#d4a853]/15 px-3 py-1 text-[9px] font-medium text-[#d4a853]">All</span>
                                    <span className="shrink-0 rounded-full bg-white/[0.05] px-3 py-1 text-[9px] text-zinc-400">Starters</span>
                                    <span className="shrink-0 rounded-full bg-white/[0.05] px-3 py-1 text-[9px] text-zinc-400">Main Course</span>
                                    <span className="shrink-0 rounded-full bg-white/[0.05] px-3 py-1 text-[9px] text-zinc-400">Drinks</span>
                                </div>
                                {/* Menu items */}
                                <div className="space-y-2">
                                    <MockupMenuItem name="Paneer Tikka" price="₹349" tag="Chef's special" veg={true} />
                                    <MockupMenuItem name="Butter Chicken" price="₹429" tag="Most ordered" veg={false} />
                                    <MockupMenuItem name="Dal Makhani" price="₹299" veg={true} />
                                    <MockupMenuItem name="Veg Biryani" price="₹349" veg={true} />
                                </div>
                                {/* Cart bar */}
                                <div className="mt-4 flex items-center justify-between rounded-xl bg-[#d4a853] px-4 py-2.5">
                                    <div className="flex items-center gap-2">
                                        <ShoppingCart className="h-3.5 w-3.5 text-white" />
                                        <span className="text-[10px] font-semibold text-white">2 items</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-white">₹778</span>
                                </div>
                            </div>
                        </PhoneMockup>

                        {/* Floating elements around the phone */}
                        <div className="pointer-events-none absolute inset-0 hidden md:block">
                            {/* QR card float */}
                            <div className="absolute top-8 left-4 lg:left-16 animate-[float_6s_ease-in-out_infinite] rounded-2xl border border-white/[0.08] bg-[#111113]/90 p-4 shadow-xl backdrop-blur-sm">
                                <div className="mb-2 grid h-16 w-16 grid-cols-5 grid-rows-5 gap-px rounded bg-white p-1.5">
                                    {Array.from({ length: 25 }).map((_, i) => (
                                        <div key={i} className={`rounded-[1px] ${[0,1,2,4,5,6,10,12,14,18,20,21,22,24].includes(i) ? "bg-zinc-900" : "bg-white"}`} />
                                    ))}
                                </div>
                                <p className="text-center text-[10px] font-bold text-white">Room 204</p>
                                <p className="text-center text-[8px] text-zinc-500">Scan to view menu</p>
                            </div>

                            {/* Stat card float */}
                            <div className="absolute top-16 right-4 lg:right-16 animate-[float_6s_ease-in-out_1s_infinite] rounded-2xl border border-white/[0.08] bg-[#111113]/90 p-4 shadow-xl backdrop-blur-sm">
                                <p className="text-[10px] text-zinc-500 mb-1">Today&apos;s views</p>
                                <p className="text-2xl font-bold text-white">128</p>
                                <p className="text-[9px] text-emerald-400 mt-1">+23% from yesterday</p>
                            </div>

                            {/* Notification float */}
                            <div className="absolute bottom-20 right-8 lg:right-24 animate-[float_6s_ease-in-out_2s_infinite] rounded-xl border border-white/[0.08] bg-[#111113]/90 px-4 py-3 shadow-xl backdrop-blur-sm">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <p className="text-[10px] text-white">Menu updated — live instantly</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Logos / Social Proof ─── */}
            <section className="border-y border-white/[0.04] bg-white/[0.01] py-10">
                <div className="mx-auto max-w-4xl px-6 text-center">
                    <p className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                        Trusted by hotels and restaurants
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-zinc-600">
                        {["Boutique Hotels", "Heritage Properties", "Resorts", "Restaurants", "Cafes"].map((name) => (
                            <span key={name} className="text-sm font-medium tracking-wide">{name}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Features Grid ─── */}
            <section id="features" className="py-24 md:py-32">
                <div className="mx-auto max-w-6xl px-6">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                            Everything your hotel needs
                        </h2>
                        <p className="mt-4 text-lg text-zinc-400">
                            One platform to manage your menu, rooms, and guest experience.
                        </p>
                    </div>

                    <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {[
                            {
                                icon: QrCode,
                                title: "QR Code Menus",
                                desc: "Generate print-ready QR codes for every room. Guests scan and browse — no app download needed.",
                            },
                            {
                                icon: UtensilsCrossed,
                                title: "Menu Management",
                                desc: "Add items, categories, images, prices, and dietary tags. Update instantly — changes go live in seconds.",
                            },
                            {
                                icon: BedDouble,
                                title: "Room Management",
                                desc: "Add rooms in bulk, assign floors, and generate individual QR codes. Track everything from one dashboard.",
                            },
                            {
                                icon: Smartphone,
                                title: "Mobile-First Design",
                                desc: "Beautiful, fast menu that works on any phone. Dark theme, smooth animations, and instant load times.",
                            },
                            {
                                icon: Printer,
                                title: "Smart QR Printing",
                                desc: "Choose layout sizes, add hotel branding, WiFi info, and cut guides. Print directly or save as PDF.",
                            },
                            {
                                icon: Users,
                                title: "Staff Accounts",
                                desc: "Invite managers, kitchen staff, and front desk with role-based access. Everyone sees only what they need.",
                            },
                            {
                                icon: BarChart3,
                                title: "Hotel Dashboard",
                                desc: "See your menu stats, room count, and staff activity at a glance. Clean, modern admin panel.",
                            },
                            {
                                icon: Shield,
                                title: "Secure & Reliable",
                                desc: "Hosted on fast global infrastructure. Your data is encrypted and backed up. 99.9% uptime.",
                            },
                            {
                                icon: Zap,
                                title: "5-Minute Setup",
                                desc: "Register, add your menu, print QR codes, place them in rooms. That's it. No training needed.",
                            },
                        ].map((feature) => (
                            <div
                                key={feature.title}
                                className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-[#d4a853]/20 hover:bg-[#d4a853]/[0.03]"
                            >
                                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4a853]/10 text-[#d4a853] transition-colors group-hover:bg-[#d4a853]/15">
                                    <feature.icon className="h-5 w-5" />
                                </div>
                                <h3 className="mb-2 text-base font-semibold">{feature.title}</h3>
                                <p className="text-sm leading-relaxed text-zinc-400">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Product Showcase ─── */}
            <section className="py-24 md:py-32 border-y border-white/[0.04] bg-white/[0.01]">
                <div className="mx-auto max-w-6xl px-6">
                    <div className="mx-auto max-w-2xl text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">See it in action</h2>
                        <p className="mt-4 text-lg text-zinc-400">A quick look at what you and your guests experience.</p>
                    </div>

                    {/* Row 1: Admin Dashboard */}
                    <div className="grid gap-12 md:grid-cols-2 md:items-center mb-24">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d4a853]/20 bg-[#d4a853]/[0.06] px-3 py-1 text-xs font-medium text-[#d4a853]">
                                <BarChart3 className="h-3 w-3" />
                                Admin Dashboard
                            </div>
                            <h3 className="text-2xl font-bold mb-3">Your command center</h3>
                            <p className="text-zinc-400 leading-relaxed mb-6">
                                See rooms, menu items, staff, and activity at a glance. 
                                Everything is organized so you can manage your property without hunting through pages.
                            </p>
                            <ul className="space-y-2">
                                {["Real-time stats overview", "Quick-action cards", "Staff activity feed"].map(item => (
                                    <li key={item} className="flex items-center gap-2 text-sm text-zinc-300">
                                        <Check className="h-3.5 w-3.5 text-[#d4a853]" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <BrowserMockup title="dreamcanvas.in/dashboard">
                            <div className="p-5">
                                {/* Top stats row */}
                                <div className="grid grid-cols-3 gap-3 mb-5">
                                    {[
                                        { label: "Total Rooms", value: "42", icon: BedDouble },
                                        { label: "Menu Items", value: "86", icon: UtensilsCrossed },
                                        { label: "Staff", value: "5", icon: Users },
                                    ].map(stat => (
                                        <div key={stat.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                                            <stat.icon className="h-4 w-4 text-[#d4a853] mb-2" />
                                            <p className="text-lg font-bold text-white">{stat.value}</p>
                                            <p className="text-[9px] text-zinc-500">{stat.label}</p>
                                        </div>
                                    ))}
                                </div>
                                {/* Mini sidebar + content */}
                                <div className="flex gap-3">
                                    <div className="w-16 shrink-0 space-y-2">
                                        {[LayoutGrid, UtensilsCrossed, BedDouble, Users, Settings].map((Icon, i) => (
                                            <div key={i} className={`flex h-8 w-full items-center justify-center rounded-lg ${i === 0 ? "bg-[#d4a853]/15 text-[#d4a853]" : "text-zinc-600 hover:text-zinc-400"}`}>
                                                <Icon className="h-3.5 w-3.5" />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                                        <p className="text-[10px] font-medium text-zinc-400 mb-2">Recent Activity</p>
                                        {[
                                            { text: "Room 301 checked in", time: "2m ago" },
                                            { text: "Menu updated: Starters", time: "15m ago" },
                                            { text: "New staff added", time: "1h ago" },
                                        ].map(item => (
                                            <div key={item.text} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
                                                <span className="text-[10px] text-zinc-300">{item.text}</span>
                                                <span className="text-[9px] text-zinc-600">{item.time}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </BrowserMockup>
                    </div>

                    {/* Row 2: Menu Editor */}
                    <div className="grid gap-12 md:grid-cols-2 md:items-center mb-24">
                        <BrowserMockup title="dreamcanvas.in/menu" className="md:order-first">
                            <div className="p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-[12px] font-semibold text-white">Menu Items</p>
                                        <p className="text-[9px] text-zinc-500">86 items across 8 categories</p>
                                    </div>
                                    <div className="flex items-center gap-2 rounded-lg bg-[#d4a853] px-3 py-1.5">
                                        <Plus className="h-3 w-3 text-white" />
                                        <span className="text-[10px] font-semibold text-white">Add Item</span>
                                    </div>
                                </div>
                                {/* Category tabs */}
                                <div className="flex gap-1.5 mb-4 overflow-hidden">
                                    {["All", "Starters", "Main Course", "Desserts", "Beverages"].map((cat, i) => (
                                        <span key={cat} className={`shrink-0 rounded-full px-3 py-1 text-[9px] font-medium ${i === 0 ? "bg-[#d4a853]/15 text-[#d4a853]" : "bg-white/[0.04] text-zinc-500"}`}>{cat}</span>
                                    ))}
                                </div>
                                {/* Item cards */}
                                <div className="space-y-2">
                                    {[
                                        { name: "Paneer Tikka", price: "₹349", cat: "Starters", veg: true },
                                        { name: "Butter Chicken", price: "₹429", cat: "Main Course", veg: false },
                                        { name: "Gulab Jamun", price: "₹199", cat: "Desserts", veg: true },
                                    ].map(item => (
                                        <div key={item.name} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                                            <div className="h-10 w-10 shrink-0 rounded-lg bg-zinc-800 flex items-center justify-center">
                                                <ImageIcon className="h-4 w-4 text-zinc-600" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`h-2.5 w-2.5 rounded-sm border ${item.veg ? "border-green-500" : "border-red-500"} flex items-center justify-center`}>
                                                        <div className={`h-1 w-1 rounded-full ${item.veg ? "bg-green-500" : "bg-red-500"}`} />
                                                    </div>
                                                    <p className="text-[10px] font-medium text-white">{item.name}</p>
                                                </div>
                                                <p className="text-[8px] text-zinc-500">{item.cat}</p>
                                            </div>
                                            <span className="text-[10px] font-bold text-[#d4a853]">{item.price}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </BrowserMockup>
                        <div className="md:order-last">
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d4a853]/20 bg-[#d4a853]/[0.06] px-3 py-1 text-xs font-medium text-[#d4a853]">
                                <UtensilsCrossed className="h-3 w-3" />
                                Menu Editor
                            </div>
                            <h3 className="text-2xl font-bold mb-3">Edit your menu in seconds</h3>
                            <p className="text-zinc-400 leading-relaxed mb-6">
                                Add dishes, set prices, upload photos, and mark dietary preferences. 
                                Changes go live instantly — no reprinting, no waiting.
                            </p>
                            <ul className="space-y-2">
                                {["Drag-and-drop categories", "Image upload for each dish", "Veg/Non-veg/Egg tags", "Instant availability toggle"].map(item => (
                                    <li key={item} className="flex items-center gap-2 text-sm text-zinc-300">
                                        <Check className="h-3.5 w-3.5 text-[#d4a853]" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Row 3: QR Printing */}
                    <div className="grid gap-12 md:grid-cols-2 md:items-center">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d4a853]/20 bg-[#d4a853]/[0.06] px-3 py-1 text-xs font-medium text-[#d4a853]">
                                <QrCode className="h-3 w-3" />
                                QR Printing
                            </div>
                            <h3 className="text-2xl font-bold mb-3">Print-ready QR cards</h3>
                            <p className="text-zinc-400 leading-relaxed mb-6">
                                Choose layouts, add WiFi credentials, customize taglines, and print with cut guides.
                                Each card has your hotel name and room number — ready to place on nightstands.
                            </p>
                            <ul className="space-y-2">
                                {["4, 6, or 8 cards per page", "Hotel branding on every card", "WiFi credentials included", "Cut guides for clean edges"].map(item => (
                                    <li key={item} className="flex items-center gap-2 text-sm text-zinc-300">
                                        <Check className="h-3.5 w-3.5 text-[#d4a853]" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="rounded-2xl border border-white/[0.08] bg-[#111113] p-6 shadow-2xl shadow-black/40">
                            <div className="flex items-center gap-2 mb-5">
                                <Printer className="h-4 w-4 text-[#d4a853]" />
                                <p className="text-[12px] font-semibold text-white">Room QR Codes</p>
                                <span className="ml-auto rounded-full bg-[#d4a853]/15 px-2.5 py-0.5 text-[9px] font-medium text-[#d4a853]">6 per page</span>
                            </div>
                            {/* QR grid */}
                            <div className="grid grid-cols-3 gap-2.5">
                                {["101", "102", "103", "201", "202", "203"].map(room => (
                                    <MockupQrCard key={room} room={`Room ${room}`} />
                                ))}
                            </div>
                            {/* WiFi bar */}
                            <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                                <Wifi className="h-3 w-3 text-zinc-500" />
                                <span className="text-[10px] text-zinc-400">GrandPalace_WiFi</span>
                                <span className="ml-auto text-[9px] text-zinc-600">••••••••</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── How It Works ─── */}
            <section id="how-it-works" className="border-y border-white/[0.04] bg-white/[0.01] py-24 md:py-32">
                <div className="mx-auto max-w-5xl px-6">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                            Live in 5 minutes
                        </h2>
                        <p className="mt-4 text-lg text-zinc-400">
                            From sign-up to guests scanning — faster than ordering lunch.
                        </p>
                    </div>

                    <div className="mt-16 grid gap-8 md:grid-cols-4">
                        {[
                            { step: "01", title: "Register", desc: "Create your hotel account with one form. Instant access." },
                            { step: "02", title: "Add Your Menu", desc: "Upload dishes, set prices, add images. Organize by category." },
                            { step: "03", title: "Set Up Rooms", desc: "Add room numbers (bulk supported). QR codes generated instantly." },
                            { step: "04", title: "Print & Place", desc: "Print QR cards and place them in rooms. Guests scan and browse." },
                        ].map((item, i) => (
                            <div key={item.step} className="relative text-center">
                                {i < 3 && (
                                    <div className="absolute right-0 top-8 hidden h-px w-full translate-x-1/2 bg-gradient-to-r from-[#d4a853]/30 to-transparent md:block" />
                                )}
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#d4a853]/20 bg-[#d4a853]/[0.06] text-2xl font-bold text-[#d4a853]">
                                    {item.step}
                                </div>
                                <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                                <p className="text-sm text-zinc-400">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Pricing ─── */}
            <section id="pricing" className="py-24 md:py-32">
                <div className="mx-auto max-w-5xl px-6">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                            Simple, honest pricing
                        </h2>
                        <p className="mt-4 text-lg text-zinc-400">
                            Less than the cost of printing paper menus for one floor.
                        </p>
                    </div>

                    <div className="mt-16 grid gap-8 md:grid-cols-2 lg:max-w-3xl lg:mx-auto">
                        {/* Free */}
                        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8">
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold">Starter</h3>
                                <p className="mt-1 text-sm text-zinc-400">Perfect for trying things out</p>
                            </div>
                            <div className="mb-8 flex items-baseline gap-1">
                                <span className="text-4xl font-bold">Free</span>
                            </div>
                            <ul className="mb-8 space-y-3">
                                {[
                                    "Up to 5 rooms",
                                    "20 menu items",
                                    "QR code generation",
                                    "Mobile-optimized menu",
                                    "DreamCanvas branding",
                                ].map((item) => (
                                    <li key={item} className="flex items-center gap-3 text-sm text-zinc-300">
                                        <Check className="h-4 w-4 shrink-0 text-[#d4a853]" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link
                                href="/register"
                                className="flex w-full items-center justify-center rounded-xl border border-white/10 py-3 text-sm font-semibold text-white transition-all hover:border-white/20 hover:bg-white/[0.03]"
                            >
                                Get started
                            </Link>
                        </div>

                        {/* Pro */}
                        <div className="relative rounded-2xl border border-[#d4a853]/30 bg-[#d4a853]/[0.04] p-8">
                            <div className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-[#d4a853] to-[#b8862d] px-4 py-1 text-xs font-bold text-white shadow-lg shadow-[#d4a853]/20">
                                POPULAR
                            </div>
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold">Pro</h3>
                                <p className="mt-1 text-sm text-zinc-400">For hotels ready to go digital</p>
                            </div>
                            <div className="mb-8 flex items-baseline gap-1">
                                <span className="text-4xl font-bold">&#8377;299</span>
                                <span className="text-sm text-zinc-400">/month</span>
                            </div>
                            <ul className="mb-8 space-y-3">
                                {[
                                    "Unlimited rooms",
                                    "Unlimited menu items",
                                    "Your hotel branding",
                                    "Staff accounts (all roles)",
                                    "Advanced QR print layouts",
                                    "WiFi info on QR cards",
                                    "Priority support",
                                    "No DreamCanvas branding",
                                ].map((item) => (
                                    <li key={item} className="flex items-center gap-3 text-sm text-zinc-300">
                                        <Check className="h-4 w-4 shrink-0 text-[#d4a853]" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link
                                href="/register"
                                className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#d4a853] to-[#b8862d] py-3 text-sm font-semibold text-white shadow-lg shadow-[#d4a853]/20 transition-all hover:shadow-[#d4a853]/30 hover:brightness-110"
                            >
                                Start 14-day free trial
                            </Link>
                            <p className="mt-3 text-center text-xs text-zinc-500">No credit card required</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Testimonial ─── */}
            <section className="border-y border-white/[0.04] bg-white/[0.01] py-20">
                <div className="mx-auto max-w-3xl px-6 text-center">
                    <div className="mb-4 flex items-center justify-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className="h-5 w-5 fill-[#d4a853] text-[#d4a853]" />
                        ))}
                    </div>
                    <blockquote className="text-xl font-medium leading-relaxed text-zinc-200 md:text-2xl">
                        &ldquo;We replaced all our printed menus in 30 minutes.
                        Guests love scanning the QR — and we save thousands on reprinting every season.&rdquo;
                    </blockquote>
                    <p className="mt-6 text-sm text-zinc-500">
                        Hotel Manager, Boutique Property in Jaipur
                    </p>
                </div>
            </section>

            {/* ─── CTA ─── */}
            <section className="py-24 md:py-32">
                <div className="mx-auto max-w-3xl px-6 text-center">
                    <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                        Ready to go paperless?
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-400">
                        Join hotels across India who switched to DreamCanvas.
                        Set up your digital menu in minutes, not weeks.
                    </p>
                    <div className="mt-10">
                        <Link
                            href="/register"
                            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#d4a853] to-[#b8862d] px-10 py-4 text-base font-semibold text-white shadow-xl shadow-[#d4a853]/25 transition-all hover:shadow-[#d4a853]/40 hover:brightness-110"
                        >
                            Create your free account
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    </div>
                    <p className="mt-4 text-xs text-zinc-500">Free plan available. Upgrade anytime.</p>
                </div>
            </section>

            {/* ─── Footer ─── */}
            <footer className="border-t border-white/[0.06] py-12">
                <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#d4a853] to-[#b8862d]">
                            <UtensilsCrossed className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="text-sm font-semibold tracking-tight">dreamcanvas</span>
                    </div>
                    <div className="flex items-center gap-6 text-xs text-zinc-500">
                        <Link href="/terms" className="transition-colors hover:text-zinc-300">Terms</Link>
                        <Link href="/privacy" className="transition-colors hover:text-zinc-300">Privacy</Link>
                        <Link href="/login" className="transition-colors hover:text-zinc-300">Hotel Login</Link>
                    </div>
                    <p className="text-xs text-zinc-600">
                        &copy; {new Date().getFullYear()} DreamCanvas. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
