import { AdminDashboardClient } from "./AdminDashboardClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface MenuItem {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: string;
    imageUrl: string | null;
    available: boolean;
    createdAt: string;
}

async function getMenuItems(hotelId: string): Promise<MenuItem[]> {
    try {
        const res = await fetch(`${API_URL}/menu/${hotelId}/admin`, {
            cache: "no-store",
        });
        if (!res.ok) return [];
        return res.json();
    } catch {
        return [];
    }
}

async function getHotelInfo(hotelId: string) {
    try {
        const res = await fetch(`${API_URL}/menu/${hotelId}`, {
            cache: "no-store",
        });
        if (!res.ok) return null;
        const data = await res.json();
        return { name: data.hotel, id: data.hotelId };
    } catch {
        return null;
    }
}

async function getQrCode(hotelId: string) {
    try {
        const res = await fetch(`${API_URL}/menu/${hotelId}/qr`, {
            cache: "no-store",
        });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

export default async function AdminPage({
    params,
}: {
    params: Promise<{ hotelId: string }>;
}) {
    const { hotelId } = await params;
    const [items, hotel, qr] = await Promise.all([
        getMenuItems(hotelId),
        getHotelInfo(hotelId),
        getQrCode(hotelId),
    ]);

    if (!hotel) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <div className="text-5xl">🏨</div>
                <h1 className="text-xl font-semibold">Hotel Not Found</h1>
                <p className="text-[var(--color-text-secondary)] text-sm">
                    No hotel exists with this ID.
                </p>
            </div>
        );
    }

    return (
        <AdminDashboardClient
            hotelId={hotelId}
            hotelName={hotel.name}
            initialItems={items}
            qrData={qr}
        />
    );
}
