"use client";

import { useCallback } from "react";
import Image from "next/image";
import { guestMenuImageSrc } from "@/lib/guestMenuImageHosts";

interface GuestMenuSplashProps {
    hotelSlug: string;
    hotelName: string;
    logoUrl?: string | null;
    /** Called once the splash animation has finished; the parent then unmounts it. */
    onDone: () => void;
}

/** `sessionStorage` key: set once a splash has fully played for this hotel in this tab. */
const seenKey = (hotelSlug: string) => `dc-splash-seen:${hotelSlug}`;

const hasSeen = (hotelSlug: string) => {
    try {
        return sessionStorage.getItem(seenKey(hotelSlug)) !== null;
    } catch {
        return false;
    }
};

/** Marker class on `<html>`; globals.css hides the splash and skips the card stagger under it. */
const SEEN_CLASS = "guest-splash-seen";

/**
 * Inline script emitted ahead of the splash in the SSR HTML. It runs as the parser reaches it,
 * before the splash is painted, so a guest re-opening the menu in the same tab never sees it
 * flash. Deliberately read-only: the flag is written by `finish` below, so an abandoned load
 * does not count as "seen".
 */
const seenCheckScript = (hotelSlug: string) =>
    `try{if(sessionStorage.getItem(${JSON.stringify(seenKey(hotelSlug))}))document.documentElement.classList.add(${JSON.stringify(SEEN_CLASS)})}catch(e){}`;

/**
 * Branded splash over the menu for the first ~2.5s after paint: the hotel's logo (or initial) on
 * the themed background with a rippling halo, a filling progress bar and a status line, held for
 * 2s, which then fades away while the header and first dishes stagger in underneath (see
 * `guestSplashOut` / `guest-stagger` in globals.css).
 *
 * It runs on a fixed CSS timeline from the SSR HTML, so it never waits for JavaScript: on a slow
 * connection the menu is readable as soon as the splash fades, long before hydration. It is
 * `pointer-events: none` throughout and ends `visibility: hidden`, so a late `onDone` (hydration
 * after the animation) only tidies the DOM.
 *
 * Shown once per tab per hotel: completing it stores a `sessionStorage` flag, and later loads
 * (full or client-side) in that tab skip it. A fresh QR scan opens a new tab, so the brand moment
 * still plays for each new visit.
 */
export function GuestMenuSplash({ hotelSlug, hotelName, logoUrl, onDone }: GuestMenuSplashProps) {
    const logoSrc = guestMenuImageSrc(logoUrl);
    const initial = hotelName.trim().charAt(0) || "H";

    const finish = useCallback(() => {
        try {
            sessionStorage.setItem(seenKey(hotelSlug), "1");
            document.documentElement.classList.add(SEEN_CLASS);
        } catch {
            // Storage unavailable (private mode quota, disabled): the splash simply plays each time.
        }
        onDone();
    }, [hotelSlug, onDone]);

    // Runs at mount: at hydration on a full load, or straight away on a client-side navigation
    // into the menu (where the inline script above never ran). Finish immediately when the splash
    // was already seen this session, or when it has no running animation — it already ended (fast
    // connection, animationend fired before React attached) or it is hidden (reduced motion).
    // Ref callbacks run before paint, so finishing here never shows a frame of the splash.
    const splashRef = useCallback(
        (el: HTMLDivElement | null) => {
            if (!el) return;
            if (hasSeen(hotelSlug) || el.getAnimations().every((a) => a.playState === "finished")) finish();
        },
        [hotelSlug, finish],
    );

    return (
        <>
            <script dangerouslySetInnerHTML={{ __html: seenCheckScript(hotelSlug) }} />
            <div
                ref={splashRef}
                aria-hidden
                onAnimationEnd={(e) => {
                    if (e.target === e.currentTarget) finish();
                }}
                className="guest-splash pointer-events-none fixed inset-0 z-[70] flex flex-col items-center justify-center gap-5 bg-[var(--guest-bg)] text-[var(--guest-text)]"
            >
                <div className="relative">
                    <span className="guest-splash-glow absolute -inset-8 rounded-full bg-[var(--guest-accent-20)] blur-2xl" />
                    <span className="guest-splash-ripple absolute inset-0 rounded-2xl border-2 border-[var(--guest-accent-40)]" />
                    <span className="guest-splash-ripple guest-splash-ripple-late absolute inset-0 rounded-2xl border-2 border-[var(--guest-accent-40)]" />
                    {logoSrc ? (
                        <Image
                            src={logoSrc}
                            alt=""
                            width={72}
                            height={72}
                            sizes="72px"
                            priority
                            className="guest-splash-mark relative h-18 w-18 rounded-2xl bg-[var(--guest-surface)] object-cover ring-1 ring-[var(--guest-line)]"
                        />
                    ) : (
                        <div className="guest-splash-mark relative flex h-18 w-18 items-center justify-center rounded-2xl bg-[var(--guest-accent-15)] text-3xl font-bold uppercase text-[var(--guest-accent)] ring-1 ring-[var(--guest-accent-25)]">
                            {initial}
                        </div>
                    )}
                </div>
                <div className="text-center">
                    <p className="guest-splash-rise text-lg font-bold capitalize leading-tight">{hotelName}</p>
                    <p className="guest-splash-rise guest-splash-rise-2 mt-1 text-xs uppercase tracking-[0.2em] text-[var(--guest-muted)]">Menu</p>
                </div>
                <div className="guest-splash-rise guest-splash-rise-3 flex flex-col items-center gap-2.5">
                    <div className="relative h-1 w-40 overflow-hidden rounded-full bg-[var(--guest-line)]">
                        <div className="guest-splash-progress absolute inset-0 origin-left overflow-hidden rounded-full bg-[var(--guest-accent)]">
                            <span className="guest-splash-gloss absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                        </div>
                    </div>
                    <div className="grid text-[11px] font-medium text-[var(--guest-muted)]">
                        <SplashStatus className="guest-splash-msg-first">Preparing your menu</SplashStatus>
                        <SplashStatus className="guest-splash-msg-next">Almost ready</SplashStatus>
                    </div>
                </div>
            </div>
        </>
    );
}

/** One status line; both share a grid cell so the swap at ~1.2s doesn't shift the layout. */
function SplashStatus({ className, children }: { className: string; children: string }) {
    return (
        <span className={`${className} flex items-end justify-center gap-0.5 [grid-area:1/1]`}>
            {children}
            <span className="mb-[3px] ml-0.5 flex gap-0.5">
                <span className="guest-splash-dot h-1 w-1 rounded-full bg-current" />
                <span className="guest-splash-dot h-1 w-1 rounded-full bg-current" />
                <span className="guest-splash-dot h-1 w-1 rounded-full bg-current" />
            </span>
        </span>
    );
}
