"use client";

import type { ReactNode } from "react";
import { buildGuestMenuThemeStyle } from "@/lib/guestMenuTheme";

interface GuestMenuStatusPageProps {
    title: string;
    message: string;
    /** Optional action rendered under the message (e.g. a retry button). */
    action?: ReactNode;
}

/**
 * Full-screen status card for the menu route's `error.tsx` / `not-found.tsx`. Those render without
 * hotel data, so it uses the default guest theme rather than the hotel's colours.
 */
export function GuestMenuStatusPage({ title, message, action }: GuestMenuStatusPageProps) {
    return (
        <div
            className="flex min-h-screen items-center justify-center bg-[var(--guest-bg)] px-4 text-center text-[var(--guest-text)]"
            style={buildGuestMenuThemeStyle(null)}
        >
            <div className="w-full max-w-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--guest-accent-15)] text-[var(--guest-accent)]">
                    <svg
                        className="h-8 w-8"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                    >
                        <path d="m16 2-2.3 2.3c-.4.4-.4 1 0 1.4l1.2 1.2c.4.4.4 1 0 1.4L2 21" />
                        <path d="M22 2l-1.5 1.5c-1.1-1.1-2.9-1.1-4 0l-1.5 1.5" />
                        <path d="M7 2h.01" />
                        <path d="M7 6h.01" />
                    </svg>
                </div>
                <h1 className="mb-2 text-xl font-bold">{title}</h1>
                <p className="text-sm text-[var(--guest-muted)]">{message}</p>
                {action ? <div className="mt-6">{action}</div> : null}
            </div>
        </div>
    );
}
