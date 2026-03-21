"use client";

import { useEffect, useState, useCallback } from "react";
import { platformApi, PlatformComplaint } from "@/lib/platformApi";
import { MessageSquareWarning, Search, Filter, X } from "lucide-react";

const STATUS_OPTIONS = ["", "SUBMITTED", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "REJECTED"];
const PRIORITY_OPTIONS = ["", "LOW", "NORMAL", "HIGH", "URGENT"];
const TYPE_OPTIONS = ["", "COMPLAINT", "ROOM_SERVICE", "HOUSEKEEPING"];

export default function ComplaintsPage() {
    const [complaints, setComplaints] = useState<PlatformComplaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [showFilters, setShowFilters] = useState(false);

    const fetchComplaints = useCallback(() => {
        setLoading(true);
        const params: Record<string, string> = {};
        if (statusFilter) params.status = statusFilter;
        if (priorityFilter) params.priority = priorityFilter;
        if (typeFilter) params.type = typeFilter;

        platformApi
            .getComplaints(Object.keys(params).length > 0 ? params : undefined)
            .then(setComplaints)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [statusFilter, priorityFilter, typeFilter]);

    useEffect(() => {
        fetchComplaints();
    }, [fetchComplaints]);

    const q = search.toLowerCase();
    const filtered = complaints.filter(
        (c) =>
            (c.description || "").toLowerCase().includes(q) ||
            (c.guestName || "").toLowerCase().includes(q) ||
            c.hotel.name.toLowerCase().includes(q)
    );

    const activeFilterCount = [statusFilter, priorityFilter, typeFilter].filter(Boolean).length;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Service Requests & Complaints</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Cross-hotel view of all service requests.
                </p>
            </div>

            {/* Search + Filter Toggle */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by description, guest, or hotel..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                    />
                </div>
                <button
                    onClick={() => setShowFilters((v) => !v)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition ${
                        showFilters || activeFilterCount > 0
                            ? "border-primary/40 bg-primary/5 text-primary"
                            : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                >
                    <Filter className="w-4 h-4" />
                    Filters
                    {activeFilterCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                            {activeFilterCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Filter Row */}
            {showFilters && (
                <div className="flex flex-wrap gap-3 items-end p-4 rounded-xl border border-border bg-card/50">
                    <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
                    <FilterSelect label="Priority" value={priorityFilter} onChange={setPriorityFilter} options={PRIORITY_OPTIONS} />
                    <FilterSelect label="Type" value={typeFilter} onChange={setTypeFilter} options={TYPE_OPTIONS} />
                    {activeFilterCount > 0 && (
                        <button
                            onClick={() => { setStatusFilter(""); setPriorityFilter(""); setTypeFilter(""); }}
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition"
                        >
                            <X className="w-3 h-3" /> Clear all
                        </button>
                    )}
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="dashboard-card p-4 h-20 animate-pulse bg-secondary/30" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                    <MessageSquareWarning className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-muted-foreground">No complaints found.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((c) => (
                        <div key={c.id} className="dashboard-card p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <StatusBadge status={c.status} />
                                        <PriorityBadge priority={c.priority} />
                                        <span className="text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 rounded">
                                            {c.type}
                                        </span>
                                    </div>
                                    <p className="text-sm text-foreground line-clamp-2">{c.description}</p>
                                    <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-muted-foreground">
                                        <span className="font-medium text-foreground/80">{c.hotel.name}</span>
                                        {c.room && <span>Room {c.room.number}</span>}
                                        {c.guestName && <span>Guest: {c.guestName}</span>}
                                        {c.category && <span>{c.category}</span>}
                                    </div>
                                </div>
                                <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                                    {new Date(c.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function FilterSelect({ label, value, onChange, options }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: string[];
}) {
    return (
        <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            >
                {options.map((o) => (
                    <option key={o} value={o}>
                        {o || `All ${label}`}
                    </option>
                ))}
            </select>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        SUBMITTED: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
        ACKNOWLEDGED: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
        IN_PROGRESS: "bg-blue-500/10 text-blue-600 border-blue-500/20",
        RESOLVED: "bg-green-500/10 text-green-600 border-green-500/20",
        REJECTED: "bg-red-500/10 text-red-600 border-red-500/20",
    };
    return (
        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${colors[status] || "bg-secondary text-muted-foreground border-border"}`}>
            {status}
        </span>
    );
}

function PriorityBadge({ priority }: { priority: string }) {
    const colors: Record<string, string> = {
        LOW: "text-muted-foreground",
        NORMAL: "text-yellow-600",
        HIGH: "text-orange-600",
        URGENT: "text-red-600",
    };
    return (
        <span className={`text-[10px] font-bold ${colors[priority] || "text-muted-foreground"}`}>
            {priority}
        </span>
    );
}
