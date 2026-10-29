import type { GuestPublicMenuCategory, Hotel } from "@/lib/types";

/**
 * Clock-dependent guest-menu logic, evaluated on the device.
 *
 * The backend payload (`/guest/menu/:slug/full`) deliberately carries no `isOpen` or
 * schedule-filtered categories: the page is ISR-cached and the payload is keyed by
 * `menuUpdatedAt`, so anything derived from "now" would be stale by construction. Mirrors
 * `operating-hours.util.ts` / `category-schedule.util.ts` in the backend; orders are re-checked
 * server-side regardless.
 */

export const DEFAULT_HOTEL_TIMEZONE = "Asia/Kolkata";

const WEEKDAY_SHORT_TO_ISO: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string): Intl.DateTimeFormat {
    const cached = formatterCache.get(timeZone);
    if (cached) return cached;
    const fmt = new Intl.DateTimeFormat("en-GB", {
        timeZone,
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    });
    formatterCache.set(timeZone, fmt);
    return fmt;
}

export interface HotelClock {
    /** ISO weekday 1 = Monday … 7 = Sunday, in the hotel's timezone. */
    isoWeekday: number;
    /** Minutes since 00:00 in the hotel's timezone. */
    minutesSinceMidnight: number;
}

/** Wall clock in the hotel's timezone for an instant (epoch ms). Falls back to device local time on bad zones. */
export function hotelClockAt(nowMs: number, timeZone?: string | null): HotelClock {
    const tz = timeZone?.trim() || DEFAULT_HOTEL_TIMEZONE;
    const date = new Date(nowMs);
    try {
        const parts = getFormatter(tz).formatToParts(date);
        let weekday = "Mon";
        let hour = 0;
        let minute = 0;
        for (const p of parts) {
            if (p.type === "weekday") weekday = p.value;
            else if (p.type === "hour") hour = Number(p.value) || 0;
            else if (p.type === "minute") minute = Number(p.value) || 0;
        }
        return { isoWeekday: WEEKDAY_SHORT_TO_ISO[weekday] ?? 1, minutesSinceMidnight: hour * 60 + minute };
    } catch {
        const jsDay = date.getDay(); // 0 = Sunday
        return { isoWeekday: jsDay === 0 ? 7 : jsDay, minutesSinceMidnight: date.getHours() * 60 + date.getMinutes() };
    }
}

function parseHHmm(value: string | null | undefined): number | null {
    if (!value) return null;
    const s = value.trim();
    const colon = s.indexOf(":");
    if (colon < 1) return null;
    const h = Number(s.slice(0, colon));
    const m = Number(s.slice(colon + 1));
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return h * 60 + m;
}

/** `[start, end)` in minutes, supporting overnight windows such as 22:00–02:00. */
function inWindow(currentMins: number, startMins: number, endMins: number): boolean {
    if (endMins > startMins) return currentMins >= startMins && currentMins < endMins;
    return currentMins >= startMins || currentMins < endMins;
}

/** Hotel accepts orders now. Either bound missing = always open (matches backend). */
export function isHotelOpenAt(
    clock: HotelClock,
    openTime?: string | null,
    closeTime?: string | null,
): boolean {
    const open = parseHHmm(openTime);
    const close = parseHHmm(closeTime);
    if (open == null || close == null) return true;
    return inWindow(clock.minutesSinceMidnight, open, close);
}

/** Category is within its serving days and time window (both optional). */
export function isCategoryServedAt(
    clock: HotelClock,
    category: Pick<GuestPublicMenuCategory, "serveTimeStart" | "serveTimeEnd" | "serveDaysOfWeek">,
): boolean {
    const days = category.serveDaysOfWeek;
    if (days && days.length > 0 && !days.includes(clock.isoWeekday)) return false;
    const start = parseHHmm(category.serveTimeStart);
    const end = parseHHmm(category.serveTimeEnd);
    if (start == null || end == null) return true;
    return inWindow(clock.minutesSinceMidnight, start, end);
}

/** Categories visible right now. Returns the same array when nothing is scheduled (stable identity for memo). */
export function filterCategoriesBySchedule(
    categories: GuestPublicMenuCategory[],
    clock: HotelClock,
): GuestPublicMenuCategory[] {
    const anyScheduled = categories.some(
        (c) => (c.serveDaysOfWeek?.length ?? 0) > 0 || !!c.serveTimeStart || !!c.serveTimeEnd,
    );
    if (!anyScheduled) return categories;
    return categories.filter((c) => isCategoryServedAt(clock, c));
}

/** Convenience for callers holding the hotel object. */
export function isHotelOpenNow(nowMs: number, hotel: Pick<Hotel, "openTime" | "closeTime" | "timezone"> | null | undefined): boolean {
    if (!hotel) return true;
    return isHotelOpenAt(hotelClockAt(nowMs, hotel.timezone), hotel.openTime, hotel.closeTime);
}
