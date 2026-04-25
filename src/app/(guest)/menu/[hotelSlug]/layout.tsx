import type { ReactNode } from "react";

function apiOrigin(): string | undefined {
    const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (!raw) return undefined;
    try {
        return new URL(raw).origin;
    } catch {
        return undefined;
    }
}

/** Preconnect to the Nest API host so the first client fetch pays less DNS/TLS latency. */
export default function GuestMenuHotelSlugLayout({ children }: { children: ReactNode }) {
    const origin = apiOrigin();
    return (
        <>
            {origin ? <link rel="preconnect" href={origin} crossOrigin="anonymous" /> : null}
            {children}
        </>
    );
}
