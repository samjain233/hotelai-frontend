import type { Metadata } from "next";
import { fetchGuestMenuFullData } from "@/lib/guestMenuFullServer";

interface Props {
    children: React.ReactNode;
    params: Promise<{ hotelSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { hotelSlug } = await params;
    const data = await fetchGuestMenuFullData(hotelSlug);
    const name = data?.hotel?.name ?? hotelSlug;
    return {
        title: `${name} — Guest services`,
        description: `Request housekeeping, room service, or share feedback at ${name}.`,
    };
}

export default function GuestServicesSlugLayout({ children }: { children: React.ReactNode }) {
    return children;
}
