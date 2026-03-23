import { cn } from "@/lib/utils";

/** FSSAI-style veg / non-veg marks for chips and list rows (India food apps). */
export function IndianVegMark({ className }: { className?: string }) {
    return (
        <span
            className={cn("inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center", className)}
            title="Vegetarian"
            aria-label="Vegetarian"
        >
            <svg viewBox="0 0 24 24" className="h-full w-full" fill="none" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" className="text-green-500" />
                <circle cx="12" cy="12" r="5" fill="currentColor" className="text-green-500" />
            </svg>
        </span>
    );
}

export function IndianNonVegMark({ className }: { className?: string }) {
    return (
        <span
            className={cn("inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center", className)}
            title="Non-vegetarian"
            aria-label="Non-vegetarian"
        >
            <svg viewBox="0 0 24 24" className="h-full w-full" fill="none" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" className="text-[#c45c26]" />
                <path d="M12 7l6 10H6l6-10z" fill="currentColor" className="text-[#c45c26]" />
            </svg>
        </span>
    );
}
