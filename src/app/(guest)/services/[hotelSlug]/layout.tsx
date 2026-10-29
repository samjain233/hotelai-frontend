import type { Metadata } from "next";
import { fetchGuestMenuFullData } from "@/lib/guestMenuFullServer";

interface Props {
    children: React.ReactNode;
    params: Promise<{ hotelSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { hotelSlug } = await params;
    // Metadata only: an API hiccup should not take the (client-rendered) services page down with it.
    const data = await fetchGuestMenuFullData(hotelSlug).catch(() => null);
    const name = data?.hotel?.name ?? hotelSlug;
    return {
        // Same string GuestServicesClient sets once loaded, so the tab title does not change on hydration.
        title: { absolute: `${name} | Guest Services | Dream Canvas` },
        description: `Request housekeeping, room service, or share feedback at ${name}.`,
    };
}

export default function GuestServicesSlugLayout({ children }: { children: React.ReactNode }) {
    return children;
}
