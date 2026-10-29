const GUEST_TITLE_BRAND = "Dream Canvas";

/** Guest menu tab title. Server metadata renders it without a room; the client adds the room once known. */
export function guestMenuTitle(hotelName: string, roomDisplayName?: string): string {
    return [hotelName, roomDisplayName ? `Room ${roomDisplayName}` : "", GUEST_TITLE_BRAND].filter(Boolean).join(" | ");
}
