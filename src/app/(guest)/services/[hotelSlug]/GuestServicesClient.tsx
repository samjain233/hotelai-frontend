"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams, useSearchParams } from "next/navigation";
import { api, guestFacingErrorMessage } from "@/lib/api";
import { usePublicMenuFull } from "@/hooks/useSwrApi";
import { useActivityStreamGuest } from "@/hooks/useActivityStream";
import { Service, ServiceRequest } from "@/lib/types";
import { buildGuestMenuThemeStyle } from "@/lib/guestMenuTheme";
import { guestMenuImageSrc } from "@/lib/guestMenuImageHosts";
import type { LucideIcon } from "lucide-react";
import {
    AlertTriangle,
    Send,
    CheckCircle,
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
    KeyRound,
} from "lucide-react";
import { GuestServicesSkeleton } from "@/components/ui/Skeleton";
import { isStayVerified, clearStayVerified, useStaySession, isStayAccessError } from "@/lib/staySession";
import { toast } from "sonner";

// Uses framer-motion; loaded only when the PIN prompt opens.
const StayPinModal = dynamic(() => import("@/components/guest/StayPinModal").then((m) => m.StayPinModal), { ssr: false });

const COMPLAINT_CATEGORIES: { label: string; desc: string; Icon: LucideIcon }[] = [
    { label: "Room Issue", Icon: Building2, desc: "AC, plumbing, electricity" },
    { label: "Food Quality", Icon: UtensilsCrossed, desc: "Taste, temperature, hygiene" },
    { label: "Staff Behavior", Icon: UserRound, desc: "Rudeness, slow service" },
    { label: "Cleanliness", Icon: Brush, desc: "Room, bathroom, lobby" },
    { label: "Noise", Icon: Volume2, desc: "Other guests, construction" },
    { label: "Other", Icon: ClipboardList, desc: "Any other concern" },
];

type Tab = "complaint" | "services";

const NO_SERVICES: Service[] = [];

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
    // The QR's `?room=<id|scanCode>` preselects a room once the list loads, until the guest picks one.
    const [pickedRoom, setSelectedRoom] = useState<string | null>(null);
    const roomFromUrlId = useMemo(
        () => (roomFromUrl ? rooms.find((r) => r.id === roomFromUrl || (r.scanCode != null && r.scanCode === roomFromUrl))?.id ?? "" : ""),
        [rooms, roomFromUrl],
    );
    const selectedRoom = pickedRoom ?? roomFromUrlId;
    const [guestName, setGuestName] = useState("");
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    // Keyed by URL so a new logo gets a fresh attempt without an effect to reset the flag.
    const logoSrc = guestMenuImageSrc(hotel?.logoUrl);
    const [failedLogoSrc, setFailedLogoSrc] = useState<string | null>(null);
    const guestLogoFailed = failedLogoSrc === logoSrc;

    // Complaint form state
    const [complaintCategory, setComplaintCategory] = useState("");
    const [complaintDesc, setComplaintDesc] = useState("");
    const [complaintPriority, setComplaintPriority] = useState("NORMAL");
    // Hotel services
    const [loadedServices, setLoadedServices] = useState<{ hotelSlug: string; services: Service[] } | null>(null);
    const services = loadedServices?.hotelSlug === hotelSlug ? loadedServices.services : NO_SERVICES;
    const servicesLoading = !!hotelSlug && loadedServices?.hotelSlug !== hotelSlug;
    const [selectedServiceId, setSelectedServiceId] = useState("");
    const [serviceNote, setServiceNote] = useState("");

    useEffect(() => {
        const hotelTitle = hotel?.name?.trim() || (loading ? "" : hotelSlug);
        if (!hotelTitle) {
            document.title = "Guest Services | Dream Canvas";
            return;
        }
        document.title = `${hotelTitle} | Guest Services | Dream Canvas`;
    }, [hotel?.name, hotelSlug, loading]);

    const promptedRoomRef = useRef<string | null>(null);
    const { isVerified: stayVerified } = useStaySession(selectedRoom);

    /** Auto-prompt guest for Stay PIN when scanning QR code / selecting room if this phone hasn't verified it yet */
    useEffect(() => {
        if (!selectedRoom || loading) return;
        if (promptedRoomRef.current === selectedRoom) return;
        if (!isStayVerified(selectedRoom)) {
            promptedRoomRef.current = selectedRoom;
            // eslint-disable-next-line react-hooks/set-state-in-effect -- reacts to an external store (localStorage) after hydration
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
        if (!selectedRoom) return;
        let cancelled = false;
        api.getGuestServiceRequests(selectedRoom).then(
            (data) => { if (!cancelled) setRequests(data); },
            (err) => console.error(err),
        );
        return () => { cancelled = true; };
    }, [selectedRoom]);

    useEffect(() => {
        if (!hotelSlug) return;
        let cancelled = false;
        api.getGuestServices(hotelSlug).then(
            (data) => { if (!cancelled) setLoadedServices({ hotelSlug, services: data }); },
            (err) => {
                console.error("Failed to load guest services:", err);
                if (!cancelled) setLoadedServices({ hotelSlug, services: [] });
            },
        );
        return () => { cancelled = true; };
    }, [hotelSlug]);

    useActivityStreamGuest({
        hotelSlug: hotelSlug || "",
        roomId: selectedRoom,
        enabled: !!selectedRoom && !!hotelSlug && hotel?.features?.includes("SERVICE_REQUESTS") === true,
        onServiceRequestNew: loadRequests,
        onServiceRequestUpdated: loadRequests,
    });

    async function handleSubmit() {
        if (!selectedRoom) {
            toast.error("Please select your room number first");
            return;
        }

        if (!isStayVerified(selectedRoom)) {
            setShowPinModal(true);
            return;
        }

        let type = "";
        let category = "";
        let description = "";
        let priority = "NORMAL";
        let serviceId: string | undefined;

        if (activeTab === "complaint") {
            if (!complaintCategory) {
                toast.error("Please select a complaint category");
                return;
            }

            type = "COMPLAINT";
            category = complaintCategory;
            description = complaintDesc;
            priority = complaintPriority;
        } else {
            if (!selectedServiceId) {
                toast.error("Please select a service");
                return;
            }

            const selectedService = services.find(
                (service) => service.id === selectedServiceId,
            );

            if (!selectedService) {
                toast.error("Service not found");
                return;
            }

            if (!selectedService.available) {
                toast.error("This service is currently unavailable");
                return;
            }

            type = "SERVICE";
            serviceId = selectedService.id;
            category = selectedService.name;
            description = serviceNote;
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
                ...(serviceId ? { serviceId } : {}),
            });

            setSubmitted(true);

            toast.success("Request submitted successfully");

            // Reset complaint
            setComplaintCategory("");
            setComplaintDesc("");
            setComplaintPriority("NORMAL");

            // Reset service
            setSelectedServiceId("");
            setServiceNote("");

            await loadRequests();

            setTimeout(() => setSubmitted(false), 3000);
        } catch (err: unknown) {
            console.error("Service request failed", err);
            if (isStayAccessError(err)) {
                clearStayVerified(selectedRoom);
                setShowPinModal(true);
            }
            toast.error(guestFacingErrorMessage(err, "We couldn't send your request. Please try again."));
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <GuestServicesSkeleton style={themeStyle} />;

    const tabs = [
        {
            key: "complaint" as Tab,
            label: "Complaint",
            icon: AlertTriangle,
        },
        {
            key: "services" as Tab,
            label: "Services",
            icon: Headset,
        },
    ];

    const myRequests = requests.filter((request) => {
        if (activeTab === "complaint") {
            return request.type === "COMPLAINT";
        }

        return request.type === "SERVICE";
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
                        {logoSrc && !guestLogoFailed ? (
                            <Image
                                src={logoSrc}
                                alt=""
                                width={36}
                                height={36}
                                priority
                                className="h-9 w-9 shrink-0 rounded-lg bg-[var(--guest-surface)] object-cover ring-1 ring-[var(--guest-line)]"
                                onError={() => setFailedLogoSrc(logoSrc)}
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
                    {selectedRoom ? (
                        stayVerified ? (
                            <button
                                type="button"
                                onClick={() => setShowPinModal(true)}
                                className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shadow-sm transition hover:bg-emerald-500/20 active:scale-95"
                                title="Room verified (Click to re-enter PIN)"
                            >
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                <span>Verified</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setShowPinModal(true)}
                                className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 shadow-sm transition hover:bg-amber-500/20 active:scale-95"
                                title="Enter Stay PIN"
                            >
                                <KeyRound className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                <span>Enter PIN</span>
                            </button>
                        )
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

                {/* Tab Content (keyed so the enter animation replays on every tab switch) */}
                <div key={activeTab} className="animate-fade-in-up motion-reduce:animate-none">
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

                    {activeTab === "services" && (
                        <div className="space-y-3">
                            <p className="text-xs text-[var(--guest-muted)]">
                                Select a service:
                            </p>

                            {servicesLoading ? (
                                <div className="rounded-xl border border-[var(--guest-line)] bg-[var(--guest-surface)] p-6 text-center">
                                    <div className="mx-auto h-5 w-5 rounded-full border-2 border-[var(--guest-accent)]/30 border-t-[var(--guest-accent)] animate-spin" />
                                    <p className="mt-2 text-xs text-[var(--guest-muted)]">
                                        Loading services...
                                    </p>
                                </div>
                            ) : services.length === 0 ? (
                                <div className="rounded-xl border border-[var(--guest-line)] bg-[var(--guest-surface)] p-6 text-center">
                                    <Headset className="mx-auto h-8 w-8 text-[var(--guest-muted)]" />

                                    <p className="mt-3 text-sm font-semibold text-[var(--guest-text)]">
                                        No services available
                                    </p>

                                    <p className="mt-1 text-xs text-[var(--guest-muted)]">
                                        This hotel has not added any guest services yet.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        {services.map((service) => {
                                            const isSelected =
                                                selectedServiceId === service.id;

                                            return (
                                                <button
                                                    key={service.id}
                                                    type="button"
                                                    disabled={!service.available}
                                                    onClick={() => {
                                                        if (!service.available) return;

                                                        setSelectedServiceId(service.id);
                                                    }}
                                                    aria-pressed={isSelected}
                                                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all focus-visible:outline-none ${
                                                        !service.available
                                                            ? "cursor-not-allowed border-[var(--guest-line)] bg-[var(--guest-surface)] opacity-60"
                                                            : isSelected
                                                                ? "border-[var(--guest-accent)] bg-[var(--guest-accent-15)] shadow-sm"
                                                                : "border-[var(--guest-line)] bg-[var(--guest-surface)] hover:border-[var(--guest-border)]"
                                                    }`}
                                                >
                                                    <div
                                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                                                            isSelected
                                                                ? "bg-[var(--guest-accent-25)] text-[var(--guest-accent)]"
                                                                : "bg-[var(--guest-surface-2)] text-[var(--guest-muted)]"
                                                        }`}
                                                    >
                                                        <Headset className="h-5 w-5" />
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium text-[var(--guest-text)]">
                                                            {service.name}
                                                        </p>

                                                        {service.description && (
                                                            <p className="mt-0.5 text-[10px] leading-snug text-[var(--guest-muted)]">
                                                                {service.description}
                                                            </p>
                                                        )}

                                                        <p className="mt-1 text-[10px] font-medium text-[var(--guest-muted)]">
                                                            {Number(service.price) > 0
                                                                ? `₹${Number(service.price).toLocaleString()}`
                                                                : "Free"}
                                                        </p>
                                                    </div>

                                                    <div className="shrink-0">
                                                        {!service.available ? (
                                                            <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-1 text-[9px] font-semibold text-red-400">
                                                                Unavailable
                                                            </span>
                                                        ) : isSelected ? (
                                                            <CheckCircle className="h-5 w-5 text-[var(--guest-accent)]" />
                                                        ) : null}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {selectedServiceId && (
                                        <textarea
                                            value={serviceNote}
                                            onChange={(e) =>
                                                setServiceNote(e.target.value)
                                            }
                                            placeholder="Additional instructions (optional)..."
                                            rows={2}
                                            className="w-full resize-none rounded-xl border border-[var(--guest-line)] bg-[var(--guest-surface)] px-3 py-2.5 text-sm text-[var(--guest-text)] outline-none transition placeholder:text-[var(--guest-subtle)] focus:border-[var(--guest-accent-40)] focus:ring-1 focus:ring-[var(--guest-accent-30)]"
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                {!selectedRoom && (
                    <p className="text-xs text-amber-500 flex items-center justify-center gap-1.5 text-center font-medium">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        Please select your room before submitting
                    </p>
                )}
                <button
                    type="button"
                    onClick={() => void handleSubmit()}
                    disabled={submitting || submitted || !selectedRoom}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all ${submitted
                        ? "bg-emerald-600 text-white"
                        : !selectedRoom
                            ? "cursor-not-allowed bg-[var(--guest-surface-2)] text-[var(--guest-muted)]/50 border border-[var(--guest-line)]"
                            : "bg-[var(--guest-cta)] text-[var(--guest-on-cta)] hover:bg-[var(--guest-cta-hover)] shadow-md disabled:opacity-50 active:scale-[0.97]"
                        }`}
                >
                    {submitted ? (
                        <><CheckCircle className="w-4 h-4" /> Request Submitted!</>
                    ) : submitting ? (
                        <div className="w-5 h-5 border-2 border-[var(--guest-on-cta)]/30 border-t-[var(--guest-on-cta)] rounded-full animate-spin" />
                    ) : (
                        <><Send className="w-4 h-4" /> Submit Request</>
                    )}
                </button>

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
            {showPinModal && (
                <StayPinModal
                    isOpen
                    onClose={() => setShowPinModal(false)}
                    roomId={selectedRoom}
                    roomNumber={rooms.find((r) => r.id === selectedRoom)?.number || "Your Room"}
                    onSuccess={() => {
                        setShowPinModal(false);
                        void loadRequests();
                        if (submitting) {
                            void handleSubmit();
                        }
                    }}
                />
            )}
        </div>
    );
}

