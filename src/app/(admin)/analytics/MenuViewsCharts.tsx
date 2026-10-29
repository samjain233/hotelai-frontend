"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MenuAnalytics } from "@/lib/types";
import { formatDayLabel, formatDayTick, formatHourRange, formatHourTick } from "./analyticsFormat";

const AXIS = { fontSize: 11, fill: "var(--color-muted-foreground)" };
const TOOLTIP_STYLE = {
    background: "var(--color-panel)",
    border: "1px solid var(--color-border)",
    borderRadius: 12,
    fontSize: 12,
    color: "var(--color-foreground)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
};

function viewsLabel(value: number) {
    return `${value} view${value === 1 ? "" : "s"}`;
}

export function DailyViewsChart({ data }: { data: MenuAnalytics }) {
    return (
        <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.daily} margin={{ top: 8, right: 4, bottom: 0, left: -20 }} barCategoryGap={data.rangeDays > 7 ? "25%" : "35%"}>
                <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
                <XAxis
                    dataKey="date"
                    tickFormatter={(d: string) => formatDayTick(d, data.rangeDays)}
                    tick={AXIS}
                    axisLine={false}
                    tickLine={false}
                    interval={data.rangeDays > 7 ? 4 : 0}
                />
                <YAxis allowDecimals={false} tick={AXIS} axisLine={false} tickLine={false} width={44} />
                <Tooltip
                    cursor={{ fill: "var(--color-secondary)", opacity: 0.6 }}
                    contentStyle={TOOLTIP_STYLE}
                    labelFormatter={(d) => formatDayLabel(String(d))}
                    formatter={(value) => [viewsLabel(Number(value)), ""]}
                    separator=""
                />
                <Bar dataKey="views" fill="var(--color-brand)" radius={[6, 6, 0, 0]} maxBarSize={48} isAnimationActive={false} />
            </BarChart>
        </ResponsiveContainer>
    );
}

export function HourlyViewsChart({ data }: { data: MenuAnalytics }) {
    return (
        <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.hourly} margin={{ top: 8, right: 4, bottom: 0, left: -20 }} barCategoryGap="20%">
                <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
                <XAxis dataKey="hour" tickFormatter={(h: number) => formatHourTick(h)} tick={AXIS} axisLine={false} tickLine={false} interval={2} />
                <YAxis allowDecimals={false} tick={AXIS} axisLine={false} tickLine={false} width={44} />
                <Tooltip
                    cursor={{ fill: "var(--color-secondary)", opacity: 0.6 }}
                    contentStyle={TOOLTIP_STYLE}
                    labelFormatter={(h) => formatHourRange(Number(h))}
                    formatter={(value) => [viewsLabel(Number(value)), ""]}
                    separator=""
                />
                <Bar dataKey="views" fill="var(--color-brand)" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
            </BarChart>
        </ResponsiveContainer>
    );
}
