import type { MenuAnalytics } from "@/lib/types";

/** "8–9 pm" for hour 20. */
export function formatHourRange(hour: number): string {
    return `${formatHour(hour)}–${formatHour((hour + 1) % 24)}`;
}

/** "8 pm", "12 am", "11 am". */
export function formatHour(hour: number): string {
    const suffix = hour < 12 ? "am" : "pm";
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${h12} ${suffix}`;
}

/** Short axis tick for an hour: "8p", "12a". */
export function formatHourTick(hour: number): string {
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${h12}${hour < 12 ? "a" : "p"}`;
}

/** "Sat 18 Oct" from "2026-10-18". Date keys are already in hotel local time. */
export function formatDayLabel(dateKey: string, options: { weekday?: boolean } = { weekday: true }): string {
    const [y, m, d] = dateKey.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return new Intl.DateTimeFormat("en-IN", {
        timeZone: "UTC",
        weekday: options.weekday ? "short" : undefined,
        day: "numeric",
        month: "short",
    }).format(date);
}

/** Axis tick: "18 Oct" for 7-day, "18" for 30-day. */
export function formatDayTick(dateKey: string, rangeDays: number): string {
    const [y, m, d] = dateKey.split("-").map(Number);
    if (rangeDays > 7) return String(d);
    const date = new Date(Date.UTC(y, m - 1, d));
    return new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", weekday: "short" }).format(date);
}

export function describeChange(current: number, previous: number | null): { text: string; tone: "up" | "down" | "flat" } | null {
    if (previous === null) return null;
    if (previous === 0) return current > 0 ? { text: "No views in the week before", tone: "up" } : { text: "Same as the week before", tone: "flat" };
    const pct = Math.round(((current - previous) / previous) * 100);
    if (pct === 0) return { text: "Same as the week before", tone: "flat" };
    return { text: `${pct > 0 ? "↑" : "↓"} ${Math.abs(pct)}% vs the week before`, tone: pct > 0 ? "up" : "down" };
}

/** Realistic-looking data for the locked preview. Deterministic so the page never flickers. */
export function sampleAnalytics(): MenuAnalytics {
    const dailyViews = [18, 24, 21, 33, 46, 58, 39];
    const today = new Date();
    const daily = dailyViews.map((views, i) => {
        const d = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() - (6 - i)));
        return { date: d.toISOString().slice(0, 10), views };
    });
    const hourlyShape = [1, 0, 0, 0, 0, 1, 3, 9, 14, 10, 6, 8, 15, 12, 6, 5, 7, 10, 16, 24, 31, 27, 13, 5];
    const hourly = hourlyShape.map((views, hour) => ({ hour, views }));
    const views = dailyViews.reduce((a, b) => a + b, 0);
    return {
        rangeDays: 7,
        timezone: "Asia/Kolkata",
        retentionDays: 30,
        totals: {
            views,
            previousViews: 182,
            dailyAverage: Math.round((views / 7) * 10) / 10,
            peakHour: 20,
            peakDay: daily[5],
        },
        daily,
        hourly,
    };
}
