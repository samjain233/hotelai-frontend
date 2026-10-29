"use client";

import { Sparkles } from "lucide-react";
import type { HotelAiUsageSummary } from "@/lib/platformApi";
import { AI_FEATURE_LABEL, formatAiCost, formatTokens } from "../../aiUsageFormat";

export function AiUsageSection({ usage }: { usage: HotelAiUsageSummary | undefined }) {
    if (!usage || usage.allTime.calls === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                No AI calls yet. Menu photo scans will appear here with token counts and estimated cost.
            </p>
        );
    }

    const periods = [
        { label: "This month", totals: usage.thisMonth },
        { label: "All time", totals: usage.allTime },
    ];

    return (
        <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
                {periods.map(({ label, totals }) => (
                    <div key={label} className="rounded-xl border border-border/60 bg-secondary/20 p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                            {label}
                        </div>
                        <p className="mt-2 text-2xl font-bold tabular-nums">{formatAiCost(totals.estimatedCostUsd)}</p>
                        <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                            {totals.calls} call{totals.calls === 1 ? "" : "s"} · {formatTokens(totals.totalTokens)} tokens
                            {totals.calls > 0 && (
                                <>
                                    {" · "}
                                    {totals.okCalls} ok
                                    {totals.rejectedCalls > 0 ? `, ${totals.rejectedCalls} rejected` : ""}
                                    {totals.errorCalls > 0 ? `, ${totals.errorCalls} failed` : ""}
                                </>
                            )}
                        </p>
                    </div>
                ))}
            </div>

            {usage.unpricedModels.length > 0 && (
                <p className="text-xs text-amber-600">
                    No price on file for {usage.unpricedModels.join(", ")}; those rows used the gemini-2.0-flash rate. Add it to{" "}
                    <code>ai-pricing.constant.ts</code>.
                </p>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border text-left text-muted-foreground">
                            <th className="pb-2 font-medium">When</th>
                            <th className="pb-2 font-medium">Feature</th>
                            <th className="pb-2 font-medium">Model</th>
                            <th className="pb-2 font-medium">Result</th>
                            <th className="pb-2 font-medium text-right">Tokens</th>
                            <th className="pb-2 font-medium text-right">Est. cost</th>
                            <th className="pb-2 font-medium text-right">Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usage.recent.map((row) => (
                            <tr key={row.id} className="border-b border-border/50 table-row-hover">
                                <td className="py-2.5 text-muted-foreground text-xs whitespace-nowrap">
                                    {new Date(row.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                                </td>
                                <td className="py-2.5">{AI_FEATURE_LABEL[row.feature] ?? row.feature}</td>
                                <td className="py-2.5 text-muted-foreground font-mono text-xs">{row.model}</td>
                                <td className="py-2.5">
                                    <AiStatusBadge status={row.status} />
                                    {row.status === "OK" && row.feature === "MENU_SCAN" && (
                                        <span className="ml-2 text-xs text-muted-foreground">{row.resultCount} dishes</span>
                                    )}
                                </td>
                                <td className="py-2.5 text-right tabular-nums">{row.totalTokens.toLocaleString("en-IN")}</td>
                                <td className="py-2.5 text-right tabular-nums whitespace-nowrap">{formatAiCost(row.estimatedCostUsd)}</td>
                                <td className="py-2.5 text-right text-muted-foreground tabular-nums">{(row.latencyMs / 1000).toFixed(1)}s</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="text-[11px] text-muted-foreground">
                Cost is estimated from Gemini token counts at list price; reconcile against the Google Cloud invoice. Showing the last{" "}
                {usage.recent.length} calls.
            </p>
        </div>
    );
}

function AiStatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        OK: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        REJECTED: "bg-amber-500/10 text-amber-600 border-amber-500/20",
        ERROR: "bg-red-500/10 text-red-600 border-red-500/20",
    };
    const label: Record<string, string> = { OK: "OK", REJECTED: "Rejected", ERROR: "Failed" };
    return (
        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${colors[status] || "bg-secondary text-muted-foreground border-border"}`}>
            {label[status] ?? status}
        </span>
    );
}
