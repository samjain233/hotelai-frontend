"use client";

import { useEffect, useRef, useState } from "react";
import { Order, ServiceRequest } from "@/lib/types";
import { refreshHotelSession } from "@/lib/api";

/** Default access JWT ~15m; refresh cookies before SSE likely dies on upstream auth checks. */
const PROACTIVE_ACCESS_REFRESH_MS = 8 * 60 * 1000;
/** Debounce burst `error` events from EventSource while connection is unhealthy. */
const ERROR_RECONNECT_DEBOUNCE_MS = 1200;

export type ActivityEventType =
    | "order:new"
    | "order:updated"
    | "service-request:new"
    | "service-request:updated"
    | "ping";

export interface ActivityEvent {
    type: ActivityEventType;
    data: Order | ServiceRequest | { t: number };
}

export interface UseActivityStreamAdminOptions {
    enabled?: boolean;
    onOrderNew?: (order: Order) => void;
    onOrderUpdated?: (order: Order) => void;
    onServiceRequestNew?: (req: ServiceRequest) => void;
    onServiceRequestUpdated?: (req: ServiceRequest) => void;
}

export interface UseActivityStreamGuestOptions {
    hotelSlug: string;
    roomId: string;
    enabled?: boolean;
    onOrderNew?: (order: Order) => void;
    onOrderUpdated?: (order: Order) => void;
    onServiceRequestNew?: (req: ServiceRequest) => void;
    onServiceRequestUpdated?: (req: ServiceRequest) => void;
}

const KNOWN_EVENT_TYPES = new Set<string>([
    "order:new",
    "order:updated",
    "service-request:new",
    "service-request:updated",
    "ping",
]);

function parseEventData(raw: string): ActivityEvent | null {
    try {
        const parsed = JSON.parse(raw) as { type?: string; data?: unknown };

        // If top-level type is a known event type, use it directly
        if (parsed?.type && KNOWN_EVENT_TYPES.has(parsed.type)) {
            return { type: parsed.type as ActivityEventType, data: (parsed.data ?? {}) as ActivityEvent["data"] };
        }

        // Otherwise check if it's wrapped: { data: { type, data } }
        if (parsed?.data && typeof parsed.data === "object") {
            const inner = parsed.data as { type?: string; data?: unknown };
            if (inner.type && KNOWN_EVENT_TYPES.has(inner.type)) {
                return { type: inner.type as ActivityEventType, data: (inner.data ?? {}) as ActivityEvent["data"] };
            }
        }
    } catch {
        // ignore
    }
    return null;
}

export function useActivityStreamAdmin(options: UseActivityStreamAdminOptions = {}) {
    const { enabled = true, onOrderNew, onOrderUpdated, onServiceRequestNew, onServiceRequestUpdated } = options;
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const callbacksRef = useRef({ onOrderNew, onOrderUpdated, onServiceRequestNew, onServiceRequestUpdated });
    callbacksRef.current = { onOrderNew, onOrderUpdated, onServiceRequestNew, onServiceRequestUpdated };

    useEffect(() => {
        if (!enabled) return;

        const cancelledRef = { current: false };
        const esRef = { current: null as EventSource | null };
        const reconnectTimerRef = { current: null as ReturnType<typeof setTimeout> | null };
        const proactiveIntervalRef = { current: null as ReturnType<typeof setInterval> | null };
        /** Avoid overlapping refresh+reconnect pipelines from rapid `error` events. */
        const reconnectingRef = { current: false };

        const clearReconnectTimer = () => {
            if (reconnectTimerRef.current != null) {
                clearTimeout(reconnectTimerRef.current);
                reconnectTimerRef.current = null;
            }
        };

        const wireMessageHandler = (es: EventSource) => {
            es.onmessage = (e: MessageEvent) => {
                const ev = parseEventData(e.data);
                if (!ev) return;
                const {
                    onOrderNew: onNew,
                    onOrderUpdated: onUp,
                    onServiceRequestNew: onReqNew,
                    onServiceRequestUpdated: onReqUp,
                } = callbacksRef.current;
                switch (ev.type) {
                    case "order:new":
                        onNew?.(ev.data as Order);
                        break;
                    case "order:updated":
                        onUp?.(ev.data as Order);
                        break;
                    case "service-request:new":
                        onReqNew?.(ev.data as ServiceRequest);
                        break;
                    case "service-request:updated":
                        onReqUp?.(ev.data as ServiceRequest);
                        break;
                    case "ping":
                        break;
                }
            };
        };

        const openStream = () => {
            if (cancelledRef.current) return;
            reconnectingRef.current = false;
            clearReconnectTimer();
            esRef.current?.close();
            const es = new EventSource("/api/activity/stream");
            esRef.current = es;

            es.onopen = () => {
                setConnected(true);
                setError(null);
            };

            es.onerror = () => {
                if (cancelledRef.current || reconnectingRef.current) return;
                reconnectingRef.current = true;
                setConnected(false);
                es.close();
                if (esRef.current === es) esRef.current = null;

                clearReconnectTimer();
                reconnectTimerRef.current = setTimeout(() => {
                    reconnectTimerRef.current = null;
                    void (async () => {
                        if (cancelledRef.current) {
                            reconnectingRef.current = false;
                            return;
                        }
                        const refreshed = await refreshHotelSession();
                        if (cancelledRef.current) {
                            reconnectingRef.current = false;
                            return;
                        }
                        if (!refreshed) {
                            reconnectingRef.current = false;
                            setError(
                                new Error(
                                    "Live updates disconnected (session expired). Refresh the page or sign in again.",
                                ),
                            );
                            return;
                        }
                        openStream();
                    })();
                }, ERROR_RECONNECT_DEBOUNCE_MS);
            };

            wireMessageHandler(es);
        };

        openStream();

        proactiveIntervalRef.current = setInterval(() => {
            if (!cancelledRef.current) void refreshHotelSession();
        }, PROACTIVE_ACCESS_REFRESH_MS);

        return () => {
            cancelledRef.current = true;
            clearReconnectTimer();
            if (proactiveIntervalRef.current != null) {
                clearInterval(proactiveIntervalRef.current);
                proactiveIntervalRef.current = null;
            }
            esRef.current?.close();
            esRef.current = null;
            reconnectingRef.current = false;
            setConnected(false);
        };
    }, [enabled]);

    return { connected, error };
}

export function useActivityStreamGuest(options: UseActivityStreamGuestOptions) {
    const { hotelSlug, roomId, enabled = true, onOrderNew, onOrderUpdated, onServiceRequestNew, onServiceRequestUpdated } = options;
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const callbacksRef = useRef({ onOrderNew, onOrderUpdated, onServiceRequestNew, onServiceRequestUpdated });
    callbacksRef.current = { onOrderNew, onOrderUpdated, onServiceRequestNew, onServiceRequestUpdated };

    useEffect(() => {
        if (!enabled || !hotelSlug || !roomId) return;

        const es = new EventSource(
            `/api/activity/guest/stream?hotelSlug=${encodeURIComponent(hotelSlug)}&roomId=${encodeURIComponent(roomId)}`
        );

        es.onopen = () => {
            setConnected(true);
            setError(null);
        };

        es.onerror = () => {
            setConnected(false);
            setError(new Error("SSE connection error"));
            // Don't close - EventSource auto-reconnects
        };

        es.onmessage = (e: MessageEvent) => {
            const ev = parseEventData(e.data);
            if (!ev) return;
            const { onOrderNew: onNew, onOrderUpdated: onUp, onServiceRequestNew: onReqNew, onServiceRequestUpdated: onReqUp } = callbacksRef.current;
            switch (ev.type) {
                case "order:new":
                    onNew?.(ev.data as Order);
                    break;
                case "order:updated":
                    onUp?.(ev.data as Order);
                    break;
                case "service-request:new":
                    onReqNew?.(ev.data as ServiceRequest);
                    break;
                case "service-request:updated":
                    onReqUp?.(ev.data as ServiceRequest);
                    break;
                case "ping":
                    break;
            }
        };

        return () => {
            es.close();
            setConnected(false);
        };
    }, [enabled, hotelSlug, roomId]);

    return { connected, error };
}
