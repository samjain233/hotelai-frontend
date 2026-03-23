import { Suspense } from "react";
import GuestMenuClient from "./GuestMenuClient";
import type { PublicMenuFullData } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Props {
    params: Promise<{ hotelSlug: string }>;
}

/** Server Component: fetches menu+rooms server-side for faster QR scan load */
export default async function GuestMenuPage({ params }: Props) {
    const { hotelSlug } = await params;

    let initialData: PublicMenuFullData | null = null;
    try {
        const res = await fetch(`${API_URL}/guest/menu/${hotelSlug}/full`, {
            next: { revalidate: 60 },
        });
        if (res.ok) initialData = await res.json();
    } catch {
        // Fallback to client fetch
    }

    return (
        <Suspense fallback={<MenuSkeleton />}>
            <GuestMenuClient hotelSlug={hotelSlug} initialData={initialData} />
        </Suspense>
    );
}

function MenuSkeleton() {
    return (
        <div className="min-h-screen bg-zinc-950">
            <div className="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/90 backdrop-blur-xl">
                <div className="max-w-md mx-auto space-y-3 px-4 py-4">
                    <div className="flex items-center gap-2">
                        <div className="h-10 w-10 shrink-0 rounded-full animate-shimmer bg-zinc-800/80" />
                        <div className="h-10 flex-1 animate-shimmer rounded-full bg-zinc-800/80" />
                        <div className="h-10 w-10 shrink-0 rounded-full animate-shimmer bg-zinc-800/80" />
                    </div>
                    <div className="flex gap-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-9 shrink-0 animate-shimmer rounded-full bg-zinc-800/80" style={{ width: `${72 + i * 8}px` }} />
                        ))}
                    </div>
                </div>
            </div>
            <div className="max-w-md mx-auto space-y-6 px-4 py-6">
                {Array.from({ length: 2 }).map((_, s) => (
                    <div key={s} className="space-y-3">
                        <div className="h-5 w-32 animate-shimmer rounded bg-zinc-800/80" />
                        {Array.from({ length: 4 }).map((_, j) => (
                            <div key={j} className="flex gap-3 border-b border-dashed border-white/10 pb-4">
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-[70%] animate-shimmer rounded bg-zinc-800/80" />
                                    <div className="h-3 w-14 animate-shimmer rounded bg-zinc-800/80" />
                                </div>
                                <div className="w-[108px] shrink-0 space-y-2">
                                    <div className="aspect-[4/3] w-full animate-shimmer rounded-lg bg-zinc-800/80" />
                                    <div className="h-9 w-full animate-shimmer rounded-md bg-zinc-800/80" />
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
