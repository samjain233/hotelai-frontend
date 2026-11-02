"use client";

import { useRoomQr } from "@/hooks/useSwrApi";
import type { Room } from "@/lib/types";
import { QrCardModal } from "./QrCardModal";

/** Preview, download, copy or print the QR card for one room. */
export function RoomQrModal({ room, onClose }: { room: Room | null; onClose: () => void }) {
    const { data, error } = useRoomQr(room?.id ?? null);
    return (
        <QrCardModal
            open={!!room}
            onClose={onClose}
            title={room ? `Room ${room.number}` : ""}
            subtitle={`${room?.floor ? `Floor ${room.floor} · ` : ""}QR card`}
            qr={data}
            error={error}
            eyebrow="Room"
            label={room?.number ?? ""}
            tagline="Scan to order"
            downloadName={`room-${room?.number ?? ""}-qr.png`}
        />
    );
}
