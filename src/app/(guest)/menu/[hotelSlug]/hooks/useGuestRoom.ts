"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { PublicMenuFullData } from "@/lib/types";

type GuestRoom = NonNullable<PublicMenuFullData["rooms"]>[number];

/**
 * Which room this guest is acting for. The QR carries `?room=<id|scanCode>`; without it the guest
 * can pick a room in the order modal (`selectedRoomId`). Either is resolved against the hotel's
 * room list, so an unknown value yields no room rather than a bogus id.
 */
export function useGuestRoom(hotelSlug: string, availableRooms: readonly GuestRoom[]) {
    const [selectedRoomId, setSelectedRoomId] = useState("");
    const searchParams = useSearchParams();
    const roomParam = searchParams.get("room") || selectedRoomId;

    const resolvedRoomId = useMemo(() => {
        if (!roomParam || availableRooms.length === 0) return "";
        const byId = availableRooms.find((r) => r.id === roomParam);
        if (byId) return byId.id;
        const byCode = availableRooms.find((r) => r.scanCode != null && r.scanCode !== "" && r.scanCode === roomParam);
        return byCode?.id ?? "";
    }, [roomParam, availableRooms]);

    const roomDisplayName = useMemo(
        () => availableRooms.find((r) => r.id === resolvedRoomId)?.number || "",
        [availableRooms, resolvedRoomId],
    );

    // Services page gets the raw param so the room survives even when it is not in this list.
    const guestServicesHref = useMemo(() => {
        const base = `/services/${hotelSlug}`;
        const r = roomParam?.trim();
        return r ? `${base}?room=${encodeURIComponent(r)}` : base;
    }, [hotelSlug, roomParam]);

    return { selectedRoomId, setSelectedRoomId, resolvedRoomId, roomDisplayName, guestServicesHref };
}
