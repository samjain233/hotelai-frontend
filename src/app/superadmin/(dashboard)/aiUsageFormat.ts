/** Indicative USD→INR rate for display only; the stored figure is USD. */
export const USD_TO_INR = Number(process.env.NEXT_PUBLIC_USD_INR_RATE) || 84;

/** "$0.0042 (≈₹0.35)". Small amounts keep more decimals so they do not round to zero. */
export function formatAiCost(usd: number): string {
    const inr = usd * USD_TO_INR;
    const usdText = usd === 0 ? "$0" : usd < 0.01 ? `$${usd.toFixed(4)}` : `$${usd.toFixed(2)}`;
    const inrText = inr === 0 ? "₹0" : inr < 1 ? `₹${inr.toFixed(2)}` : `₹${Math.round(inr).toLocaleString("en-IN")}`;
    return `${usdText} (≈${inrText})`;
}

/** "12.3k" / "1.2M" for token counts. */
export function formatTokens(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 10_000) return `${Math.round(n / 1000)}k`;
    if (n >= 1_000) return `${(n / 1000).toFixed(1)}k`;
    return n.toLocaleString("en-IN");
}

export const AI_FEATURE_LABEL: Record<string, string> = {
    MENU_SCAN: "Menu scan",
};
