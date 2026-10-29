import { createElement, type ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError, swrFetcher } from "@/lib/api";
import { useActivityStreamGuest } from "@/hooks/useActivityStream";
import { isStayVerified, markStayVerified } from "@/lib/staySession";
import type { CartItem, MenuItem, Order } from "@/lib/types";
import { useGuestOrdering } from "./useGuestOrdering";

vi.mock("@/lib/api", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/lib/api")>();
    return { ...actual, api: { placeOrder: vi.fn() }, swrFetcher: vi.fn() };
});
vi.mock("@/hooks/useActivityStream", () => ({ useActivityStreamGuest: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

type Args = Parameters<typeof useGuestOrdering>[0];

const ROOM = "room-101";
const placeOrderMock = vi.mocked(api.placeOrder);
const fetcherMock = vi.mocked(swrFetcher);
const streamMock = vi.mocked(useActivityStreamGuest);

const paneer: MenuItem = {
    id: "paneer-tikka",
    name: "Paneer Tikka",
    price: 250,
    categoryId: "starters",
    hotelId: "hotel-1",
    createdAt: "2026-10-01T00:00:00.000Z",
};
const cartWithPaneer: CartItem[] = [{ item: paneer, quantity: 2 }];

function makeOrder(overrides: Partial<Order> = {}): Order {
    return {
        id: "order-1",
        orderNumber: 42,
        roomId: ROOM,
        hotelId: "hotel-1",
        status: "PLACED",
        totalAmount: 500,
        items: [],
        createdAt: "2026-10-29T08:00:00.000Z",
        updatedAt: "2026-10-29T08:00:00.000Z",
        ...overrides,
    };
}

/** Fresh SWR cache per test so past orders never leak between cases. */
function wrapper({ children }: { children: ReactNode }) {
    return createElement(SWRConfig, { value: { provider: () => new Map(), dedupingInterval: 0 } }, children);
}

function renderOrdering(overrides: Partial<Args> = {}) {
    const props: Args = {
        hotelSlug: "sea-view",
        resolvedRoomId: ROOM,
        isOpen: true,
        digitalOrderingEnabled: true,
        serviceRequestsEnabled: false,
        stayVerified: isStayVerified(overrides.resolvedRoomId ?? ROOM),
        cart: cartWithPaneer,
        clearCart: vi.fn(),
        ...overrides,
    };
    const hook = renderHook((p: Args) => useGuestOrdering(p), { initialProps: props, wrapper });
    return { ...hook, props };
}

/** What `StayPinModal` does on a correct PIN: remember the stay, then hand back to the hook. */
async function enterCorrectPin(result: { current: ReturnType<typeof useGuestOrdering> }) {
    markStayVerified(ROOM);
    await act(async () => {
        result.current.onPinVerified();
    });
}

function lastStreamOptions() {
    const options = streamMock.mock.lastCall?.[0];
    if (!options) throw new Error("useActivityStreamGuest was never called");
    return options;
}

beforeEach(() => {
    fetcherMock.mockResolvedValue([]);
    placeOrderMock.mockResolvedValue(makeOrder());
    vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("PIN prompt purposes", () => {
    it("prompts with SCAN once per room when the stay isn't verified", () => {
        const { result, rerender, props } = renderOrdering();
        expect(result.current.showPinModal).toBe(true);
        expect(result.current.pinModalPurpose).toBe("SCAN");

        act(() => result.current.setShowPinModal(false));
        rerender({ ...props });
        expect(result.current.showPinModal).toBe(false);

        rerender({ ...props, resolvedRoomId: "room-102" });
        expect(result.current.showPinModal).toBe(true);
        expect(result.current.pinModalPurpose).toBe("SCAN");
    });

    it("does not prompt on scan for a verified stay or a view-only hotel", () => {
        markStayVerified(ROOM);
        expect(renderOrdering().result.current.showPinModal).toBe(false);

        localStorage.clear();
        const viewOnly = renderOrdering({ digitalOrderingEnabled: false, serviceRequestsEnabled: false });
        expect(viewOnly.result.current.showPinModal).toBe(false);
    });

    it("SCAN: a correct PIN only closes the modal and never places an order", async () => {
        const { result } = renderOrdering();
        expect(result.current.pinModalPurpose).toBe("SCAN");

        await enterCorrectPin(result);

        expect(result.current.showPinModal).toBe(false);
        expect(placeOrderMock).not.toHaveBeenCalled();
    });

    it("ORDER: ordering unverified asks for the PIN, then submits the cart", async () => {
        const { result, props } = renderOrdering();
        act(() => result.current.setShowPinModal(false));

        act(() => result.current.initiateOrder());
        expect(result.current.showPinModal).toBe(true);
        expect(result.current.pinModalPurpose).toBe("ORDER");
        expect(placeOrderMock).not.toHaveBeenCalled();

        await enterCorrectPin(result);

        expect(placeOrderMock).toHaveBeenCalledWith({
            roomId: ROOM,
            items: [{ itemId: "paneer-tikka", quantity: 2 }],
            notes: undefined,
            guestName: undefined,
            idempotencyKey: expect.any(String),
        });
        await waitFor(() => expect(result.current.order?.id).toBe("order-1"));
        expect(props.clearCart).toHaveBeenCalledOnce();
        expect(result.current.showPinModal).toBe(false);
        expect(result.current.showCart).toBe(false);
        expect(result.current.placing).toBe(false);
        expect(toast.success).toHaveBeenCalledWith("Order #42 placed successfully!");
    });

    it("BILL: opening the bill unverified asks for the PIN, then opens the history", async () => {
        const { result } = renderOrdering();
        act(() => result.current.setShowPinModal(false));

        act(() => result.current.openRoomBill());
        expect(result.current.showPinModal).toBe(true);
        expect(result.current.pinModalPurpose).toBe("BILL");

        await enterCorrectPin(result);

        expect(result.current.showHistory).toBe(true);
        expect(placeOrderMock).not.toHaveBeenCalled();
    });

    it("BILL: a verified stay opens the history directly", () => {
        markStayVerified(ROOM);
        const { result } = renderOrdering();
        act(() => result.current.openRoomBill());
        expect(result.current.showPinModal).toBe(false);
        expect(result.current.showHistory).toBe(true);
    });

    it("asks for the room first when ordering without one", () => {
        const { result } = renderOrdering({ resolvedRoomId: "" });
        act(() => result.current.setShowCart(true));
        act(() => result.current.initiateOrder());
        expect(result.current.showRoomModal).toBe(true);
        expect(result.current.showCart).toBe(false);
        expect(result.current.showPinModal).toBe(false);
    });

    it("confirming a room while the kitchen is closed reopens the cart instead of ordering", () => {
        markStayVerified(ROOM);
        const { result } = renderOrdering({ isOpen: false });
        act(() => result.current.setShowRoomModal(true));
        act(() => result.current.confirmRoomFromModal());
        expect(result.current.showRoomModal).toBe(false);
        expect(result.current.showCart).toBe(true);
        expect(placeOrderMock).not.toHaveBeenCalled();
    });
});

describe("placeOrder guards", () => {
    it("never sends an empty cart, even when a PIN for ORDER comes back", async () => {
        const { result } = renderOrdering({ cart: [] });
        act(() => result.current.setPinModalPurpose("ORDER"));

        await enterCorrectPin(result);
        await act(async () => {
            await result.current.placeOrder();
        });

        expect(placeOrderMock).not.toHaveBeenCalled();
        expect(toast.error).not.toHaveBeenCalled();
    });

    it("does not order while the hotel is closed", async () => {
        markStayVerified(ROOM);
        const { result } = renderOrdering({ isOpen: false });
        await act(async () => {
            await result.current.placeOrder();
        });
        expect(placeOrderMock).not.toHaveBeenCalled();
    });

    it("reuses the idempotency key on a retry and rotates it after success", async () => {
        markStayVerified(ROOM);
        placeOrderMock.mockRejectedValueOnce(new ApiError("Internal error", 500));
        const { result } = renderOrdering();

        await act(async () => result.current.placeOrder());
        await act(async () => result.current.placeOrder());
        await act(async () => result.current.placeOrder());

        const keys = placeOrderMock.mock.calls.map(([body]) => body.idempotencyKey);
        expect(keys).toHaveLength(3);
        expect(keys[1]).toBe(keys[0]);
        expect(keys[2]).not.toBe(keys[1]);
    });
});

describe("stay access errors", () => {
    it.each(["ROOM_VACANT", "STAY_UNVERIFIED"])("%s clears the verified flag and re-prompts for ORDER", async (code) => {
        markStayVerified(ROOM);
        placeOrderMock.mockRejectedValueOnce(new ApiError("This room has been checked out.", 403, code));
        const { result, props } = renderOrdering();
        expect(result.current.showPinModal).toBe(false);

        await act(async () => result.current.initiateOrder());

        await waitFor(() => expect(result.current.placing).toBe(false));
        expect(isStayVerified(ROOM)).toBe(false);
        expect(result.current.showPinModal).toBe(true);
        expect(result.current.pinModalPurpose).toBe("ORDER");
        expect(props.clearCart).not.toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalledWith("This room has been checked out.");
    });

    it("a server error keeps the stay and shows a generic message", async () => {
        markStayVerified(ROOM);
        placeOrderMock.mockRejectedValueOnce(new ApiError("database timeout", 500));
        const { result } = renderOrdering();

        await act(async () => result.current.initiateOrder());

        await waitFor(() => expect(result.current.placing).toBe(false));
        expect(isStayVerified(ROOM)).toBe(true);
        expect(result.current.showPinModal).toBe(false);
        expect(toast.error).toHaveBeenCalledWith("We couldn't place your order. Please try again.");
    });
});

describe("past orders and live updates", () => {
    it("loads nothing and keeps the stream off until the stay is verified", () => {
        renderOrdering();
        expect(fetcherMock).not.toHaveBeenCalled();
        expect(lastStreamOptions()).toMatchObject({ hotelSlug: "sea-view", roomId: ROOM, enabled: false });
    });

    it("loads the room's orders and enables the stream for a verified stay", async () => {
        markStayVerified(ROOM);
        fetcherMock.mockResolvedValue([makeOrder()]);
        const { result } = renderOrdering();

        await waitFor(() => expect(result.current.pastOrders).toHaveLength(1));
        expect(fetcherMock).toHaveBeenCalledWith(`/guest/rooms/${ROOM}/orders`);
        expect(lastStreamOptions().enabled).toBe(true);
    });

    it("merges an SSE update into the list without refetching", async () => {
        markStayVerified(ROOM);
        fetcherMock.mockResolvedValue([makeOrder(), makeOrder({ id: "order-2", orderNumber: 43 })]);
        const { result } = renderOrdering();
        await waitFor(() => expect(result.current.pastOrders).toHaveLength(2));

        await act(async () => lastStreamOptions().onOrderUpdated?.(makeOrder({ status: "PREPARING" })));

        expect(result.current.pastOrders.map((o) => [o.id, o.status])).toEqual([
            ["order-1", "PREPARING"],
            ["order-2", "PLACED"],
        ]);
        expect(fetcherMock).toHaveBeenCalledOnce();
    });

    it("appends an SSE update for an order the list hasn't seen", async () => {
        markStayVerified(ROOM);
        fetcherMock.mockResolvedValue([makeOrder()]);
        const { result } = renderOrdering();
        await waitFor(() => expect(result.current.pastOrders).toHaveLength(1));

        await act(async () => lastStreamOptions().onOrderUpdated?.(makeOrder({ id: "order-9", orderNumber: 50 })));

        expect(result.current.pastOrders.map((o) => o.id)).toEqual(["order-1", "order-9"]);
    });

    it("refetches the list when the stream reports a new order", async () => {
        markStayVerified(ROOM);
        const { result } = renderOrdering();
        await waitFor(() => expect(fetcherMock).toHaveBeenCalledOnce());

        await act(async () => lastStreamOptions().onOrderNew?.(makeOrder()));

        expect(fetcherMock).toHaveBeenCalledTimes(2);
        expect(result.current.pastOrders).toEqual([]);
    });

    it("the confirmation screen follows kitchen status changes for the placed order", async () => {
        markStayVerified(ROOM);
        const { result } = renderOrdering();
        await waitFor(() => expect(fetcherMock).toHaveBeenCalledOnce());

        fetcherMock.mockResolvedValue([makeOrder()]);
        await act(async () => result.current.placeOrder());
        await waitFor(() => expect(result.current.pastOrders).toHaveLength(1));
        expect(result.current.order?.status).toBe("PLACED");

        await act(async () => lastStreamOptions().onOrderUpdated?.(makeOrder({ status: "READY" })));

        expect(result.current.order?.status).toBe("READY");
    });

    it("the room bill total skips cancelled orders", async () => {
        markStayVerified(ROOM);
        fetcherMock.mockResolvedValue([
            makeOrder({ totalAmount: 250 }),
            makeOrder({ id: "order-2", totalAmount: "120.50" }),
            makeOrder({ id: "order-3", totalAmount: 999, status: "CANCELLED" }),
        ]);
        const { result } = renderOrdering();

        await waitFor(() => expect(result.current.pastOrders).toHaveLength(3));
        expect(result.current.roomBillGrandTotal).toBe(370.5);
    });
});
