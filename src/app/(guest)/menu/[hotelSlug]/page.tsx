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
        <div className="min-h-screen bg-background">
            <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
                <div className="px-5 py-4 max-w-md mx-auto">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 rounded-xl animate-shimmer flex-shrink-0" />
                        <div className="flex-1 space-y-1.5">
                            <div className="h-5 w-28 animate-shimmer rounded" />
                            <div className="h-3 w-20 animate-shimmer rounded" />
                        </div>
                    </div>
                    <div className="h-9 w-full animate-shimmer rounded-full mb-3" />
                    <div className="flex gap-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-8 animate-shimmer rounded-full" style={{ width: `${60 + i * 12}px` }} />
                        ))}
                    </div>
                </div>
            </div>
            <div className="max-w-md mx-auto px-5 py-6 space-y-8">
                <div className="text-center py-2 space-y-2">
                    <div className="h-7 w-32 animate-shimmer rounded mx-auto" />
                    <div className="h-0.5 w-12 animate-shimmer rounded mx-auto" />
                    <div className="h-3 w-48 animate-shimmer rounded mx-auto" />
                </div>
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-4">
                        <div className="h-5 w-24 animate-shimmer rounded" />
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, j) => (
                                <div key={j} className="h-24 animate-shimmer rounded-xl" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
