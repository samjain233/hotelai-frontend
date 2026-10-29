import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import {
    ArrowRight,
    Camera,
    Check,
    Clock3,
    Palette,
    Phone,
    Printer,
    QrCode,
    Leaf,
    LayoutGrid,
    Users,
    ShieldCheck,
    Smartphone,
} from "lucide-react";
import { LandingMobileNav } from "@/components/LandingMobileNav";

export const metadata: Metadata = {
    title: { absolute: "DreamCanvas — Digital menu and room service for hotels" },
    description:
        "A digital menu for every hotel room. Guests scan a QR, browse your menu with photos and call room service in one tap. Set up in ten minutes, free to start.",
};

/* ───────────────────────── Content ───────────────────────── */

const NAV = [
    { href: "#how-it-works", label: "How it works" },
    { href: "#features", label: "Features" },
    { href: "#pricing", label: "Pricing" },
    { href: "#faq", label: "FAQ" },
] as const;

const PROOF = [
    { value: "50+", label: "hotels across India" },
    { value: "10 min", label: "from sign-up to QR in rooms" },
    { value: "0", label: "apps for guests to install" },
    { value: "₹0", label: "to start" },
] as const;

const STEPS = [
    {
        n: "01",
        title: "Photograph your menu",
        desc: "Upload a photo of your printed menu. We read every item and price, you review and publish.",
    },
    {
        n: "02",
        title: "Print the QR cards",
        desc: "Download print-ready cards in your colours and place one on every bedside table.",
    },
    {
        n: "03",
        title: "Guests scan and browse",
        desc: "The menu opens in any phone browser. Guests browse with photos and call room service in one tap.",
    },
] as const;

const FEATURES = [
    {
        icon: Camera,
        title: "Menu from a photo",
        desc: "Snap your paper menu and get a structured digital menu in seconds. Edit anything before publishing.",
    },
    {
        icon: Palette,
        title: "Your brand, not ours",
        desc: "Logo, colours and layout to match your property. Thirteen layouts, from a photo gallery, bento mosaic, swipeable carousel or café chalkboard to a heritage palace menu, a spotlight on your signature dishes or a compact list for 200-dish kitchens.",
    },
    {
        icon: Clock3,
        title: "Menus that follow the clock",
        desc: "Breakfast disappears at 11, the bar appears at 6. Set times and days per category once.",
    },
    {
        icon: Phone,
        title: "One-tap room service",
        desc: "A call button on every menu rings your room-service line. No app, no form, no friction.",
    },
    {
        icon: Leaf,
        title: "Veg, non-veg and allergens",
        desc: "Clear dietary markers, spice levels and allergen tags so guests order with confidence.",
    },
    {
        icon: Printer,
        title: "Print-ready QR cards",
        desc: "A6 stand cards and A4 sheets with cut guides, in your QR colours. Reprint any room any time.",
    },
] as const;

const OWNER_POINTS = [
    { icon: Smartphone, text: "Change a price from your phone; guests see it on the next scan." },
    { icon: Users, text: "Staff accounts with roles for front desk, kitchen and managers." },
    { icon: LayoutGrid, text: "Rooms, floors and QR codes managed from one place." },
    { icon: ShieldCheck, text: "Guest pages are fast on slow 4G and need no login." },
] as const;

const PLANS = [
    {
        name: "Free",
        price: "₹0",
        period: "forever",
        blurb: "Everything a small property needs to go paperless.",
        features: ["Digital menu with one property QR", "Up to 40 menu items", "Classic list layout", "DreamCanvas branding"],
        cta: "Start free",
        href: "/register",
        featured: false,
        soon: false,
    },
    {
        name: "Starter",
        price: "₹499",
        period: "per month, or ₹4,999 a year",
        blurb: "Your menu, your brand, every room.",
        features: [
            "Unlimited items with photos",
            "Menu import from a photo",
            "Your logo, colours and layout",
            "Time-based categories",
            "One-tap room-service call",
            "Print-ready QR cards for every room",
        ],
        cta: "Start with Starter",
        href: "/register",
        featured: true,
        soon: false,
    },
    {
        name: "Core",
        price: "₹1,999",
        period: "per month, up to 20 rooms",
        blurb: "In-room ordering with a live kitchen queue.",
        features: ["Everything in Starter", "Guests order from the menu", "Orders to kitchen screen and WhatsApp", "Service requests and housekeeping"],
        cta: "Join the waitlist",
        href: "/register",
        featured: false,
        soon: true,
    },
] as const;

const FAQ = [
    {
        q: "Do guests need to download anything?",
        a: "No. The QR opens a web page in the phone's camera or browser. There is nothing to install and no login for guests.",
    },
    {
        q: "How long does it take to set up?",
        a: "Most hotels are live in about ten minutes: create an account, photograph your menu, check the items, pick your colours and print the QR cards.",
    },
    {
        q: "Can I change prices and items myself?",
        a: "Yes, from any phone or laptop. Changes are visible to guests on their next scan, so seasonal menus and price updates take seconds, not a reprint.",
    },
    {
        q: "What happens when a guest wants to order?",
        a: "On Free and Starter, every menu has a one-tap call button that rings your room-service line. In-room ordering with a kitchen queue is the Core plan, opening soon.",
    },
    {
        q: "Is this only for hotels?",
        a: "It is built for independent hotels, guesthouses and resorts. Restaurants and cafes are welcome to use the Free and Starter plans too.",
    },
] as const;

/* ───────────────────────── Small pieces ───────────────────────── */

function Logo({ className = "" }: { className?: string }) {
    return (
        <Link href="/" className={`flex items-center gap-2.5 ${className}`} aria-label="DreamCanvas home">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#14172b]">
                <QrCode className="h-4 w-4 text-[#d4a853]" strokeWidth={2.25} />
            </span>
            <span className="text-[17px] font-semibold tracking-tight text-[#14172b]">dreamcanvas</span>
        </Link>
    );
}

function PrimaryLink({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
    return (
        <Link
            href={href}
            className={`group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#14172b] px-6 text-[15px] font-semibold text-white transition-colors hover:bg-[#232848] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a853] focus-visible:ring-offset-2 ${className}`}
        >
            {children}
        </Link>
    );
}

function SecondaryLink({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
    return (
        <Link
            href={href}
            className={`inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#e3e0d8] bg-white px-6 text-[15px] font-semibold text-[#14172b] transition-colors hover:border-[#14172b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a853] focus-visible:ring-offset-2 ${className}`}
        >
            {children}
        </Link>
    );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
    return <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#b8862b]">{children}</p>;
}

/* A static, hand-drawn rendering of the guest menu, so the hero shows the real product shape. */
function PhoneMockup() {
    const items = [
        { name: "Masala omelette", meta: "Served with toast · 2 eggs", price: "₹180", veg: false },
        { name: "Poha with sev", meta: "Light, lemon, peanuts", price: "₹120", veg: true },
        { name: "Filter coffee", meta: "South Indian, strong", price: "₹90", veg: true },
        { name: "Aloo paratha (2)", meta: "Curd, pickle, butter", price: "₹160", veg: true },
    ];
    return (
        <div className="relative mx-auto w-[300px] sm:w-[320px]" aria-hidden="true">
            <div className="rounded-[2.4rem] border border-[#d9d6ce] bg-[#14172b] p-[10px] shadow-[0_30px_60px_-30px_rgba(20,23,43,0.45)]">
                <div className="overflow-hidden rounded-[1.9rem] bg-white">
                    {/* status bar */}
                    <div className="flex items-center justify-between px-6 pt-3 text-[11px] font-medium text-[#14172b]">
                        <span>9:41</span>
                        <span className="h-4 w-20 rounded-full bg-[#14172b]" />
                        <span>●●●</span>
                    </div>
                    {/* header */}
                    <div className="px-5 pt-4">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-[#7a7f99]">Room 204</p>
                        <p className="mt-0.5 text-[18px] font-semibold tracking-tight text-[#14172b]">The Courtyard Inn</p>
                        <div className="mt-3 flex gap-2 overflow-hidden">
                            {["Breakfast", "All day", "Beverages", "Desserts"].map((c, i) => (
                                <span
                                    key={c}
                                    className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-medium ${i === 0 ? "bg-[#14172b] text-white" : "bg-[#f3f1ec] text-[#4b5068]"}`}
                                >
                                    {c}
                                </span>
                            ))}
                        </div>
                    </div>
                    {/* items */}
                    <ul className="mt-4 divide-y divide-[#efede8] px-5">
                        {items.map((it) => (
                            <li key={it.name} className="flex items-start justify-between gap-3 py-3">
                                <div className="flex min-w-0 items-start gap-2.5">
                                    <span
                                        className={`mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center border ${it.veg ? "border-[#2f7f6f]" : "border-[#b43c2e]"}`}
                                    >
                                        <span className={`h-1.5 w-1.5 rounded-full ${it.veg ? "bg-[#2f7f6f]" : "bg-[#b43c2e]"}`} />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="truncate text-[14px] font-medium text-[#14172b]">{it.name}</p>
                                        <p className="truncate text-[12px] text-[#7a7f99]">{it.meta}</p>
                                    </div>
                                </div>
                                <span className="shrink-0 text-[14px] font-semibold text-[#14172b]">{it.price}</span>
                            </li>
                        ))}
                    </ul>
                    {/* call button */}
                    <div className="px-5 pb-6 pt-3">
                        <div className="flex h-11 items-center justify-center gap-2 rounded-full bg-[#d4a853] text-[14px] font-semibold text-[#14172b]">
                            <Phone className="h-4 w-4" />
                            Call room service
                        </div>
                    </div>
                </div>
            </div>
            {/* floating chip */}
            <div className="absolute right-full bottom-24 -mr-5 hidden w-max items-center gap-2 whitespace-nowrap rounded-xl border border-[#e3e0d8] bg-white px-3 py-2 shadow-[0_12px_30px_-18px_rgba(20,23,43,0.5)] lg:flex">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fbf3e3]">
                    <QrCode className="h-3.5 w-3.5 text-[#b8862b]" />
                </span>
                <div className="leading-tight">
                    <p className="text-[12px] font-semibold text-[#14172b]">Menu opened</p>
                    <p className="text-[11px] text-[#7a7f99]">Room 204 · just now</p>
                </div>
            </div>
        </div>
    );
}

/* A static rendering of the owner dashboard. */
function DashboardMockup() {
    const rows = [
        { room: "101", item: "Breakfast · Classic", state: "Live" },
        { room: "204", item: "Beverages · Gallery", state: "Live" },
        { room: "305", item: "All day · Classic", state: "Printing" },
    ];
    return (
        <div className="rounded-2xl border border-[#e3e0d8] bg-white p-2 shadow-[0_30px_60px_-40px_rgba(20,23,43,0.45)]" aria-hidden="true">
            <div className="rounded-xl bg-[#f7f5f0] p-4 sm:p-5">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-medium uppercase tracking-wider text-[#7a7f99]">The Courtyard Inn</p>
                        <p className="text-[16px] font-semibold text-[#14172b]">Menu & rooms</p>
                    </div>
                    <span className="rounded-full bg-[#14172b] px-3 py-1 text-[12px] font-medium text-white">Publish</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                    {[
                        { k: "Items", v: "64" },
                        { k: "Rooms", v: "28" },
                        { k: "Scans today", v: "137" },
                    ].map((s) => (
                        <div key={s.k} className="rounded-lg border border-[#e9e6df] bg-white p-3">
                            <p className="text-[11px] text-[#7a7f99]">{s.k}</p>
                            <p className="text-[18px] font-semibold tracking-tight text-[#14172b]">{s.v}</p>
                        </div>
                    ))}
                </div>
                <div className="mt-3 overflow-hidden rounded-lg border border-[#e9e6df] bg-white">
                    <div className="grid grid-cols-[56px_1fr_72px] border-b border-[#efede8] px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-[#7a7f99]">
                        <span>Room</span>
                        <span>Menu</span>
                        <span className="text-right">QR</span>
                    </div>
                    {rows.map((r) => (
                        <div key={r.room} className="grid grid-cols-[56px_1fr_72px] items-center border-b border-[#efede8] px-3 py-2.5 text-[13px] last:border-0">
                            <span className="font-semibold text-[#14172b]">{r.room}</span>
                            <span className="truncate text-[#4b5068]">{r.item}</span>
                            <span className="text-right">
                                <span className={`inline-flex items-center gap-1 text-[12px] font-medium ${r.state === "Live" ? "text-[#2f7f6f]" : "text-[#b8862b]"}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${r.state === "Live" ? "bg-[#2f7f6f]" : "bg-[#b8862b]"}`} />
                                    {r.state}
                                </span>
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ───────────────────────── Page ───────────────────────── */

export default async function LandingPage() {
    const cookieStore = await cookies();
    const loggedIn = Boolean(cookieStore.get("auth_token")?.value || cookieStore.get("auth_refresh")?.value);
    const primaryHref = loggedIn ? "/dashboard" : "/register";

    return (
        <div className="min-h-screen bg-white text-[#14172b] antialiased">
            {/* ─── Header ─── */}
            <header className="sticky top-0 z-50 border-b border-[#ecebe6] bg-white/85 backdrop-blur-md">
                <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6" aria-label="Primary">
                    <Logo />
                    <div className="hidden items-center gap-8 text-[14px] font-medium text-[#4b5068] md:flex">
                        {NAV.map((n) => (
                            <a key={n.href} href={n.href} className="transition-colors hover:text-[#14172b]">
                                {n.label}
                            </a>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        {loggedIn ? (
                            <Link
                                href="/dashboard"
                                className="inline-flex h-9 items-center rounded-full bg-[#14172b] px-4 text-[14px] font-semibold text-white transition-colors hover:bg-[#232848]"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="hidden h-9 items-center px-3 text-[14px] font-medium text-[#4b5068] transition-colors hover:text-[#14172b] md:inline-flex"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    href="/register"
                                    className="inline-flex h-9 items-center rounded-full bg-[#14172b] px-4 text-[14px] font-semibold text-white transition-colors hover:bg-[#232848]"
                                >
                                    Start free
                                </Link>
                            </>
                        )}
                        <LandingMobileNav loggedIn={loggedIn} />
                    </div>
                </nav>
            </header>

            <main>
                {/* ─── Hero ─── */}
                <section className="relative overflow-hidden">
                    <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(60%_60%_at_70%_0%,#fbf3e3_0%,rgba(251,243,227,0)_70%)]" />
                    <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 md:pt-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pb-28">
                        <div className="max-w-xl">
                            <Eyebrow>Digital menus for independent hotels</Eyebrow>
                            <h1 className="mt-4 font-serif text-[44px] leading-[1.04] tracking-[-0.02em] sm:text-[56px] lg:text-[64px]">
                                Your hotel menu,
                                <br />
                                one scan away.
                            </h1>
                            <p className="mt-6 max-w-lg text-[18px] leading-relaxed text-[#4b5068]">
                                A QR card in every room opens a menu guests actually enjoy reading, with photos, dietary
                                markers and a one-tap call to room service. Set up in ten minutes. No app, no printing
                                every time a price changes.
                            </p>
                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <PrimaryLink href={primaryHref}>
                                    {loggedIn ? "Go to dashboard" : "Start free"}
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                </PrimaryLink>
                                <SecondaryLink href="#how-it-works">See how it works</SecondaryLink>
                            </div>
                            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-[#4b5068]">
                                {["No app for guests", "Live in 10 minutes", "No card required"].map((t) => (
                                    <li key={t} className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-[#2f7f6f]" strokeWidth={2.5} />
                                        {t}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative">
                            <PhoneMockup />
                        </div>
                    </div>
                </section>

                {/* ─── Proof strip ─── */}
                <section className="border-y border-[#ecebe6] bg-[#f7f5f0]">
                    <ul className="mx-auto grid max-w-6xl grid-cols-2 divide-[#e3e0d8] px-4 sm:px-6 md:grid-cols-4 md:divide-x">
                        {PROOF.map((p) => (
                            <li key={p.label} className="py-8 md:px-8 md:first:pl-0 md:last:pr-0">
                                <p className="text-[32px] font-semibold tracking-tight text-[#14172b]">{p.value}</p>
                                <p className="mt-1 text-[13px] text-[#7a7f99]">{p.label}</p>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* ─── How it works ─── */}
                <section id="how-it-works" className="scroll-mt-20 py-20 md:py-28">
                    <div className="mx-auto max-w-6xl px-4 sm:px-6">
                        <div className="max-w-2xl">
                            <Eyebrow>How it works</Eyebrow>
                            <h2 className="mt-3 font-serif text-[34px] leading-tight tracking-[-0.01em] sm:text-[42px]">
                                From paper menu to every room, before check-in.
                            </h2>
                        </div>
                        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
                            {STEPS.map((s) => (
                                <li key={s.n} className="relative border-t border-[#14172b] pt-6">
                                    <span className="text-[13px] font-semibold tabular-nums text-[#b8862b]">{s.n}</span>
                                    <h3 className="mt-3 text-[20px] font-semibold tracking-tight">{s.title}</h3>
                                    <p className="mt-2 text-[15px] leading-relaxed text-[#4b5068]">{s.desc}</p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                {/* ─── Features ─── */}
                <section id="features" className="scroll-mt-20 border-t border-[#ecebe6] bg-[#f7f5f0] py-20 md:py-28">
                    <div className="mx-auto max-w-6xl px-4 sm:px-6">
                        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                            <div className="max-w-2xl">
                                <Eyebrow>What you get</Eyebrow>
                                <h2 className="mt-3 font-serif text-[34px] leading-tight tracking-[-0.01em] sm:text-[42px]">
                                    Everything a menu should do on a phone.
                                </h2>
                            </div>
                            <p className="max-w-sm text-[15px] leading-relaxed text-[#4b5068]">
                                Built for properties with ten to a hundred rooms and no IT department. Every feature below
                                is live today.
                            </p>
                        </div>
                        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-[#e3e0d8] bg-[#e3e0d8] sm:grid-cols-2 lg:grid-cols-3">
                            {FEATURES.map(({ icon: Icon, title, desc }) => (
                                <article key={title} className="bg-white p-7">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fbf3e3]">
                                        <Icon className="h-5 w-5 text-[#b8862b]" strokeWidth={2} />
                                    </span>
                                    <h3 className="mt-5 text-[17px] font-semibold tracking-tight">{title}</h3>
                                    <p className="mt-2 text-[14.5px] leading-relaxed text-[#4b5068]">{desc}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── For owners ─── */}
                <section id="for-hotels" className="scroll-mt-20 py-20 md:py-28">
                    <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
                        <div>
                            <Eyebrow>For owners and managers</Eyebrow>
                            <h2 className="mt-3 font-serif text-[34px] leading-tight tracking-[-0.01em] sm:text-[42px]">
                                Run it from the front desk, or from your phone.
                            </h2>
                            <p className="mt-5 text-[16px] leading-relaxed text-[#4b5068]">
                                One dashboard for menu, rooms and QR cards. Nothing to install at the property, nothing for
                                staff to learn beyond what they already do on WhatsApp.
                            </p>
                            <ul className="mt-8 space-y-4">
                                {OWNER_POINTS.map(({ icon: Icon, text }) => (
                                    <li key={text} className="flex items-start gap-3">
                                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#e3e0d8] bg-white">
                                            <Icon className="h-3.5 w-3.5 text-[#14172b]" />
                                        </span>
                                        <span className="text-[15.5px] leading-relaxed text-[#14172b]">{text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <DashboardMockup />
                    </div>
                </section>

                {/* ─── Pricing ─── */}
                <section id="pricing" className="scroll-mt-20 border-t border-[#ecebe6] bg-[#f7f5f0] py-20 md:py-28">
                    <div className="mx-auto max-w-6xl px-4 sm:px-6">
                        <div className="mx-auto max-w-2xl text-center">
                            <Eyebrow>Pricing</Eyebrow>
                            <h2 className="mt-3 font-serif text-[34px] leading-tight tracking-[-0.01em] sm:text-[42px]">
                                Start free. Pay when it earns its keep.
                            </h2>
                            <p className="mt-4 text-[16px] text-[#4b5068]">
                                No setup fee, no contract. Annual billing on Starter gives you two months free.
                            </p>
                        </div>
                        <div className="mt-14 grid gap-5 lg:grid-cols-3">
                            {PLANS.map((p) => (
                                <div
                                    key={p.name}
                                    className={`relative flex flex-col rounded-2xl border p-7 ${
                                        p.featured ? "border-[#14172b] bg-[#14172b] text-white" : "border-[#e3e0d8] bg-white"
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[15px] font-semibold uppercase tracking-[0.12em]">{p.name}</h3>
                                        {p.featured && (
                                            <span className="rounded-full bg-[#d4a853] px-2.5 py-0.5 text-[11px] font-semibold text-[#14172b]">
                                                Most chosen
                                            </span>
                                        )}
                                        {p.soon && (
                                            <span className="rounded-full border border-[#e3e0d8] px-2.5 py-0.5 text-[11px] font-semibold text-[#7a7f99]">
                                                Coming soon
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-5 flex items-baseline gap-2">
                                        <span className="text-[40px] font-semibold tracking-tight">{p.price}</span>
                                    </p>
                                    <p className={`text-[13px] ${p.featured ? "text-white/70" : "text-[#7a7f99]"}`}>{p.period}</p>
                                    <p className={`mt-4 text-[15px] ${p.featured ? "text-white/85" : "text-[#4b5068]"}`}>{p.blurb}</p>
                                    <ul className="mt-6 mb-8 space-y-3">
                                        {p.features.map((f) => (
                                            <li key={f} className="flex items-start gap-2.5 text-[14.5px]">
                                                <Check
                                                    className={`mt-0.5 h-4 w-4 shrink-0 ${p.featured ? "text-[#d4a853]" : "text-[#2f7f6f]"}`}
                                                    strokeWidth={2.5}
                                                />
                                                <span className={p.featured ? "text-white/90" : "text-[#14172b]"}>{f}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Link
                                        href={p.href}
                                        className={`mt-auto inline-flex h-11 items-center justify-center rounded-full text-[14.5px] font-semibold transition-colors ${
                                            p.featured
                                                ? "bg-[#d4a853] text-[#14172b] hover:bg-[#e0b866]"
                                                : "border border-[#14172b] text-[#14172b] hover:bg-[#14172b] hover:text-white"
                                        }`}
                                    >
                                        {p.cta}
                                    </Link>
                                </div>
                            ))}
                        </div>
                        <p className="mt-8 text-center text-[13px] text-[#7a7f99]">
                            Prices exclude GST. Physical acrylic QR stands available as a one-time add-on.
                        </p>
                    </div>
                </section>

                {/* ─── FAQ ─── */}
                <section id="faq" className="scroll-mt-20 py-20 md:py-28">
                    <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
                        <div>
                            <Eyebrow>Questions</Eyebrow>
                            <h2 className="mt-3 font-serif text-[34px] leading-tight tracking-[-0.01em] sm:text-[42px]">
                                Asked by most owners before they start.
                            </h2>
                        </div>
                        <div className="divide-y divide-[#ecebe6] border-y border-[#ecebe6]">
                            {FAQ.map((f) => (
                                <details key={f.q} className="group py-5">
                                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-medium text-[#14172b] [&::-webkit-details-marker]:hidden">
                                        {f.q}
                                        <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#e3e0d8]">
                                            <span className="h-px w-2.5 bg-[#14172b]" />
                                            <span className="absolute h-2.5 w-px bg-[#14172b] transition-transform group-open:scale-y-0" />
                                        </span>
                                    </summary>
                                    <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-[#4b5068]">{f.a}</p>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── CTA ─── */}
                <section className="px-4 pb-20 sm:px-6 md:pb-28">
                    <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 rounded-3xl bg-[#14172b] px-8 py-12 text-white sm:px-12 md:flex-row md:items-center md:py-16">
                        <div className="max-w-xl">
                            <h2 className="font-serif text-[32px] leading-tight tracking-[-0.01em] sm:text-[40px]">
                                Put your menu in every room tonight.
                            </h2>
                            <p className="mt-3 text-[16px] text-white/75">
                                Create your account, photograph the menu, print the cards. Free until you need more.
                            </p>
                        </div>
                        <Link
                            href={primaryHref}
                            className="group inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-[#d4a853] px-7 text-[15px] font-semibold text-[#14172b] transition-colors hover:bg-[#e0b866]"
                        >
                            {loggedIn ? "Go to dashboard" : "Create your free account"}
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    </div>
                </section>
            </main>

            {/* ─── Footer ─── */}
            <footer className="border-t border-[#ecebe6]">
                <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
                    <div>
                        <Logo />
                        <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-[#4b5068]">
                            Digital menus and room service for independent hotels in India.
                        </p>
                    </div>
                    <div>
                        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#14172b]">Product</p>
                        <ul className="mt-4 space-y-2.5 text-[14px] text-[#4b5068]">
                            {NAV.map((n) => (
                                <li key={n.href}>
                                    <a href={n.href} className="hover:text-[#14172b]">
                                        {n.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#14172b]">Account</p>
                        <ul className="mt-4 space-y-2.5 text-[14px] text-[#4b5068]">
                            <li>
                                <Link href={loggedIn ? "/dashboard" : "/login"} className="hover:text-[#14172b]">
                                    {loggedIn ? "Dashboard" : "Hotel login"}
                                </Link>
                            </li>
                            <li>
                                <Link href="/register" className="hover:text-[#14172b]">
                                    Create account
                                </Link>
                            </li>
                            <li>
                                <Link href="/staff/access" className="hover:text-[#14172b]">
                                    Staff access key
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#14172b]">Legal</p>
                        <ul className="mt-4 space-y-2.5 text-[14px] text-[#4b5068]">
                            <li>
                                <Link href="/terms" className="hover:text-[#14172b]">
                                    Terms
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="hover:text-[#14172b]">
                                    Privacy
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-[#ecebe6]">
                    <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-[13px] text-[#7a7f99] sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <p>&copy; {new Date().getFullYear()} DreamCanvas. Made in India.</p>
                        <p>Built for hotels with 10 to 100 rooms.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
