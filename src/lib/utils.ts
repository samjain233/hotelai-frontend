import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatPrice(amount: number | string | null | undefined): string {
    const n = typeof amount === "number" ? amount : parseFloat(String(amount ?? 0)) || 0;
    return `₹${n.toLocaleString("en-IN")}`;
}

export function toNumericPrice(amount: number | string | null | undefined): number {
    return typeof amount === "number" ? amount : parseFloat(String(amount ?? 0)) || 0;
}

