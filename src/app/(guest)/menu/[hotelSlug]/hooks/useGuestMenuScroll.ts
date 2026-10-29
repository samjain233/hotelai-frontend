"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { GuestPublicMenuCategory } from "@/lib/types";

/**
 * Hides the hotel branding row while the guest scrolls down and brings it back on scroll-up or
 * near the top, so the sticky header spends most of the time at its compact height.
 *
 * This is the only scroll listener on the page. It reads `scrollY` (no layout) once per frame.
 */
export function useBrandingBarCollapse(): boolean {
    const [hidden, setHidden] = useState(false);
    const lastY = useRef(0);

    useEffect(() => {
        lastY.current = window.scrollY;
        let raf = 0;
        const onScroll = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                const y = window.scrollY;
                const delta = y - lastY.current;
                lastY.current = y;
                if (y < 20) setHidden(false);
                else if (delta > 6 && y > 44) setHidden(true);
                else if (delta < -8) setHidden(false);
            });
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("scroll", onScroll);
        };
    }, []);

    return hidden;
}

/**
 * Keeps `--guest-menu-sticky-top` equal to the sticky header's height so category headings can
 * stick just below it. A `ResizeObserver` covers every way the height can change (branding bar
 * collapse, filter chips appearing, viewport resize), so no scroll or resize listeners are needed.
 */
export function useStickyHeaderOffset(headerRef: RefObject<HTMLElement | null>) {
    useLayoutEffect(() => {
        const el = headerRef.current;
        if (!el) return;
        const CSS_VAR = "--guest-menu-sticky-top";
        const update = (height: number) => {
            document.documentElement.style.setProperty(CSS_VAR, `${Math.ceil(height)}px`);
        };
        update(el.getBoundingClientRect().height);
        const ro = new ResizeObserver(([entry]) => update(entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height));
        ro.observe(el);
        return () => {
            ro.disconnect();
            document.documentElement.style.removeProperty(CSS_VAR);
        };
    }, [headerRef]);
}

/** Distance below the header at which a section counts as "current". */
const SPY_LINE_OFFSET_PX = 24;
/** The header animates its height; wait for it to settle before rebuilding the observer. */
const SPY_REBUILD_DEBOUNCE_MS = 120;
/** "Fully visible" for the last section, with slack for sub-pixel rounding. */
const LAST_SECTION_VISIBLE_RATIO = 0.98;
/** Chip-tap scroll: duration scales with distance between these bounds. */
const SCROLL_MIN_MS = 260;
const SCROLL_MAX_MS = 520;
const SCROLL_MS_PER_PX = 0.18;
/** Guest input that should take over from a chip-tap scroll. */
const INTERRUPT_EVENTS = ["wheel", "touchstart", "keydown"] as const;

/**
 * Which category chip is highlighted. Follows the section currently under the header while the
 * guest scrolls, and jumps when a chip is tapped (the spy pauses until that scroll settles).
 *
 * Implemented with `IntersectionObserver`s instead of a scroll listener: one whose root is shrunk
 * to a 1 px line just below the header (the browser reports which section crosses it, so nothing
 * is measured on scroll), plus one on the last section so it is highlighted once fully on screen
 * even when it is too short to reach the line. Both are rebuilt when the header's height changes
 * (the line moves) or the set of visible sections changes (search / filters).
 *
 * The highlighted id is derived from the guest's last choice and the visible list, so it needs no
 * effect to reset when categories change: an id that is no longer visible falls back to the first.
 */
export function useCategoryScrollSpy(chipCategories: GuestPublicMenuCategory[], headerRef: RefObject<HTMLElement | null>) {
    const [choice, setChoice] = useState("");
    const suspended = useRef(false);

    const activeCategory = useMemo(() => {
        if (chipCategories.length === 0) return "";
        return chipCategories.some((c) => c.id === choice) ? choice : chipCategories[0].id;
    }, [chipCategories, choice]);

    const chipIdsKey = useMemo(() => chipCategories.map((c) => c.id).join("|"), [chipCategories]);

    useEffect(() => {
        if (!chipIdsKey) return;
        const ids = chipIdsKey.split("|");
        const header = headerRef.current;

        // While a chip-tap scroll is in flight the tapped chip stays highlighted; the observer keeps
        // its bookkeeping up to date and takes over again at the next crossing after it settles.
        const apply = (id: string) => {
            if (suspended.current) return;
            setChoice((prev) => (prev === id ? prev : id));
        };

        // Sections currently crossing the line, and the section the line logic last settled on.
        const crossing = new Set<string>();
        let underLine = ids[0];
        // A short last section can never reach the line at the bottom of the page; while it is
        // fully visible below the header the guest is plainly looking at it, so it wins.
        let lastFullyVisible = false;
        const lastId = ids[ids.length - 1];

        const settle = () => apply(lastFullyVisible ? lastId : underLine);

        let lineIo: IntersectionObserver | null = null;
        let lastIo: IntersectionObserver | null = null;

        const build = () => {
            lineIo?.disconnect();
            lastIo?.disconnect();
            crossing.clear();
            const line = (header?.getBoundingClientRect().height ?? 128) + SPY_LINE_OFFSET_PX;
            const bottomMargin = Math.max(0, window.innerHeight - line - 1);

            // The line is between two sections (or above the first / below the last): find the last
            // section whose top is above it. This measures, but only runs when a gap is hit, which is
            // a handful of times per scroll through the menu rather than on every frame.
            const measureSectionAboveLine = (): string => {
                let found = ids[0];
                for (const id of ids) {
                    const el = document.getElementById(`cat-${id}`);
                    if (el && el.getBoundingClientRect().top <= line) found = id;
                    else break;
                }
                return found;
            };

            lineIo = new IntersectionObserver(
                (entries) => {
                    for (const entry of entries) {
                        const id = (entry.target as HTMLElement).dataset.categoryId ?? "";
                        if (entry.isIntersecting) crossing.add(id);
                        else crossing.delete(id);
                    }
                    if (crossing.size > 0) {
                        // Normally one; two only when the line sits exactly on a boundary. Take the later.
                        for (let i = ids.length - 1; i >= 0; i--) {
                            if (crossing.has(ids[i])) {
                                underLine = ids[i];
                                break;
                            }
                        }
                    } else {
                        underLine = measureSectionAboveLine();
                    }
                    settle();
                },
                { root: null, rootMargin: `-${line}px 0px -${bottomMargin}px 0px`, threshold: 0 },
            );
            for (const id of ids) {
                const el = document.getElementById(`cat-${id}`);
                if (el) lineIo.observe(el);
            }

            const lastEl = document.getElementById(`cat-${lastId}`);
            if (lastEl) {
                lastIo = new IntersectionObserver(
                    ([entry]) => {
                        // `isIntersecting` is true for any overlap; the ratio says whether it is all on screen.
                        lastFullyVisible = entry.intersectionRatio >= LAST_SECTION_VISIBLE_RATIO;
                        settle();
                    },
                    // Root = viewport below the header line.
                    { root: null, rootMargin: `-${line}px 0px 0px 0px`, threshold: LAST_SECTION_VISIBLE_RATIO },
                );
                lastIo.observe(lastEl);
            }
        };

        build();

        // The line moves with the header height (branding collapse, filter chips) and the viewport.
        let rebuildTimer = 0;
        const scheduleRebuild = () => {
            window.clearTimeout(rebuildTimer);
            rebuildTimer = window.setTimeout(build, SPY_REBUILD_DEBOUNCE_MS);
        };
        const ro = header ? new ResizeObserver(scheduleRebuild) : null;
        if (header) ro?.observe(header);
        window.addEventListener("resize", scheduleRebuild, { passive: true });

        return () => {
            window.clearTimeout(rebuildTimer);
            window.removeEventListener("resize", scheduleRebuild);
            ro?.disconnect();
            lineIo?.disconnect();
            lastIo?.disconnect();
        };
    }, [chipIdsKey, headerRef]);

    // Cancels the chip-tap scroll currently in flight, if any.
    const cancelScroll = useRef<(() => void) | null>(null);
    useEffect(() => () => cancelScroll.current?.(), []);

    const scrollToCategory = useCallback(
        (categoryId: string) => {
            cancelScroll.current?.();
            const el = document.getElementById(`cat-${categoryId}`);
            if (!el) return;
            suspended.current = true;
            setChoice(categoryId);

            const header = headerRef.current;
            // Where the section's top meets the bottom of the sticky header. Recomputed every frame:
            // the branding bar collapses (or expands) as soon as this scroll starts, which moves every
            // section by its height, and the page bottom may stop us short of the target.
            const targetTop = () => {
                const sticky = header ? header.getBoundingClientRect().height - 1 : 0;
                const max = document.documentElement.scrollHeight - window.innerHeight;
                return Math.max(0, Math.min(max, el.getBoundingClientRect().top + window.scrollY - sticky));
            };

            let raf = 0;
            let done = false;
            const finish = () => {
                if (done) return;
                done = true;
                cancelAnimationFrame(raf);
                INTERRUPT_EVENTS.forEach((type) => window.removeEventListener(type, finish));
                cancelScroll.current = null;
                // The observers report the final position one frame later; release after that so the
                // tapped chip is not overwritten by the settle (it only differs at the very bottom).
                requestAnimationFrame(() => requestAnimationFrame(() => (suspended.current = false)));
            };
            cancelScroll.current = finish;
            INTERRUPT_EVENTS.forEach((type) => window.addEventListener(type, finish, { passive: true }));

            const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
            if (reduceMotion) {
                window.scrollTo({ top: targetTop(), behavior: "instant" });
                finish();
                return;
            }

            // Driven by rAF rather than `scrollIntoView({ behavior: "smooth" })`: the browser aborts
            // a native smooth scroll when layout changes under it, and the header collapse does
            // exactly that a few pixels in, so the native version used to stop almost immediately.
            const startY = window.scrollY;
            const startAt = performance.now();
            const distance = Math.abs(targetTop() - startY);
            const duration = Math.min(SCROLL_MAX_MS, Math.max(SCROLL_MIN_MS, distance * SCROLL_MS_PER_PX));
            const step = (now: number) => {
                if (done) return;
                const t = Math.min(1, (now - startAt) / duration);
                const eased = 1 - (1 - t) ** 3;
                window.scrollTo({ top: startY + (targetTop() - startY) * eased, behavior: "instant" });
                if (t < 1) raf = requestAnimationFrame(step);
                else finish();
            };
            raf = requestAnimationFrame(step);
        },
        [headerRef],
    );

    return { activeCategory, scrollToCategory };
}
