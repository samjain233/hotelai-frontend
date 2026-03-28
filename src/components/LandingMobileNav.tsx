"use client";

import { useState, useEffect, useCallback } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";

const NAV_LINKS = [
    { href: "#features", label: "Features" },
    { href: "#pricing", label: "Pricing" },
    { href: "#how-it-works", label: "How it works" },
];

export function LandingMobileNav() {
    const [open, setOpen] = useState(false);

    const close = useCallback(() => setOpen(false), []);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") close();
        };
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [open, close]);

    return (
        <div className="md:hidden">
            <button
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a853]/60"
            >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {open && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 top-16 z-40 bg-black/60 backdrop-blur-sm"
                        onClick={close}
                        aria-hidden="true"
                    />

                    {/* Drawer */}
                    <nav className="fixed inset-x-0 top-16 z-50 border-b border-white/[0.06] bg-[#09090b]/95 backdrop-blur-xl animate-slide-down">
                        <div className="mx-auto flex max-w-6xl flex-col px-6 py-4 gap-1">
                            {NAV_LINKS.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    onClick={close}
                                    className="flex min-h-[44px] items-center rounded-lg px-3 text-base font-medium text-zinc-300 transition-colors hover:bg-white/[0.04] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a853]/60"
                                >
                                    {link.label}
                                </a>
                            ))}
                            <div className="my-2 h-px bg-white/[0.06]" />
                            <Link
                                href="/login"
                                onClick={close}
                                className="flex min-h-[44px] items-center rounded-lg px-3 text-base font-medium text-zinc-300 transition-colors hover:bg-white/[0.04] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a853]/60"
                            >
                                Sign in
                            </Link>
                            <Link
                                href="/register"
                                onClick={close}
                                className="mt-1 flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-[#d4a853] to-[#b8862d] px-5 text-base font-semibold text-white shadow-lg shadow-[#d4a853]/20 transition-all hover:shadow-[#d4a853]/30 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a853]/60"
                            >
                                Get started free
                            </Link>
                        </div>
                    </nav>
                </>
            )}
        </div>
    );
}
