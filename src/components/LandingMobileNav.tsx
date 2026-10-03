"use client";

import { useState, useEffect, useCallback } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";

const NAV_LINKS = [
    { href: "#how-it-works", label: "How it works" },
    { href: "#for-hotels", label: "For hotels" },
    { href: "#pricing", label: "Pricing" },
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
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-[#1f2340] transition-colors hover:bg-[#1f2340]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a853]"
            >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {open && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-[#1f2340]/30 backdrop-blur-sm"
                        onClick={close}
                        aria-hidden="true"
                    />

                    <nav className="fixed inset-x-3 top-20 z-50 rounded-2xl border-2 border-[#1f2340] bg-white shadow-[4px_4px_0_#1f2340] animate-slide-down">
                        <div className="flex flex-col gap-1 p-3">
                            {NAV_LINKS.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    onClick={close}
                                    className="flex min-h-[44px] items-center rounded-xl px-3 text-base font-semibold text-[#1f2340] transition-colors hover:bg-[#fff6e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a853]"
                                >
                                    {link.label}
                                </a>
                            ))}
                            <div className="my-1 h-0.5 bg-[#1f2340]/10" />
                            <Link
                                href="/login"
                                onClick={close}
                                className="flex min-h-[44px] items-center rounded-xl px-3 text-base font-semibold text-[#1f2340] transition-colors hover:bg-[#fff6e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a853]"
                            >
                                Sign in
                            </Link>
                            <Link
                                href="/register"
                                onClick={close}
                                className="mt-1 flex min-h-[44px] items-center justify-center rounded-xl border-2 border-[#1f2340] bg-[#d4a853] px-5 text-base font-semibold text-[#1f2340] transition-colors hover:bg-[#e0b866] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f2340]"
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
