import {
    Bath,
    BedDouble,
    Bell,
    Car,
    ChefHat,
    CircleHelp,
    Coffee,
    ConciergeBell,
    Dumbbell,
    HeartPulse,
    Luggage,
    MapPin,
    ParkingSquare,
    Plane,
    Shirt,
    Sparkles,
    SprayCan,
    Stethoscope,
    UtensilsCrossed,
    WashingMachine,
    Wifi,
    Wine,
    Wrench,
} from "lucide-react";

export const SERVICE_ICON_OPTIONS = [
    // ─── Housekeeping ─────────────────────────────
    {
        key: "laundry",
        label: "Laundry",
        icon: WashingMachine,
    },
    {
        key: "housekeeping",
        label: "Housekeeping",
        icon: SprayCan,
    },
    {
        key: "room_cleaning",
        label: "Room Cleaning",
        icon: Sparkles,
    },
    {
        key: "extra_towels",
        label: "Extra Towels",
        icon: Bath,
    },

    // ─── Hotel / Room ─────────────────────────────
    {
        key: "concierge",
        label: "Concierge",
        icon: ConciergeBell,
    },
    {
        key: "wake_up_call",
        label: "Wake-up Call",
        icon: Bell,
    },
    {
        key: "wifi",
        label: "Wi-Fi",
        icon: Wifi,
    },
    {
        key: "parking",
        label: "Parking",
        icon: ParkingSquare,
    },

    // ─── Transport ────────────────────────────────
    {
        key: "airport_transfer",
        label: "Airport Transfer",
        icon: Plane,
    },
    {
        key: "taxi",
        label: "Taxi",
        icon: Car,
    },
    {
        key: "luggage",
        label: "Luggage",
        icon: Luggage,
    },
    {
        key: "location",
        label: "Location",
        icon: MapPin,
    },

    // ─── Food & Beverage ──────────────────────────
    {
        key: "restaurant",
        label: "Restaurant",
        icon: UtensilsCrossed,
    },
    {
        key: "room_dining",
        label: "Room Dining",
        icon: ChefHat,
    },
    {
        key: "coffee",
        label: "Coffee",
        icon: Coffee,
    },
    {
        key: "bar",
        label: "Bar",
        icon: Wine,
    },

    // ─── Wellness ─────────────────────────────────
    {
        key: "spa",
        label: "Spa",
        icon: Sparkles,
    },
    {
        key: "gym",
        label: "Gym",
        icon: Dumbbell,
    },
    {
        key: "health",
        label: "Health",
        icon: HeartPulse,
    },
    {
        key: "medical",
        label: "Medical",
        icon: Stethoscope,
    },

    // ─── General ──────────────────────────────────
    {
        key: "clothing",
        label: "Clothing",
        icon: Shirt,
    },
    {
        key: "maintenance",
        label: "Maintenance",
        icon: Wrench,
    },
    {
        key: "general",
        label: "General",
        icon: CircleHelp,
    },
] as const;

export type ServiceIconKey =
    (typeof SERVICE_ICON_OPTIONS)[number]["key"];

export const DEFAULT_SERVICE_ICON = "general";