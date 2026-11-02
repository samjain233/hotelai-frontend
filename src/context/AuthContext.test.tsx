import type { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import type { AuthMeProfile } from "@/lib/types";
import { AuthProvider, useAuth } from "./AuthContext";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));
vi.mock("@/lib/api", () => ({ api: { getProfile: vi.fn() } }));

const pathnameMock = vi.mocked(usePathname);
const getProfileMock = vi.mocked(api.getProfile);

const profile = {
    id: "admin-1",
    email: "owner@seaview.in",
    name: "Asha Rao",
    role: "OWNER",
    hotel: { id: "hotel-1", name: "Sea View", slug: "sea-view" },
} as unknown as AuthMeProfile;

function wrapper({ children }: { children: ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>;
}

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

describe("AuthProvider", () => {
    beforeEach(() => {
        getProfileMock.mockReset();
    });

    it("does not fetch the profile on public pages", () => {
        pathnameMock.mockReturnValue("/");
        const { result } = renderHook(() => useAuth(), { wrapper });

        expect(result.current.loading).toBe(false);
        expect(result.current.admin).toBeNull();
        expect(getProfileMock).not.toHaveBeenCalled();
    });

    it("reports loading when navigating client-side from the landing page to an admin page", async () => {
        const pending = deferred<AuthMeProfile>();
        getProfileMock.mockReturnValue(pending.promise);
        pathnameMock.mockReturnValue("/");
        const { result, rerender } = renderHook(() => useAuth(), { wrapper });

        pathnameMock.mockReturnValue("/dashboard");
        rerender();

        // The admin shell redirects to /login when it sees loading=false with no admin.
        expect(result.current.loading).toBe(true);
        expect(result.current.admin).toBeNull();
        expect(getProfileMock).toHaveBeenCalledTimes(1);

        pending.resolve(profile);
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.admin?.email).toBe("owner@seaview.in");
    });

    it("stops loading with no admin when the session is invalid", async () => {
        getProfileMock.mockRejectedValue(new Error("Unauthorized"));
        pathnameMock.mockReturnValue("/dashboard");
        const { result } = renderHook(() => useAuth(), { wrapper });

        expect(result.current.loading).toBe(true);
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.admin).toBeNull();
    });

    it("does not refetch when returning to an admin page after visiting a public one", async () => {
        getProfileMock.mockResolvedValue(profile);
        pathnameMock.mockReturnValue("/dashboard");
        const { result, rerender } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.admin).not.toBeNull());

        pathnameMock.mockReturnValue("/");
        rerender();
        pathnameMock.mockReturnValue("/menu");
        rerender();

        expect(result.current.loading).toBe(false);
        expect(result.current.admin?.email).toBe("owner@seaview.in");
        expect(getProfileMock).toHaveBeenCalledTimes(1);
    });
});
