"use client";

import { SWRConfig } from "swr";
import { swrFetcher } from "@/lib/api";

export function SWRProvider({ children }: { children: React.ReactNode }) {
    return (
        <SWRConfig 
            value={{ 
                fetcher: swrFetcher,
                // Default global deduping interval, can be overridden by individual hooks
                dedupingInterval: 5000, 
            }}
        >
            {children}
        </SWRConfig>
    );
}
