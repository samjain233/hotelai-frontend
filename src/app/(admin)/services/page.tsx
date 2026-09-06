"use client";

import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import { api } from "@/lib/api";
import { useActivityStreamAdmin } from "@/hooks/useActivityStream";
import {
    ServiceRequest,
    ServiceRequestStatus,
    ServiceRequestType,
} from "@/lib/types";

import { motion, AnimatePresence } from "framer-motion";

import {
    AlertTriangle,
    CheckCircle,
    Clock,
    Eye,
    MessageSquare,
    Play,
    RefreshCw,
    XCircle,
    Headset,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { OrdersSkeleton } from "@/components/ui/Skeleton";


// ─── Kanban Columns ───────────────────────────────────────

type ColumnKey =
    | "SUBMITTED"
    | "ACKNOWLEDGED"
    | "IN_PROGRESS"
    | "RESOLVED";

const COLUMNS: {
    status: ColumnKey;
    title: string;
    icon: typeof MessageSquare;
    color: string;
    border: string;
    headerBg: string;
}[] = [
    {
        status: "SUBMITTED",
        title: "New Requests",
        icon: MessageSquare,
        color: "bg-blue-500",
        border: "border-l-blue-500",
        headerBg: "bg-blue-500/10",
    },
    {
        status: "ACKNOWLEDGED",
        title: "Acknowledged",
        icon: Eye,
        color: "bg-indigo-500",
        border: "border-l-indigo-500",
        headerBg: "bg-indigo-500/10",
    },
    {
        status: "IN_PROGRESS",
        title: "In Progress",
        icon: Play,
        color: "bg-amber-500",
        border: "border-l-amber-500",
        headerBg: "bg-amber-500/10",
    },
    {
        status: "RESOLVED",
        title: "Resolved",
        icon: CheckCircle,
        color: "bg-emerald-500",
        border: "border-l-emerald-500",
        headerBg: "bg-emerald-500/10",
    },
];


// ─── Status Styling ───────────────────────────────────────

const STATUS_CONFIG: Record<
    ServiceRequestStatus,
    {
        color: string;
        bg: string;
        border: string;
    }
> = {
    SUBMITTED: {
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-l-blue-500",
    },

    ACKNOWLEDGED: {
        color: "text-indigo-400",
        bg: "bg-indigo-500/10",
        border: "border-l-indigo-500",
    },

    IN_PROGRESS: {
        color: "text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-l-amber-500",
    },

    RESOLVED: {
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-l-emerald-500",
    },

    REJECTED: {
        color: "text-red-400",
        bg: "bg-red-500/10",
        border: "border-l-red-500",
    },
};


const PRIORITY_COLORS: Record<string, string> = {
    LOW: "text-muted-foreground bg-secondary",
    NORMAL: "text-blue-500 bg-blue-500/10",
    HIGH: "text-amber-500 bg-amber-500/10",
    URGENT: "text-red-500 bg-red-500/10",
};


// ─── Type Styling ──────────────────────────────────────────

const TYPE_CONFIG: Record<
    ServiceRequestType,
    {
        label: string;
        icon: typeof AlertTriangle;
    }
> = {
    COMPLAINT: {
        label: "COMPLAINT",
        icon: AlertTriangle,
    },

    SERVICE: {
        label: "SERVICE",
        icon: Headset,
    },
};


// ─── Audio Alert ──────────────────────────────────────────

function playAlertSound(priority: string) {
    try {
        const ctx = new (
            window.AudioContext ||
            (window as any).webkitAudioContext
        )();

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        const freq = priority === "URGENT" ? 880 : 660;

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(
            freq,
            ctx.currentTime,
        );

        gainNode.gain.setValueAtTime(
            0.3,
            ctx.currentTime,
        );

        gainNode.gain.exponentialRampToValueAtTime(
            0.001,
            ctx.currentTime + 0.4,
        );

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.4);

        if (priority === "URGENT") {
            const o2 = ctx.createOscillator();
            const g2 = ctx.createGain();

            o2.connect(g2);
            g2.connect(ctx.destination);

            o2.type = "sine";

            o2.frequency.setValueAtTime(
                1046,
                ctx.currentTime + 0.5,
            );

            g2.gain.setValueAtTime(
                0.3,
                ctx.currentTime + 0.5,
            );

            g2.gain.exponentialRampToValueAtTime(
                0.001,
                ctx.currentTime + 0.9,
            );

            o2.start(ctx.currentTime + 0.5);
            o2.stop(ctx.currentTime + 0.9);
        }
    } catch {
        // Audio unavailable — ignore.
    }
}


// ─── Page ─────────────────────────────────────────────────

export default function AdminServicesPage() {
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(Date.now());

    const prevRequestIdsRef = useRef<Set<string>>(new Set());


    // ─── Live Clock ─────────────────────────────────────────

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);

        return () => clearInterval(interval);
    }, []);


    // ─── Load Requests ─────────────────────────────────────

    const loadRequests = useCallback(async () => {
        try {
            /*
             * IMPORTANT:
             * Do NOT pass a type filter here.
             *
             * We want all COMPLAINT + SERVICE requests in one
             * dataset so the Kanban columns and counts remain
             * independent of filtering.
             */
            const data = await api.getServiceRequests();

            setRequests(data);

            // Detect new high-priority requests.
            const currentIds = new Set(
                data.map((request) => request.id),
            );

            const previousIds = prevRequestIdsRef.current;

            for (const request of data) {
                if (
                    !previousIds.has(request.id) &&
                    (
                        request.priority === "URGENT" ||
                        request.priority === "HIGH"
                    )
                ) {
                    playAlertSound(request.priority);
                }
            }

            prevRequestIdsRef.current = currentIds;
        } catch (error) {
            console.error(
                "Failed to load service requests:",
                error,
            );
        } finally {
            setLoading(false);
        }
    }, []);


    useEffect(() => {
        void loadRequests();
    }, [loadRequests]);


    // ─── Real-time Updates ─────────────────────────────────

    useActivityStreamAdmin({
        onServiceRequestNew: (request) => {
            setRequests((previous) => {
                if (
                    previous.some(
                        (item) => item.id === request.id,
                    )
                ) {
                    return previous;
                }

                return [request, ...previous];
            });

            if (
                request.priority === "URGENT" ||
                request.priority === "HIGH"
            ) {
                playAlertSound(request.priority);
            }
        },

        onServiceRequestUpdated: (request) => {
            setRequests((previous) => {
                const exists = previous.some(
                    (item) => item.id === request.id,
                );

                if (exists) {
                    return previous.map((item) =>
                        item.id === request.id
                            ? request
                            : item,
                    );
                }

                return [request, ...previous];
            });
        },
    });


    // ─── Status Transition ─────────────────────────────────

    async function updateStatus(
        id: string,
        status: ServiceRequestStatus,
    ) {
        setUpdatingId(id);

        try {
            await api.updateServiceRequestStatus(
                id,
                status,
            );

            // Optimistic update.
            setRequests((previous) =>
                previous.map((request) =>
                    request.id === id
                        ? {
                              ...request,
                              status,
                          }
                        : request,
                ),
            );
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Failed to update request";

            alert(message);

            // Reload to restore server state.
            await loadRequests();
        } finally {
            setUpdatingId(null);
        }
    }


    // ─── Helpers ────────────────────────────────────────────

    function getElapsedMinutes(createdAt: string) {
        return Math.floor(
            (
                currentTime -
                new Date(createdAt).getTime()
            ) / 60000,
        );
    }


    function formatElapsed(createdAt: string) {
        const minutes = getElapsedMinutes(createdAt);

        if (minutes < 1) {
            return "Just now";
        }

        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        if (hours > 0) {
            return `${hours}h ${remainingMinutes}m`;
        }

        return `${remainingMinutes}m`;
    }


    function getUrgencyColor(createdAt: string) {
        const minutes = getElapsedMinutes(createdAt);

        if (minutes >= 20) {
            return "text-red-400 bg-red-500/10";
        }

        if (minutes >= 10) {
            return "text-amber-400 bg-amber-500/10";
        }

        return "text-emerald-400 bg-emerald-500/10";
    }


    function getUrgencyBorder(createdAt: string) {
        const minutes = getElapsedMinutes(createdAt);

        if (minutes >= 20) {
            return "ring-2 ring-red-500/30";
        }

        if (minutes >= 10) {
            return "ring-1 ring-amber-500/20";
        }

        return "";
    }


    function getNextAction(
        status: ServiceRequestStatus,
    ): {
        label: string;
        next: ServiceRequestStatus;
        icon: typeof CheckCircle;
        variant: "primary" | "secondary";
    } | null {
        switch (status) {
            case "SUBMITTED":
                return {
                    label: "Acknowledge",
                    next: "ACKNOWLEDGED",
                    icon: Eye,
                    variant: "secondary",
                };

            case "ACKNOWLEDGED":
                return {
                    label: "Start Working",
                    next: "IN_PROGRESS",
                    icon: Play,
                    variant: "secondary",
                };

            case "IN_PROGRESS":
                return {
                    label: "Mark Resolved",
                    next: "RESOLVED",
                    icon: CheckCircle,
                    variant: "primary",
                };

            default:
                return null;
        }
    }


    if (loading) {
        return <OrdersSkeleton />;
    }


    // ─── Counts ─────────────────────────────────────────────

    const activeRequests = requests.filter(
        (request) =>
            !["RESOLVED", "REJECTED"].includes(
                request.status,
            ),
    );

    const resolvedRequests = requests.filter(
        (request) =>
            ["RESOLVED", "REJECTED"].includes(
                request.status,
            ),
    );

    const totalActive = activeRequests.length;


    return (
        <div className="space-y-6">


            {/* Header */}

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Guest Services
                    </h1>

                    <p className="text-muted-foreground mt-1">
                        {totalActive} active request
                        {totalActive !== 1 ? "s" : ""}
                        {" · "}
                        Live updates
                    </p>
                </div>


                <Button
                    variant="outline"
                    onClick={() => void loadRequests()}
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>


            {/* Kanban Board */}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">


                {COLUMNS.map((column) => {
                    const Icon = column.icon;

                    /*
                     * Resolved column also displays rejected
                     * requests as completed history.
                     */
                    const columnRequests =
                        column.status === "RESOLVED"
                            ? requests.filter(
                                  (request) =>
                                      request.status ===
                                          "RESOLVED" ||
                                      request.status ===
                                          "REJECTED",
                              )
                            : requests.filter(
                                  (request) =>
                                      request.status ===
                                      column.status,
                              );


                    return (
                        <div
                            key={column.status}
                            className="flex flex-col min-h-[500px] bg-secondary/20 rounded-xl border border-border overflow-hidden"
                        >


                            {/* Column Header */}

                            <div
                                className={cn(
                                    "px-4 py-3 border-b border-border flex justify-between items-center",
                                    column.headerBg,
                                )}
                            >
                                <div className="flex items-center gap-2">

                                    <div
                                        className={cn(
                                            "w-7 h-7 rounded-lg flex items-center justify-center",
                                            column.color,
                                        )}
                                    >
                                        <Icon className="w-4 h-4 text-foreground" />
                                    </div>

                                    <span className="font-bold text-sm text-foreground">
                                        {column.title}
                                    </span>

                                </div>


                                <span
                                    className={cn(
                                        "text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center",

                                        columnRequests.length > 0
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "bg-secondary text-muted-foreground border border-border",
                                    )}
                                >
                                    {columnRequests.length}
                                </span>
                            </div>


                            {/* Request List */}

                            <div className="flex-1 overflow-y-auto p-3 space-y-3">

                                <AnimatePresence>

                                    {columnRequests.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/30">

                                            <Icon className="w-9 h-9 mb-2" />

                                            <p className="text-xs">
                                                No requests
                                            </p>

                                        </div>
                                    )}


                                    {columnRequests.map((request) => {
                                        const statusConfig =
                                            STATUS_CONFIG[
                                                request.status
                                            ];

                                        const typeConfig =
                                            TYPE_CONFIG[
                                                request.type
                                            ];

                                        const TypeIcon =
                                            typeConfig.icon;

                                        const action =
                                            getNextAction(
                                                request.status,
                                            );

                                        const ActionIcon =
                                            action?.icon ??
                                            CheckCircle;

                                        const elapsed =
                                            getElapsedMinutes(
                                                request.createdAt,
                                            );

                                        const urgencyColor =
                                            getUrgencyColor(
                                                request.createdAt,
                                            );

                                        const urgencyBorder =
                                            getUrgencyBorder(
                                                request.createdAt,
                                            );


                                        return (
                                            <motion.div
                                                key={request.id}
                                                layout
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.95,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                }}
                                                exit={{
                                                    opacity: 0,
                                                    x: 50,
                                                }}
                                                className={cn(
                                                    "bg-card border-l-4 rounded-r-lg p-4 shadow-sm",
                                                    statusConfig.border,

                                                    request.status !== "RESOLVED" &&
                                                        request.status !== "REJECTED" &&
                                                        urgencyBorder,

                                                    request.status !== "RESOLVED" &&
                                                        request.status !== "REJECTED" &&
                                                        elapsed >= 20 &&
                                                        "animate-pulse",

                                                    request.status === "REJECTED" &&
                                                        "opacity-60",
                                                )}
                                            >


                                                {/* Request Header */}

                                                <div className="flex justify-between items-start gap-2 mb-3">

                                                    <div className="min-w-0">

                                                        <div className="flex items-center gap-2 flex-wrap">

                                                            <span className="font-bold text-foreground text-base">
                                                                {request.category}
                                                            </span>

                                                        </div>

                                                    </div>


                                                    <div
                                                        className={cn(
                                                            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold shrink-0",
                                                            urgencyColor,
                                                        )}
                                                    >
                                                        {elapsed >= 20 &&
                                                        request.status !== "RESOLVED" &&
                                                        request.status !== "REJECTED" && (
                                                            <AlertTriangle className="w-3 h-3" />
                                                        )}

                                                        <Clock className="w-3 h-3" />

                                                        {formatElapsed(
                                                            request.createdAt,
                                                        )}
                                                    </div>

                                                </div>


                                                {/* Complaint / Service Badge */}

                                                <div className="flex items-center gap-2 mb-3">

                                                    <span
                                                        className={cn(
                                                            "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold border",
                                                            request.type ===
                                                                "COMPLAINT"
                                                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                                                : "bg-purple-500/10 text-purple-400 border-purple-500/20",
                                                        )}
                                                    >
                                                        <TypeIcon className="w-3 h-3" />

                                                        {
                                                            typeConfig.label
                                                        }
                                                    </span>


                                                    <span
                                                        className={cn(
                                                            "text-[10px] font-semibold px-2 py-1 rounded-full",
                                                            statusConfig.bg,
                                                            statusConfig.color,
                                                        )}
                                                    >
                                                        {request.status.replace(
                                                            "_",
                                                            " ",
                                                        )}
                                                    </span>


                                                    {request.priority !==
                                                        "NORMAL" && (
                                                        <span
                                                            className={cn(
                                                                "text-[10px] font-semibold px-2 py-1 rounded-full",
                                                                PRIORITY_COLORS[
                                                                    request
                                                                        .priority
                                                                ],
                                                            )}
                                                        >
                                                            {
                                                                request.priority
                                                            }
                                                        </span>
                                                    )}

                                                </div>


                                                {/* Room */}

                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">

                                                    <span className="font-semibold">
                                                        Room{" "}
                                                        {
                                                            request.room
                                                                ?.number
                                                        }
                                                    </span>

                                                    {request.guestName && (
                                                        <>
                                                            <span>·</span>

                                                            <span>
                                                                {
                                                                    request.guestName
                                                                }
                                                            </span>
                                                        </>
                                                    )}

                                                </div>


                                                {/* Description */}

                                                {request.description && (
                                                    <div className="bg-secondary/50 rounded-lg px-3 py-2 mb-3">

                                                        <p className="text-sm text-muted-foreground italic">
                                                            &ldquo;
                                                            {
                                                                request.description
                                                            }
                                                            &rdquo;
                                                        </p>

                                                    </div>
                                                )}


                                                {/* Actions */}

                                                {request.status !==
                                                    "RESOLVED" &&
                                                    request.status !==
                                                        "REJECTED" && (

                                                        <div className="flex gap-2">

                                                            {action && (
                                                                <Button
                                                                    size="sm"
                                                                    variant={
                                                                        action.variant
                                                                    }
                                                                    disabled={
                                                                        updatingId ===
                                                                        request.id
                                                                    }
                                                                    loading={
                                                                        updatingId ===
                                                                        request.id
                                                                    }
                                                                    onClick={() =>
                                                                        void updateStatus(
                                                                            request.id,
                                                                            action.next,
                                                                        )
                                                                    }
                                                                    className="flex-1"
                                                                >
                                                                    <ActionIcon className="w-3.5 h-3.5 mr-1.5" />

                                                                    {
                                                                        action.label
                                                                    }

                                                                    {" →"}
                                                                </Button>
                                                            )}


                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                disabled={
                                                                    updatingId ===
                                                                    request.id
                                                                }
                                                                onClick={() =>
                                                                    void updateStatus(
                                                                        request.id,
                                                                        "REJECTED",
                                                                    )
                                                                }
                                                                className="text-destructive hover:bg-destructive/10 px-3"
                                                                title="Reject request"
                                                            >
                                                                <XCircle className="w-3.5 h-3.5" />
                                                            </Button>

                                                        </div>
                                                    )}


                                                {/* Rejected Label */}

                                                {request.status ===
                                                    "REJECTED" && (
                                                    <div className="flex items-center gap-2 text-xs text-red-400">
                                                        <XCircle className="w-3.5 h-3.5" />

                                                        Request rejected
                                                    </div>
                                                )}

                                            </motion.div>
                                        );
                                    })}

                                </AnimatePresence>

                            </div>

                        </div>
                    );
                })}

            </div>


            {/* Summary */}

            {requests.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">

                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />

                    <p className="text-lg font-medium">
                        No service requests
                    </p>

                    <p className="text-sm">
                        Requests from guests will appear here in real-time
                    </p>

                </div>
            )}

        </div>
    );
}