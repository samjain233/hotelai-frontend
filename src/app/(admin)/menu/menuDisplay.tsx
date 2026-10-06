import type { MenuItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function formatMenuPrice(price: number | string) {
    const n = typeof price === "number" ? price : parseFloat(String(price ?? 0)) || 0;
    const hasDecimals = n % 1 !== 0;
    return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: hasDecimals ? 2 : 0, maximumFractionDigits: 2 })}`;
}

export function DietMark({ preference }: { preference: MenuItem["dietaryPreference"] }) {
    if (!preference || preference === "NONE") return null;
    const tone = preference === "VEG" ? "text-emerald-600" : preference === "NON_VEG" ? "text-red-600" : "text-amber-500";
    const label = preference === "VEG" ? "Veg" : preference === "NON_VEG" ? "Non-veg" : "Contains egg";
    return (
        <span className={cn("inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-current bg-white", tone)} title={label}>
            <span className="h-2 w-2 rounded-full bg-current" />
            <span className="sr-only">{label}</span>
        </span>
    );
}
