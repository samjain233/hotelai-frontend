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
} from "lucide-react";

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
