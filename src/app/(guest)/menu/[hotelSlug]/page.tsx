import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GuestMenuClient from "./GuestMenuClient";
import type { PublicMenuFullData } from "@/lib/types";
import { buildGuestMenuThemeStyle } from "@/lib/guestMenuTheme";
import { fetchGuestMenuFullData } from "@/lib/guestMenuFullServer";
import { resolveGuestMenuTemplate } from "@/lib/guestMenuTemplates";
import { guestMenuTitle } from "@/lib/guestMenuTitle";
import { loadGuestMenuTemplateSections } from "./templates/serverRegistry";

/** Edge-friendly HTML cache: rebuild at most once per minute per hotel slug. */
export const revalidate = 60;
export const dynamic = "force-static";

interface Props {
    params: Promise<{ hotelSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { hotelSlug } = await params;
    const data = await fetchGuestMenuFullData(hotelSlug);
    if (!data) notFound();
    const hotel = data.hotel;
    const name = hotel.name?.trim() || hotelSlug;
    const description = hotel?.address
        ? `Order room service at ${name}. ${hotel.address}`
        : `Browse the digital menu and order room service at ${name}.`;
    return {
        // `absolute` skips the root "%s | Hotel AI" template so the client only has to add the room.
        title: { absolute: guestMenuTitle(name) },
        description,
    };
}

/**
 * Server Component: fetches menu+rooms server-side for faster QR scan load.
 *
 * Unknown slug → `notFound()` (real 404, `not-found.tsx`). Backend failure → the fetch throws: with a
 * cached copy ISR keeps serving it; without one `error.tsx` shows a retry. Never a cached skeleton.
 */
export default async function GuestMenuPage({ params }: Props) {
    const { hotelSlug } = await params;
    const initialData = await fetchGuestMenuFullData(hotelSlug);
    if (!initialData) notFound();
    // Ship the hotel's template as a client reference so it is loaded before hydration (see serverRegistry.ts).
    const serverTemplate = resolveGuestMenuTemplate(initialData.hotel.guestMenuTemplate);
    const ServerTemplateSections = await loadGuestMenuTemplateSections(serverTemplate);
    // Intentionally impure: this Server Component runs once per ISR regeneration, and the client needs
    // that instant to hydrate open/closed state identically to the cached HTML (see useMinuteClock).
    // eslint-disable-next-line react-hooks/purity
    const renderedAt = Date.now();

    return (
        <Suspense fallback={<MenuSkeleton hotel={initialData.hotel} />}>
            <GuestMenuClient
                hotelSlug={hotelSlug}
                initialData={initialData}
                serverTemplate={serverTemplate}
                ServerTemplateSections={ServerTemplateSections}
                renderedAt={renderedAt}
            />
        </Suspense>
    );
}

function MenuSkeleton({ hotel }: { hotel?: PublicMenuFullData["hotel"] }) {
    const themeStyle = buildGuestMenuThemeStyle(hotel ?? null);
    return (
        <div className="min-h-screen bg-[var(--guest-bg)] text-[var(--guest-text)]" style={themeStyle}>
            <div className="sticky top-0 z-30 border-b border-[var(--guest-line)] bg-[var(--guest-bg)] backdrop-blur-xl">
                <div className="max-w-md mx-auto space-y-3 px-4 py-4">
                    <div className="flex items-center gap-2 pb-2">
                        <div className="h-9 w-9 shrink-0 rounded-lg animate-shimmer bg-[var(--guest-shimmer)]/80" />
                        <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="h-3.5 w-28 animate-shimmer rounded bg-[var(--guest-shimmer)]/80" />
                            <div className="h-2.5 w-20 animate-shimmer rounded bg-[var(--guest-shimmer)]/80" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-10 min-w-0 flex-1 animate-shimmer rounded-full bg-[var(--guest-shimmer)]/80" />
                        <div className="h-10 w-10 shrink-0 rounded-full animate-shimmer bg-[var(--guest-shimmer)]/80" />
                    </div>
                </div>
            </div>
            <div className="max-w-md mx-auto space-y-6 px-4 py-6">
                {Array.from({ length: 2 }).map((_, s) => (
                    <div key={s} className="space-y-3">
                        <div className="h-5 w-32 animate-shimmer rounded bg-[var(--guest-shimmer)]/80" />
                        {Array.from({ length: 4 }).map((_, j) => (
                            <div key={j} className="flex gap-3 border-b border-dashed border-[var(--guest-line)] pb-4">
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-[70%] animate-shimmer rounded bg-[var(--guest-shimmer)]/80" />
                                    <div className="h-3 w-14 animate-shimmer rounded bg-[var(--guest-shimmer)]/80" />
                                </div>
                                <div className="w-[108px] shrink-0 space-y-2">
                                    <div className="aspect-[4/3] w-full animate-shimmer rounded-lg bg-[var(--guest-shimmer)]/80" />
                                    <div className="h-9 w-full animate-shimmer rounded-md bg-[var(--guest-shimmer)]/80" />
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
