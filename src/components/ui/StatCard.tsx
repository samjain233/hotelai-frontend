"use client";

import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    trendUp?: boolean;
    color?: string;
}

const ICON_COLORS: Record<string, string> = {
    indigo: "text-indigo-400 bg-indigo-500/10",
    emerald: "text-emerald-400 bg-emerald-500/10",
    amber: "text-amber-400 bg-amber-500/10",
    rose: "text-rose-400 bg-rose-500/10",
    blue: "text-blue-400 bg-blue-500/10",
    purple: "text-violet-400 bg-violet-500/10",
};

export function StatCard({ label, value, icon: Icon, trend, trendUp = true, color = "indigo" }: StatCardProps) {
    const iconColor = ICON_COLORS[color] || ICON_COLORS.indigo;

    return (
        <div className="group p-5 rounded-xl transition-colors" style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-4">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconColor}`}>
                    <Icon className="w-[18px] h-[18px]" />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-[11px] font-medium ${trendUp ? "text-emerald-400" : "text-rose-400"}`}>
                        {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {trend}
                    </div>
                )}
            </div>
            <p className="text-[13px] font-medium text-zinc-500 mb-1">{label}</p>
            <p className="text-2xl font-semibold text-white tracking-tight">{value}</p>
        </div>
    );
}
