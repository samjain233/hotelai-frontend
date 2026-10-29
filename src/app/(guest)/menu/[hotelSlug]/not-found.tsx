import type { Metadata } from "next";
import { GuestMenuStatusPage } from "./components/GuestMenuStatusPage";

export const metadata: Metadata = { title: "Menu not found" };

/** Unknown hotel slug: a real 404 (status + `noindex` from the guest layout), not a cached skeleton. */
export default function GuestMenuNotFound() {
    return (
        <GuestMenuStatusPage
            title="Menu not found"
            message="This QR code doesn't match any menu. Please ask the front desk for the right one."
        />
    );
}
