"use client";

import { useState, useEffect, useCallback } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";

const NAV_LINKS = [
    { href: "#how-it-works", label: "How it works" },
    { href: "#features", label: "Features" },
    { href: "#pricing", label: "Pricing" },
    { href: "#faq", label: "FAQ" },
];

export function LandingMobileNav({ loggedIn = false }: { loggedIn?: boolean }) {
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
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#14172b] transition-colors hover:bg-[#f3f1ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a853]"
            >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40 bg-[#14172b]/20 backdrop-blur-sm" onClick={close} aria-hidden="true" />

                    <nav className="fixed inset-x-3 top-[4.5rem] z-50 rounded-2xl border border-[#e3e0d8] bg-white p-2 shadow-[0_24px_48px_-24px_rgba(20,23,43,0.35)] animate-slide-down">
                        <div className="flex flex-col">
                            {NAV_LINKS.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    onClick={close}
                                    className="flex min-h-[44px] items-center rounded-xl px-3 text-[15px] font-medium text-[#14172b] transition-colors hover:bg-[#f7f5f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a853]"
                                >
                                    {link.label}
                                </a>
                            ))}
                            <div className="my-2 h-px bg-[#ecebe6]" />
                            {loggedIn ? (
                                <Link
                                    href="/dashboard"
                                    onClick={close}
                                    className="flex min-h-[44px] items-center justify-center rounded-full bg-[#14172b] px-5 text-[15px] font-semibold text-white transition-colors hover:bg-[#232848]"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        onClick={close}
                                        className="flex min-h-[44px] items-center rounded-xl px-3 text-[15px] font-medium text-[#4b5068] transition-colors hover:bg-[#f7f5f0]"
                                    >
                                        Sign in
                                    </Link>
                                    <Link
                                        href="/register"
                                        onClick={close}
                                        className="mt-1 flex min-h-[44px] items-center justify-center rounded-full bg-[#14172b] px-5 text-[15px] font-semibold text-white transition-colors hover:bg-[#232848]"
                                    >
                                        Start free
                                    </Link>
                                </>
                            )}
                        </div>
                    </nav>
                </>
            )}
        </div>
    );
}
