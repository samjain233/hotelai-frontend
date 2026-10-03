import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import {
    ArrowRight,
    Check,
    UtensilsCrossed,
    QrCode,
    BellRing,
    Printer,
    Users,
    Sparkles,
} from "lucide-react";
import { LandingMobileNav } from "@/components/LandingMobileNav";

export const metadata: Metadata = {
    title: { absolute: "DreamCanvas — Digital Menu for Hotels" },
    description:
        "Give your guests a premium digital menu experience. QR-based room service menus, real-time updates, and beautiful print-ready QR codes.",
};

const STEPS = [
    {
        n: "1",
        title: "Guest scans",
        desc: "A QR card in every room. No app needed.",
        img: "/illustrations/step-scan.jpg",
        alt: "Guest scanning a QR card on a hotel nightstand",
        tint: "bg-[#fde7c2]",
    },
    {
        n: "2",
        title: "Kitchen cooks",
        desc: "Orders land on the kitchen screen instantly.",
        img: "/illustrations/step-kitchen.jpg",
        alt: "Chef receiving a new order on a kitchen screen",
        tint: "bg-[#fbd9cf]",
    },
    {
        n: "3",
        title: "Served with a smile",
        desc: "Hot food at the door, happy guests.",
        img: "/illustrations/step-deliver.jpg",
        alt: "Room service waiter delivering food to a smiling guest",
        tint: "bg-[#d3ebe7]",
    },
] as const;

const OWNER_PERKS = [
    { icon: UtensilsCrossed, label: "Update menu & prices in seconds" },
    { icon: Printer, label: "Print-ready QR cards for every room" },
    { icon: BellRing, label: "Live orders & service requests" },
    { icon: Users, label: "Staff accounts with roles" },
] as const;

const PLANS = [
    {
        name: "Starter",
        price: "Free",
        period: "",
        features: ["Up to 5 rooms", "20 menu items", "QR code generation"],
        cta: "Get started",
        featured: false,
    },
    {
        name: "Pro",
        price: "₹299",
        period: "/month",
        features: ["Unlimited rooms & items", "Your hotel branding", "Staff accounts & priority support"],
        cta: "Start 14-day free trial",
        featured: true,
    },
] as const;

function Logo({ small = false }: { small?: boolean }) {
    return (
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <span
                className={`flex items-center justify-center rounded-xl border-2 border-[#1f2340] bg-[#d4a853] ${small ? "h-7 w-7" : "h-9 w-9"}`}
            >
                <UtensilsCrossed className={small ? "h-3.5 w-3.5 text-[#1f2340]" : "h-4 w-4 text-[#1f2340]"} />
            </span>
            <span className={`font-bold tracking-tight ${small ? "text-sm" : "text-lg"}`}>dreamcanvas</span>
        </Link>
    );
}

function PrimaryButton({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
    return (
        <Link
            href={href}
            className={`group inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-[#1f2340] bg-[#d4a853] px-7 py-3.5 font-semibold text-[#1f2340] shadow-[4px_4px_0_#1f2340] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1f2340] active:translate-y-0 active:shadow-[2px_2px_0_#1f2340] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d4a853]/50 ${className}`}
        >
            {children}
        </Link>
    );
}

export default async function LandingPage() {
    const loggedIn = Boolean((await cookies()).get("auth_token")?.value);

    return (
        <div className="min-h-screen overflow-x-hidden bg-[#fff6e8] text-[#1f2340]">
            {/* ─── Navbar ─── */}
            <header className="fixed inset-x-0 top-3 z-50 px-3 sm:top-4 sm:px-6">
                <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between rounded-2xl border-2 border-[#1f2340] bg-white/90 px-3 shadow-[3px_3px_0_#1f2340] backdrop-blur-md sm:h-16 sm:px-5">
                    <Logo />
                    <div className="hidden items-center gap-8 text-sm font-medium text-[#4a4e6a] md:flex">
                        <a href="#how-it-works" className="cursor-pointer transition-colors hover:text-[#1f2340]">How it works</a>
                        <a href="#for-hotels" className="cursor-pointer transition-colors hover:text-[#1f2340]">For hotels</a>
                        <a href="#pricing" className="cursor-pointer transition-colors hover:text-[#1f2340]">Pricing</a>
                    </div>
                    <div className="flex items-center gap-2">
                        {loggedIn ? (
                            <Link
                                href="/dashboard"
                                className="cursor-pointer rounded-xl border-2 border-[#1f2340] bg-[#d4a853] px-3 py-1.5 text-sm font-semibold text-[#1f2340] transition-colors hover:bg-[#e0b866] sm:px-4 sm:py-2"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="hidden cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold text-[#1f2340] transition-colors hover:bg-[#1f2340]/5 md:block"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    href="/register"
                                    className="cursor-pointer rounded-xl border-2 border-[#1f2340] bg-[#d4a853] px-3 py-1.5 text-sm font-semibold text-[#1f2340] transition-colors hover:bg-[#e0b866] sm:px-4 sm:py-2"
                                >
                                    Get started
                                </Link>
                            </>
                        )}
                        <LandingMobileNav loggedIn={loggedIn} />
                    </div>
                </nav>
            </header>

            <main>
                {/* ─── Hero ─── */}
                <section className="relative pt-28 pb-16 sm:pt-32 md:pt-40 md:pb-24">
                    <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-[#d4a853]/20 blur-3xl" />
                    <div className="pointer-events-none absolute top-1/2 -left-32 h-72 w-72 rounded-full bg-[#f07a5f]/10 blur-3xl" />

                    <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-8">
                        <div className="text-center lg:text-left">
                            <span className="inline-flex items-center gap-2 rounded-full border-2 border-[#1f2340] bg-white px-4 py-1.5 text-xs font-semibold">
                                <Sparkles className="h-3.5 w-3.5 text-[#c0892f]" />
                                Loved by 50+ hotels across India
                            </span>

                            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                                Room service,{" "}
                                <span className="relative inline-block">
                                    <span className="relative z-10">one scan away.</span>
                                    <span className="absolute inset-x-0 bottom-1 -z-0 h-3 rounded-full bg-[#d4a853]/60 sm:h-4" />
                                </span>
                            </h1>

                            <p className="mx-auto mt-5 max-w-lg text-lg text-[#4a4e6a] lg:mx-0">
                                QR menus your guests love. Orders your kitchen sees instantly.
                            </p>

                            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
                                <PrimaryButton href="/register">
                                    Start for free
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                </PrimaryButton>
                                <a
                                    href="#how-it-works"
                                    className="cursor-pointer rounded-2xl px-6 py-3.5 font-semibold text-[#1f2340] underline decoration-[#d4a853] decoration-2 underline-offset-4 transition-colors hover:decoration-[#1f2340]"
                                >
                                    See how it works
                                </a>
                            </div>

                            <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium text-[#4a4e6a] lg:justify-start">
                                {["No app for guests", "Live in 5 minutes", "No credit card"].map((t) => (
                                    <li key={t} className="flex items-center gap-1.5">
                                        <Check className="h-4 w-4 text-[#3f8f8c]" strokeWidth={3} />
                                        {t}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="relative mx-auto w-full max-w-xl">
                            <div className="overflow-hidden rounded-[2rem] border-2 border-[#1f2340] bg-[#fdf3e2] shadow-[8px_8px_0_#1f2340]">
                                <Image
                                    src="/illustrations/hero-guest.jpg"
                                    alt="Hotel guest browsing a room-service menu on her phone after scanning a QR card"
                                    width={1024}
                                    height={768}
                                    priority
                                    sizes="(min-width: 1024px) 560px, 100vw"
                                    className="h-auto w-full"
                                />
                            </div>
                            <div className="absolute -bottom-5 -left-3 flex items-center gap-2 rounded-2xl border-2 border-[#1f2340] bg-white px-4 py-2.5 shadow-[3px_3px_0_#1f2340] animate-[float_6s_ease-in-out_infinite] sm:-left-6">
                                <QrCode className="h-5 w-5 text-[#c0892f]" />
                                <span className="text-sm font-semibold">Order placed · Room 204</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── How it works ─── */}
                <section id="how-it-works" className="scroll-mt-24 py-16 md:py-24">
                    <div className="mx-auto max-w-6xl px-4 sm:px-6">
                        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
                            Scan. Order. Enjoy.
                        </h2>

                        <div className="mt-12 grid gap-6 md:grid-cols-3">
                            {STEPS.map((s) => (
                                <article
                                    key={s.n}
                                    className="overflow-hidden rounded-3xl border-2 border-[#1f2340] bg-white shadow-[5px_5px_0_#1f2340]"
                                >
                                    <div className={`${s.tint} border-b-2 border-[#1f2340]`}>
                                        <Image
                                            src={s.img}
                                            alt={s.alt}
                                            width={1024}
                                            height={1024}
                                            sizes="(min-width: 768px) 360px, 100vw"
                                            className="aspect-[4/3] h-auto w-full object-cover mix-blend-multiply"
                                        />
                                    </div>
                                    <div className="flex items-start gap-3 p-5">
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#1f2340] bg-[#d4a853] text-sm font-bold">
                                            {s.n}
                                        </span>
                                        <div>
                                            <h3 className="text-lg font-bold">{s.title}</h3>
                                            <p className="mt-0.5 text-[#4a4e6a]">{s.desc}</p>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── For hotels ─── */}
                <section id="for-hotels" className="scroll-mt-24 py-16 md:py-24">
                    <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
                        <div className="order-last mx-auto w-full max-w-xl overflow-hidden rounded-[2rem] border-2 border-[#1f2340] bg-[#fdf3e2] shadow-[8px_8px_0_#1f2340] lg:order-first">
                            <Image
                                src="/illustrations/manager-desk.jpg"
                                alt="Hotel manager managing menus, rooms and orders from a laptop"
                                width={1024}
                                height={768}
                                sizes="(min-width: 1024px) 560px, 100vw"
                                className="h-auto w-full"
                            />
                        </div>

                        <div>
                            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                                Your whole hotel,
                                <br />
                                one simple dashboard.
                            </h2>
                            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                                {OWNER_PERKS.map(({ icon: Icon, label }) => (
                                    <li
                                        key={label}
                                        className="flex items-center gap-3 rounded-2xl border-2 border-[#1f2340] bg-white p-4 font-semibold"
                                    >
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fde7c2]">
                                            <Icon className="h-5 w-5 text-[#1f2340]" />
                                        </span>
                                        <span className="text-sm leading-snug">{label}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                {/* ─── Pricing ─── */}
                <section id="pricing" className="scroll-mt-24 py-16 md:py-24">
                    <div className="mx-auto max-w-4xl px-4 sm:px-6">
                        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
                            Simple pricing
                        </h2>
                        <p className="mt-3 text-center text-[#4a4e6a]">Start free. Upgrade when you grow.</p>

                        <div className="mt-12 grid gap-6 md:grid-cols-2">
                            {PLANS.map((p) => (
                                <div
                                    key={p.name}
                                    className={`relative flex flex-col rounded-3xl border-2 border-[#1f2340] p-7 shadow-[5px_5px_0_#1f2340] ${p.featured ? "bg-[#fde7c2]" : "bg-white"}`}
                                >
                                    {p.featured && (
                                        <span className="absolute -top-3.5 right-6 rounded-full border-2 border-[#1f2340] bg-[#f07a5f] px-3 py-0.5 text-xs font-bold text-white">
                                            Popular
                                        </span>
                                    )}
                                    <h3 className="text-lg font-bold">{p.name}</h3>
                                    <p className="mt-3 flex items-baseline gap-1">
                                        <span className="text-4xl font-extrabold">{p.price}</span>
                                        {p.period && <span className="text-[#4a4e6a]">{p.period}</span>}
                                    </p>
                                    <ul className="mt-6 mb-8 space-y-2.5">
                                        {p.features.map((f) => (
                                            <li key={f} className="flex items-center gap-2.5 font-medium">
                                                <Check className="h-4 w-4 shrink-0 text-[#3f8f8c]" strokeWidth={3} />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                    <Link
                                        href="/register"
                                        className={`mt-auto flex cursor-pointer items-center justify-center rounded-2xl border-2 border-[#1f2340] py-3 font-semibold transition-colors ${p.featured ? "bg-[#1f2340] text-white hover:bg-[#2c3157]" : "bg-white hover:bg-[#fff6e8]"}`}
                                    >
                                        {p.cta}
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── CTA ─── */}
                <section className="px-4 pt-8 pb-20 sm:px-6 md:pb-28">
                    <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] border-2 border-[#1f2340] bg-[#d4a853] px-6 py-14 text-center shadow-[8px_8px_0_#1f2340] sm:px-12">
                        <div className="pointer-events-none absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/20" />
                        <div className="pointer-events-none absolute -right-8 -bottom-12 h-48 w-48 rounded-full bg-[#f07a5f]/30" />
                        <h2 className="relative text-3xl font-extrabold tracking-tight sm:text-4xl">
                            Ready to ditch paper menus?
                        </h2>
                        <p className="relative mt-3 font-medium text-[#1f2340]/80">Set up in minutes. Free forever plan.</p>
                        <Link
                            href="/register"
                            className="group relative mt-8 inline-flex cursor-pointer items-center gap-2 rounded-2xl border-2 border-[#1f2340] bg-white px-8 py-4 font-semibold shadow-[4px_4px_0_#1f2340] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1f2340] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
                        >
                            Create your free account
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    </div>
                </section>
            </main>

            {/* ─── Footer ─── */}
            <footer className="border-t-2 border-[#1f2340]/10 py-8">
                <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:px-6 md:flex-row">
                    <Logo small />
                    <div className="flex items-center gap-6 text-sm text-[#4a4e6a]">
                        <Link href="/terms" className="flex min-h-[44px] cursor-pointer items-center hover:text-[#1f2340]">Terms</Link>
                        <Link href="/privacy" className="flex min-h-[44px] cursor-pointer items-center hover:text-[#1f2340]">Privacy</Link>
                        <Link href={loggedIn ? "/dashboard" : "/login"} className="flex min-h-[44px] cursor-pointer items-center hover:text-[#1f2340]">
                            {loggedIn ? "Dashboard" : "Hotel login"}
                        </Link>
                    </div>
                    <p className="text-sm text-[#4a4e6a]">&copy; {new Date().getFullYear()} DreamCanvas</p>
                </div>
            </footer>
        </div>
    );
}
