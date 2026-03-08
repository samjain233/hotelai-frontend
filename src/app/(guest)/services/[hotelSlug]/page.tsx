"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { api, API_URL } from "@/lib/api";
import { ServiceRequest } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import {
    AlertTriangle,
    Bed,
    Sparkles,
    Send,
    CheckCircle,
    Clock,
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
} from "lucide-react";
import Link from "next/link";

// ─── Config ──────────────────────────────────────────────

const COMPLAINT_CATEGORIES = [
    { label: "Room Issue", icon: "🏠", desc: "AC, plumbing, electricity" },
    { label: "Food Quality", icon: "🍽️", desc: "Taste, temperature, hygiene" },
    { label: "Staff Behavior", icon: "👤", desc: "Rudeness, slow service" },
    { label: "Cleanliness", icon: "🧹", desc: "Room, bathroom, lobby" },
    { label: "Noise", icon: "🔊", desc: "Other guests, construction" },
    { label: "Other", icon: "📋", desc: "Any other concern" },
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
    SUBMITTED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    ACKNOWLEDGED: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    IN_PROGRESS: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    RESOLVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function GuestServicesPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const hotelSlug = params.hotelSlug as string;
    const roomFromUrl = searchParams.get("room") || "";

    const [activeTab, setActiveTab] = useState<Tab>("complaint");
    const [rooms, setRooms] = useState<{ id: string; number: string; hotelId?: string }[]>([]);
    const [selectedRoom, setSelectedRoom] = useState(roomFromUrl); // only pre-fill if from QR
    const [guestName, setGuestName] = useState("");
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(true);
    const socketRef = useRef<Socket | null>(null);

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
        loadRooms();
    }, [hotelSlug]);

    useEffect(() => {
        if (selectedRoom) loadRequests();
    }, [selectedRoom]);

    // WebSocket: live status updates for this guest's requests
    useEffect(() => {
        const room = rooms.find(r => r.id === selectedRoom);
        if (!room?.hotelId) return;
        const socket = io(`${API_URL}/service-requests`, {
            query: { hotelId: room.hotelId },
        });
        socketRef.current = socket;
        socket.on("service-request:updated", (updated: ServiceRequest) => {
            setRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
        });
        return () => { socket.disconnect(); };
    }, [selectedRoom, rooms]);

    async function loadRooms() {
        try {
            const data = await api.getPublicRooms(hotelSlug);
            setRooms(data);
            // Only auto-select if room came from QR URL — never guess
            if (roomFromUrl && data.some((r: any) => r.id === roomFromUrl)) {
                setSelectedRoom(roomFromUrl);
            }
            // If no QR param → leave selectedRoom blank → guest must pick
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }

    async function loadRequests() {
        try {
            const data = await api.getGuestServiceRequests(selectedRoom);
            setRequests(data);
        } catch (err) { console.error(err); }
    }

    async function handleSubmit() {
        if (!selectedRoom) return;

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
            });
            setSubmitted(true);
            // Reset forms
            setComplaintCategory(""); setComplaintDesc(""); setComplaintPriority("NORMAL");
            setRoomServiceItem(""); setRoomServiceNote("");
            setHkCategory(""); setHkNote("");
            loadRequests();
            setTimeout(() => setSubmitted(false), 3000);
        } catch (err: any) {
            alert(err.message || "Failed to submit");
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

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

    return (
        <div className="min-h-screen pb-20 bg-[#0a0a0a] text-white">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5 px-4 py-3">
                <div className="max-w-lg mx-auto flex items-center gap-3">
                    <Link href={`/menu/${hotelSlug}`} className="p-1.5 rounded-lg hover:bg-white/5">
                        <ArrowLeft className="w-5 h-5 text-white/60" />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold">Guest Services</h1>
                        <p className="text-xs text-white/40">How can we help you?</p>
                    </div>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
                {/* Room & Name */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-white/40 mb-1 block">Room</label>
                        <div className="relative">
                            <select
                                value={selectedRoom}
                                onChange={(e) => setSelectedRoom(e.target.value)}
                                className={`w-full bg-white/5 border rounded-xl px-3 py-2.5 text-sm appearance-none outline-none focus:border-white/30 transition ${!selectedRoom ? "border-amber-500/40 text-white/50" : "border-white/10 text-white"
                                    }`}
                            >
                                <option value="" className="bg-[#1a1a1a] text-white/50">
                                    Select your room...
                                </option>
                                {rooms.map(r => (
                                    <option key={r.id} value={r.id} className="bg-[#1a1a1a]">
                                        Room {r.number}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-white/40 mb-1 block">Your Name</label>
                        <input
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            placeholder="Optional"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-white/30 transition placeholder:text-white/20"
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-white/5 rounded-xl p-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all ${activeTab === tab.key
                                ? "bg-white text-black shadow-lg"
                                : "text-white/50 hover:text-white/80"
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
                                <p className="text-xs text-white/40">Select a category:</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {COMPLAINT_CATEGORIES.map(cat => (
                                        <button
                                            key={cat.label}
                                            onClick={() => setComplaintCategory(cat.label)}
                                            className={`text-left p-3 rounded-xl border transition-all ${complaintCategory === cat.label
                                                ? "border-red-500/50 bg-red-500/10"
                                                : "border-white/10 bg-white/5 hover:border-white/20"
                                                }`}
                                        >
                                            <span className="text-lg">{cat.icon}</span>
                                            <p className="text-sm font-medium mt-1">{cat.label}</p>
                                            <p className="text-[10px] text-white/30">{cat.desc}</p>
                                        </button>
                                    ))}
                                </div>

                                <div>
                                    <label className="text-xs text-white/40 mb-1 block">Priority</label>
                                    <div className="flex gap-2">
                                        {["LOW", "NORMAL", "HIGH", "URGENT"].map(p => (
                                            <button
                                                key={p}
                                                onClick={() => setComplaintPriority(p)}
                                                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all border ${complaintPriority === p
                                                    ? p === "URGENT" ? "border-red-500 bg-red-500/20 text-red-400"
                                                        : p === "HIGH" ? "border-amber-500 bg-amber-500/20 text-amber-400"
                                                            : "border-white/30 bg-white/10 text-white"
                                                    : "border-white/10 text-white/40 hover:border-white/20"
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
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-white/30 resize-none placeholder:text-white/20"
                                />
                            </div>
                        )}

                        {activeTab === "room_service" && (
                            <div className="space-y-3">
                                <p className="text-xs text-white/40">Quick requests:</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {ROOM_SERVICE_ITEMS.map(item => {
                                        const Icon = item.icon;
                                        return (
                                            <button
                                                key={item.label}
                                                onClick={() => setRoomServiceItem(item.category)}
                                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${roomServiceItem === item.category
                                                    ? "border-blue-500/50 bg-blue-500/10"
                                                    : "border-white/10 bg-white/5 hover:border-white/20"
                                                    }`}
                                            >
                                                <Icon className="w-6 h-6 text-white/60" />
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
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-white/30 resize-none placeholder:text-white/20"
                                />
                            </div>
                        )}

                        {activeTab === "housekeeping" && (
                            <div className="space-y-3">
                                <p className="text-xs text-white/40">What do you need?</p>
                                <div className="space-y-2">
                                    {HOUSEKEEPING_ITEMS.map(item => {
                                        const Icon = item.icon;
                                        return (
                                            <button
                                                key={item.label}
                                                onClick={() => setHkCategory(item.label)}
                                                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${hkCategory === item.label
                                                    ? "border-emerald-500/50 bg-emerald-500/10"
                                                    : "border-white/10 bg-white/5 hover:border-white/20"
                                                    }`}
                                            >
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${hkCategory === item.label ? "bg-emerald-500/20" : "bg-white/5"
                                                    }`}>
                                                    <Icon className="w-5 h-5 text-white/60" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{item.label}</p>
                                                    <p className="text-[10px] text-white/30">{item.desc}</p>
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
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-white/30 resize-none placeholder:text-white/20"
                                />
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Submit Button */}
                {!selectedRoom && (
                    <p className="text-xs text-amber-400/80 text-center flex items-center justify-center gap-1.5">
                        <span>⚠</span> Please select your room before submitting
                    </p>
                )}
                <motion.button
                    whileTap={{ scale: selectedRoom ? 0.97 : 1 }}
                    onClick={handleSubmit}
                    disabled={submitting || submitted || !selectedRoom}
                    className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${submitted
                            ? "bg-emerald-500 text-white"
                            : !selectedRoom
                                ? "bg-white/10 text-white/30 cursor-not-allowed"
                                : "bg-white text-black hover:bg-white/90 disabled:opacity-50"
                        }`}
                >
                    {submitted ? (
                        <><CheckCircle className="w-4 h-4" /> Request Submitted!</>
                    ) : submitting ? (
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                        <><Send className="w-4 h-4" /> Submit Request</>
                    )}
                </motion.button>

                {/* My Requests */}
                {myRequests.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-white/60 mb-2 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Your Requests
                        </h3>
                        <div className="space-y-2">
                            {myRequests.map(req => (
                                <div key={req.id} className="bg-white/5 border border-white/10 rounded-xl p-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-medium">{req.category}</p>
                                            {req.description && (
                                                <p className="text-xs text-white/30 mt-0.5">{req.description}</p>
                                            )}
                                        </div>
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[req.status] || ""}`}>
                                            {req.status.replace("_", " ")}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-white/20 mt-2">
                                        {new Date(req.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Bottom Navigation Bar ── */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/10">
                <div className="max-w-lg mx-auto flex">
                    <a
                        href={`/menu/${hotelSlug}${selectedRoom ? `?room=${selectedRoom}` : ''}`}
                        className="flex-1 flex flex-col items-center gap-0.5 py-3 text-white/40 hover:text-white/80 transition-colors"
                    >
                        <Utensils className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Food Menu</span>
                    </a>
                    <div
                        className="flex-1 flex flex-col items-center gap-0.5 py-3 text-white cursor-default"
                    >
                        <Headset className="w-5 h-5" />
                        <span className="text-[10px] font-semibold">Services</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
