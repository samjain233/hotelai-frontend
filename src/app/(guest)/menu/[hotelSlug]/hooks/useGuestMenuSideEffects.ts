"use client";

import { useEffect } from "react";
import { api } from "@/lib/api";
import { guestMenuTitle } from "@/lib/guestMenuTitle";

/** Adds the room to the server-rendered tab title once the client knows it. */
export function useGuestDocumentTitle(hotelName: string | undefined, hotelSlug: string, roomDisplayName: string) {
    useEffect(() => {
        if (!roomDisplayName) return;
        const hotelTitle = hotelName?.trim() || hotelSlug;
        document.title = guestMenuTitle(hotelTitle, roomDisplayName);
        return () => {
            document.title = guestMenuTitle(hotelTitle);
        };
    }, [hotelName, hotelSlug, roomDisplayName]);
}

/** Counts one menu view per hotel per tab (the owner's analytics); fire-and-forget. */
export function useTrackMenuView(hotelId: string | undefined) {
    useEffect(() => {
        if (!hotelId) return;
        const sessionKey = `menu_viewed_${hotelId}`;
        try {
            if (sessionStorage.getItem(sessionKey)) return;
            sessionStorage.setItem(sessionKey, "true");
        } catch {
            // Storage unavailable: count the view anyway.
        }
        api.trackMenuView(hotelId).catch(() => {});
    }, [hotelId]);
}
