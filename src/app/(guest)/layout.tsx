import type { Metadata } from "next";

/** Tenant guest URLs — not indexed by default (privacy). */
export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function GuestSegmentLayout({ children }: { children: React.ReactNode }) {
    return children;
}
