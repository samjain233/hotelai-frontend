"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { usePublicMenuFull } from "@/hooks/useSwrApi";
import { useActivityStreamGuest } from "@/hooks/useActivityStream";
import { ServiceRequest } from "@/lib/types";
import { buildGuestMenuThemeStyle } from "@/lib/guestMenuTheme";
import { motion, AnimatePresence } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
    AlertTriangle,
    Bed,
    Sparkles,
    Send,
    CheckCircle,
    ShowerHead,
    Wine,
    Shirt,
    Droplets,
    BedDouble,
    Trash2,
    MessageSquare,
    ChevronDown,
    ArrowLeft,
    Utensils,
    Headset,
    Building2,
    UtensilsCrossed,
    UserRound,
    Brush,
    Volume2,
    ClipboardList,
    ShieldCheck,
} from "lucide-react";
import { GuestServicesSkeleton } from "@/components/ui/Skeleton";
import { StayPinModal } from "@/components/guest/StayPinModal";
import { getStayToken, clearStayToken, useStaySession } from "@/lib/staySession";
import { toast } from "sonner";

const COMPLAINT_CATEGORIES: { label: string; desc: string; Icon: LucideIcon }[] = [
    { label: "Room Issue", Icon: Building2, desc: "AC, plumbing, electricity" },
    { label: "Food Quality", Icon: UtensilsCrossed, desc: "Taste, temperature, hygiene" },
    { label: "Staff Behavior", Icon: UserRound, desc: "Rudeness, slow service" },
    { label: "Cleanliness", Icon: Brush, desc: "Room, bathroom, lobby" },
    { label: "Noise", Icon: Volume2, desc: "Other guests, construction" },
    { label: "Other", Icon: ClipboardList, desc: "Any other concern" },
];

const ROOM_SERVICE_ITEMS = [
    { label: "Extra Towels", icon: Droplets, category: "Extra Towels" },
    { label: "Extra Pillows", icon: BedDouble, category: "Extra Pillows" },
    { label: "Iron & Board", icon: Shirt, category: "Iron & Board" },
    { label: "Water Bottles", icon: Wine, category: "Water Bottles" },
    { label: "Toiletries", icon: ShowerHead, category: "Toiletries" },
    { label: "Extra Blanket", icon: Bed, category: "Extra Blanket" },
];

const HOUSEKEEPING_ITEMS = [
    { label: "Room Cleaning", icon: Sparkles, desc: "Full room cleanup" },
    { label: "Bed Making", icon: BedDouble, desc: "Fresh bedsheets" },
    { label: "Bathroom Cleanup", icon: ShowerHead, desc: "Deep bathroom clean" },
    { label: "Trash Pickup", icon: Trash2, desc: "Empty dustbins" },
    { label: "Minibar Refill", icon: Wine, desc: "Restock minibar" },
];

type Tab = "complaint" | "room_service" | "housekeeping";

const STATUS_COLORS: Record<string, string> = {
    SUBMITTED: "bg-[var(--guest-accent-15)] text-[var(--guest-accent)] border-[var(--guest-accent-30)]",
    ACKNOWLEDGED: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    IN_PROGRESS: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    RESOLVED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    REJECTED: "bg-red-500/15 text-red-300 border-red-500/30",
};

export default function GuestServicesClient() {
    const params = useParams();
    const searchParams = useSearchParams();
    const hotelSlug = params.hotelSlug as string;
    const roomFromUrl = searchParams.get("room") || "";

    const menuRes = usePublicMenuFull(hotelSlug || null);
    const hotel = menuRes.data?.hotel ?? null;
    const rooms = useMemo(() => menuRes.data?.rooms ?? [], [menuRes.data]);
    const loading = menuRes.isLoading;
    const themeStyle = useMemo(() => buildGuestMenuThemeStyle(hotel), [hotel]);

    const [activeTab, setActiveTab] = useState<Tab>("complaint");
    const [selectedRoom, setSelectedRoom] = useState("");
    const [guestName, setGuestName] = useState("");
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [guestLogoFailed, setGuestLogoFailed] = useState(false);

    // Complaint form state
    const [complaintCategory, setComplaintCategory] = useState("");
    const [complaintDesc, setComplaintDesc] = useState("");
    const [complaintPriority, setComplaintPriority] = useState("NORMAL");

    // Room service state
    const [roomServiceItem, setRoomServiceItem] = useState("");
    const [roomServiceNote, setRoomServiceNote] = useState("");

    // Housekeeping state
    const [hkCategory, setHkCategory] = useState("");
    const [hkNote, setHkNote] = useState("");

    useEffect(() => {
        setGuestLogoFailed(false);
    }, [hotel?.logoUrl, hotel?.id]);

    useEffect(() => {
        const hotelTitle = hotel?.name?.trim() || (loading ? "" : hotelSlug);
        if (!hotelTitle) {
            document.title = "Guest Services | Dream Canvas";
            return;
        }
        document.title = `${hotelTitle} | Guest Services | Dream Canvas`;
    }, [hotel?.name, hotelSlug, loading]);

    const hasAutoSelectedRef = useRef(false);
    const promptedRoomRef = useRef<string | null>(null);
    const { pin: stayPin } = useStaySession(selectedRoom);

    useEffect(() => {
        if (hasAutoSelectedRef.current || !roomFromUrl || rooms.length === 0) return;
        const match = rooms.find((r) => r.id === roomFromUrl || (r.scanCode != null && r.scanCode === roomFromUrl));
        if (match) {
            setSelectedRoom(match.id);
            hasAutoSelectedRef.current = true;
        }
    }, [rooms, roomFromUrl]);

    /** Auto-prompt guest for Stay PIN when scanning QR code / selecting room if token is not saved yet */
    useEffect(() => {
        if (!selectedRoom || loading) return;
        if (promptedRoomRef.current === selectedRoom) return;
        const token = getStayToken(selectedRoom);
        if (!token) {
            promptedRoomRef.current = selectedRoom;
            setShowPinModal(true);
        }
    }, [selectedRoom, loading]);

    const loadRequests = useCallback(async () => {
        if (!selectedRoom) return;
        try {
            const data = await api.getGuestServiceRequests(selectedRoom);
            setRequests(data);
        } catch (err) { console.error(err); }
    }, [selectedRoom]);

    useEffect(() => {
        if (selectedRoom) loadRequests();
    }, [selectedRoom, loadRequests]);

    useActivityStreamGuest({
        hotelSlug: hotelSlug || "",
        roomId: selectedRoom,
        enabled: !!selectedRoom && !!hotelSlug,
        onServiceRequestNew: loadRequests,
        onServiceRequestUpdated: loadRequests,
    });

    async function handleSubmit(stayTokenOverride?: string) {
        if (!selectedRoom) {
            toast.error("Please select your room number first");
            return;
        }

        const token = stayTokenOverride || getStayToken(selectedRoom);
        if (!token) {
            setShowPinModal(true);
            return;
        }

        let type = "";
        let category = "";
        let description = "";
        let priority = "NORMAL";

        if (activeTab === "complaint") {
            if (!complaintCategory) return;
            type = "COMPLAINT";
            category = complaintCategory;
            description = complaintDesc;
            priority = complaintPriority;
        } else if (activeTab === "room_service") {
            if (!roomServiceItem) return;
            type = "ROOM_SERVICE";
            category = roomServiceItem;
            description = roomServiceNote;
        } else {
            if (!hkCategory) return;
            type = "HOUSEKEEPING";
            category = hkCategory;
            description = hkNote;
        }

        setSubmitting(true);
        try {
            await api.createServiceRequest({
                type,
                category,
                description: description || undefined,
                priority,
                roomId: selectedRoom,
                guestName: guestName || undefined,
                stayToken: token,
            });
            setSubmitted(true);
            toast.success("Request submitted successfully");
            setComplaintCategory(""); setComplaintDesc(""); setComplaintPriority("NORMAL");
            setRoomServiceItem(""); setRoomServiceNote("");
            setHkCategory(""); setHkNote("");
            loadRequests();
            setTimeout(() => setSubmitted(false), 3000);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to submit request";
            if (
                msg.toLowerCase().includes("pin") ||
                msg.toLowerCase().includes("vacant") ||
                msg.toLowerCase().includes("checked out") ||
                msg.toLowerCase().includes("stay") ||
                msg.toLowerCase().includes("session")
            ) {
                clearStayToken(selectedRoom);
                setShowPinModal(true);
            }
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <GuestServicesSkeleton style={themeStyle} />;

    const tabs = [
        { key: "complaint" as Tab, label: "Complaint", icon: AlertTriangle },
        { key: "room_service" as Tab, label: "Room Service", icon: Bed },
        { key: "housekeeping" as Tab, label: "Housekeeping", icon: Sparkles },
    ];

    const myRequests = requests.filter(r => {
        if (activeTab === "complaint") return r.type === "COMPLAINT";
        if (activeTab === "room_service") return r.type === "ROOM_SERVICE";
        return r.type === "HOUSEKEEPING";
    });

    const bottomNavOffsetClass = "pb-[calc(6.75rem+env(safe-area-inset-bottom,0px))]";

    return (
        <div className="min-h-screen bg-[var(--guest-bg)] font-sans text-[var(--guest-text)] page-transition" style={themeStyle}>
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-[var(--guest-line)] bg-[var(--guest-bg)]/95 backdrop-blur-xl supports-[backdrop-filter]:bg-[var(--guest-bg)]/80 px-4 py-3">
                <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Link
                            href={`/menu/${hotelSlug}${roomFromUrl ? `?room=${encodeURIComponent(roomFromUrl)}` : ""}`}
                            className="p-2 rounded-full border border-[var(--guest-line)] bg-[var(--guest-surface)] text-[var(--guest-muted)] hover:bg-[var(--guest-surface-2)] hover:text-[var(--guest-text)] transition-colors"
                            aria-label="Back to food menu"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        {hotel?.logoUrl?.trim() && !guestLogoFailed ? (
                            <Image
                                src={hotel.logoUrl.trim()}
                                alt=""
                                width={36}
                                height={36}
                                priority
                                className="h-9 w-9 shrink-0 rounded-lg bg-[var(--guest-surface)] object-cover ring-1 ring-[var(--guest-line)]"
                                onError={() => setGuestLogoFailed(true)}
                            />
                        ) : hotel?.name ? (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--guest-cta)] to-[var(--guest-cta-hover)] text-sm font-bold text-[var(--guest-on-cta)] ring-1 ring-[var(--guest-line)]">
                                {hotel.name.charAt(0)}
                            </div>
                        ) : null}
                        <div className="min-w-0 flex-1">
                            <h1 className="text-base font-bold leading-tight text-[var(--guest-text)] truncate">
                                {hotel?.name ? `${hotel.name} Services` : "Guest Services"}
                            </h1>
                            <p className="text-xs text-[var(--guest-muted)]">How can we help you?</p>
                        </div>
                    </div>
                    {stayPin ? (
                        <button
                            type="button"
                            onClick={() => setShowPinModal(true)}
                            className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shadow-sm transition hover:bg-emerald-500/20 active:scale-95"
                            title={`Room Stay PIN: ${stayPin} (Click to re-verify)`}
                        >
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            <span className="text-[10px] font-sans font-medium text-[var(--guest-muted)]">PIN</span>
                            <span className="font-mono font-bold tracking-wider">{stayPin}</span>
                        </button>
                    ) : null}
                </div>
            </header>

            <div className={`max-w-lg mx-auto px-4 py-4 space-y-4 ${bottomNavOffsetClass}`}>
                {/* Room & Name */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-[var(--guest-muted)] mb-1 block font-medium">Room</label>
                        <div className="relative">
                            <select
                                value={selectedRoom}
                                onChange={(e) => setSelectedRoom(e.target.value)}
                                className={`w-full rounded-xl border bg-[var(--guest-surface)] px-3 py-2.5 text-sm appearance-none outline-none transition focus:border-[var(--guest-accent-40)] focus:ring-1 focus:ring-[var(--guest-accent-30)] ${!selectedRoom ? "border-amber-500/50 text-[var(--guest-muted)]" : "border-[var(--guest-line)] text-[var(--guest-text)]"
                                    }`}
                            >
                                <option value="" className="bg-[var(--guest-surface)] text-[var(--guest-muted)]">
                                    Select your room...
                                </option>
                                {rooms.map(r => (
                                    <option key={r.id} value={r.id} className="bg-[var(--guest-surface)] text-[var(--guest-text)]">
                                        Room {r.number}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--guest-muted)] pointer-events-none" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-[var(--guest-muted)] mb-1 block font-medium">Your Name</label>
                        <input
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            placeholder="Optional"
                            className="w-full rounded-xl border border-[var(--guest-line)] bg-[var(--guest-surface)] px-3 py-2.5 text-sm text-[var(--guest-text)] outline-none transition placeholder:text-[var(--guest-subtle)] focus:border-[var(--guest-accent-40)] focus:ring-1 focus:ring-[var(--guest-accent-30)]"
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-[var(--guest-surface)] border border-[var(--guest-line)] rounded-xl p-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all ${activeTab === tab.key
                                ? "bg-[var(--guest-cta)] text-[var(--guest-on-cta)] shadow-md font-semibold"
                                : "text-[var(--guest-muted)] hover:bg-[var(--guest-surface-2)]/50 hover:text-[var(--guest-text)]"
                                }`}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === "complaint" && (
                            <div className="space-y-3">
                                <p className="text-xs text-[var(--guest-muted)]">Select a category:</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {COMPLAINT_CATEGORIES.map((cat) => {
                                        const isSel = complaintCategory === cat.label;
                                        const CatIcon = cat.Icon;
                                        return (
                                            <button
                                                key={cat.label}
                                                type="button"
                                                onClick={() => setComplaintCategory(cat.label)}
                                                aria-pressed={isSel}
                                                className={`text-left rounded-xl border p-3 transition-all focus-visible:outline-none ${isSel
                                                    ? "border-[var(--guest-accent)] bg-[var(--guest-accent-15)] shadow-sm"
                                                    : "border-[var(--guest-line)] bg-[var(--guest-surface)] hover:border-[var(--guest-border)]"
                                                    }`}
                                            >
                                                <div
                                                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${isSel ? "bg-[var(--guest-accent-25)] text-[var(--guest-accent)]" : "bg-[var(--guest-surface-2)] text-[var(--guest-muted)]"
                                                        }`}
                                                >
                                                    <CatIcon className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                                                </div>
                                                <p className={`mt-2 text-sm font-semibold text-[var(--guest-text)]`}>
                                                    {cat.label}
                                                </p>
                                                <p className="mt-0.5 text-[10px] leading-snug text-[var(--guest-muted)]">{cat.desc}</p>
                                                {isSel ? (
                                                    <p className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-[var(--guest-accent)]">
                                                        <CheckCircle className="h-3 w-3" aria-hidden />
                                                        Selected
                                                    </p>
                                                ) : null}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div>
                                    <label className="text-xs text-[var(--guest-muted)] mb-1 block font-medium">Priority</label>
                                    <div className="flex gap-2">
                                        {["LOW", "NORMAL", "HIGH", "URGENT"].map(p => (
                                            <button
                                                key={p}
                                                onClick={() => setComplaintPriority(p)}
                                                className={`flex-1 py-2 rounded-lg text-xs transition-all border ${complaintPriority === p
                                                    ? p === "URGENT" ? "border-red-500/60 bg-red-500/15 text-red-300 font-semibold"
                                                        : p === "HIGH" ? "border-amber-500/60 bg-amber-500/15 text-amber-300 font-semibold"
                                                            : "border-[var(--guest-accent)] bg-[var(--guest-accent-15)] text-[var(--guest-text)] font-semibold"
                                                    : "border-[var(--guest-line)] bg-[var(--guest-surface)] text-[var(--guest-muted)] hover:border-[var(--guest-border)] hover:text-[var(--guest-text)]"
                                                    }`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <textarea
                                    value={complaintDesc}
                                    onChange={(e) => setComplaintDesc(e.target.value)}
                                    placeholder="Describe your issue..."
                                    rows={3}
                                    className="w-full rounded-xl border border-[var(--guest-line)] bg-[var(--guest-surface)] px-3 py-2.5 text-sm text-[var(--guest-text)] outline-none transition placeholder:text-[var(--guest-subtle)] focus:border-[var(--guest-accent-40)] focus:ring-1 focus:ring-[var(--guest-accent-30)] resize-none"
                                />
                            </div>
                        )}

                        {activeTab === "room_service" && (
                            <div className="space-y-3">
                                <p className="text-xs text-[var(--guest-muted)]">Quick requests:</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {ROOM_SERVICE_ITEMS.map(item => {
                                        const Icon = item.icon;
                                        const isSel = roomServiceItem === item.category;
                                        return (
                                            <button
                                                key={item.label}
                                                type="button"
                                                onClick={() => setRoomServiceItem(item.category)}
                                                aria-pressed={isSel}
                                                className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all focus-visible:outline-none ${isSel
                                                    ? "border-[var(--guest-accent)] bg-[var(--guest-accent-15)] shadow-sm text-[var(--guest-text)]"
                                                    : "border-[var(--guest-line)] bg-[var(--guest-surface)] hover:border-[var(--guest-border)] text-[var(--guest-text)]"
                                                    }`}
                                            >
                                                <Icon className={`h-6 w-6 shrink-0 ${isSel ? "text-[var(--guest-accent)]" : "text-[var(--guest-muted)]"}`} />
                                                <span className="text-xs text-center font-medium">{item.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <textarea
                                    value={roomServiceNote}
                                    onChange={(e) => setRoomServiceNote(e.target.value)}
                                    placeholder="Additional notes (optional)..."
                                    rows={2}
                                    className="w-full rounded-xl border border-[var(--guest-line)] bg-[var(--guest-surface)] px-3 py-2.5 text-sm text-[var(--guest-text)] outline-none transition placeholder:text-[var(--guest-subtle)] focus:border-[var(--guest-accent-40)] focus:ring-1 focus:ring-[var(--guest-accent-30)] resize-none"
                                />
                            </div>
                        )}

                        {activeTab === "housekeeping" && (
                            <div className="space-y-3">
                                <p className="text-xs text-[var(--guest-muted)]">What do you need?</p>
                                <div className="space-y-2">
                                    {HOUSEKEEPING_ITEMS.map(item => {
                                        const Icon = item.icon;
                                        const isSel = hkCategory === item.label;
                                        return (
                                            <button
                                                key={item.label}
                                                type="button"
                                                onClick={() => setHkCategory(item.label)}
                                                aria-pressed={isSel}
                                                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all focus-visible:outline-none ${isSel
                                                    ? "border-[var(--guest-accent)] bg-[var(--guest-accent-15)] shadow-sm"
                                                    : "border-[var(--guest-line)] bg-[var(--guest-surface)] hover:border-[var(--guest-border)]"
                                                    }`}
                                            >
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSel ? "bg-[var(--guest-accent-25)] text-[var(--guest-accent)]" : "bg-[var(--guest-surface-2)] text-[var(--guest-muted)]"
                                                    }`}>
                                                    <Icon className="w-5 h-5 shrink-0" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-[var(--guest-text)]">{item.label}</p>
                                                    <p className="text-[10px] text-[var(--guest-muted)]">{item.desc}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                <textarea
                                    value={hkNote}
                                    onChange={(e) => setHkNote(e.target.value)}
                                    placeholder="Preferred time or special instructions..."
                                    rows={2}
                                    className="w-full rounded-xl border border-[var(--guest-line)] bg-[var(--guest-surface)] px-3 py-2.5 text-sm text-[var(--guest-text)] outline-none transition placeholder:text-[var(--guest-subtle)] focus:border-[var(--guest-accent-40)] focus:ring-1 focus:ring-[var(--guest-accent-30)] resize-none"
                                />
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Submit Button */}
                {!selectedRoom && (
                    <p className="text-xs text-amber-500 flex items-center justify-center gap-1.5 text-center font-medium">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        Please select your room before submitting
                    </p>
                )}
                <motion.button
                    type="button"
                    whileTap={{ scale: selectedRoom ? 0.97 : 1 }}
                    onClick={() => void handleSubmit()}
                    disabled={submitting || submitted || !selectedRoom}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all ${submitted
                        ? "bg-emerald-600 text-white"
                        : !selectedRoom
                            ? "cursor-not-allowed bg-[var(--guest-surface-2)] text-[var(--guest-muted)]/50 border border-[var(--guest-line)]"
                            : "bg-[var(--guest-cta)] text-[var(--guest-on-cta)] hover:bg-[var(--guest-cta-hover)] shadow-md disabled:opacity-50"
                        }`}
                >
                    {submitted ? (
                        <><CheckCircle className="w-4 h-4" /> Request Submitted!</>
                    ) : submitting ? (
                        <div className="w-5 h-5 border-2 border-[var(--guest-on-cta)]/30 border-t-[var(--guest-on-cta)] rounded-full animate-spin" />
                    ) : (
                        <><Send className="w-4 h-4" /> Submit Request</>
                    )}
                </motion.button>

                {/* My Requests */}
                {myRequests.length > 0 && (
                    <div className="pt-2">
                        <h3 className="text-sm font-semibold text-[var(--guest-muted)] mb-2 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-[var(--guest-accent)]" />
                            Your Requests
                        </h3>
                        <div className="space-y-2">
                            {myRequests.map(req => (
                                <div key={req.id} className="bg-[var(--guest-surface)] border border-[var(--guest-line)] rounded-xl p-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-medium text-[var(--guest-text)]">{req.category}</p>
                                            {req.description && (
                                                <p className="text-xs text-[var(--guest-muted)] mt-0.5">{req.description}</p>
                                            )}
                                        </div>
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[req.status] || "bg-[var(--guest-surface-2)] text-[var(--guest-muted)] border-[var(--guest-line)]"}`}>
                                            {req.status.replace("_", " ")}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-[var(--guest-subtle)] mt-2">
                                        {new Date(req.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom nav + safe area (home indicator on phones) */}
            <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--guest-line)] bg-[var(--guest-bg)]/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-xl">
                <div className="mx-auto flex max-w-lg">
                    <Link
                        href={`/menu/${hotelSlug}${selectedRoom
                            ? `?room=${encodeURIComponent(
                                rooms.find((r) => r.id === selectedRoom)?.scanCode ?? selectedRoom,
                            )}`
                            : roomFromUrl
                                ? `?room=${encodeURIComponent(roomFromUrl)}`
                                : ""
                            }`}
                        className="flex flex-1 flex-col items-center gap-0.5 py-3 text-[var(--guest-muted)] transition-colors hover:text-[var(--guest-text)]"
                    >
                        <Utensils className="h-5 w-5 shrink-0" aria-hidden />
                        <span className="text-[10px] font-medium">Food Menu</span>
                    </Link>
                    <div className="relative flex flex-1 flex-col items-center gap-0.5 py-3 text-[var(--guest-accent)]">
                        <span
                            className="absolute left-1/2 top-0 h-0.5 w-10 -translate-x-1/2 rounded-full bg-[var(--guest-accent)]"
                            aria-hidden
                        />
                        <Headset className="h-5 w-5 shrink-0" aria-hidden />
                        <span className="text-[10px] font-semibold">Services</span>
                    </div>
                </div>
            </div>

            {/* In-Room Stay PIN Verification Modal */}
            <StayPinModal
                isOpen={showPinModal}
                onClose={() => setShowPinModal(false)}
                roomId={selectedRoom}
                roomNumber={rooms.find((r) => r.id === selectedRoom)?.number || "Your Room"}
                onSuccess={(newToken) => {
                    setShowPinModal(false);
                    if (submitting) {
                        void handleSubmit(newToken);
                    }
                }}
            />
        </div>
    );
}

