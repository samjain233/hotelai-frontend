import { readdirSync } from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { getRedirectUrl, unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { describe, expect, it } from "vitest";
import { config, proxy } from "./proxy";

const ORIGIN = "http://localhost:3000";

function request(path: string, cookies: Record<string, string> = {}) {
    const cookie = Object.entries(cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join("; ");
    return new NextRequest(`${ORIGIN}${path}`, { headers: cookie ? { cookie } : {} });
}

function matches(path: string) {
    return unstable_doesMiddlewareMatch({ config, url: `${ORIGIN}${path}` });
}

/** Routes of every `page.tsx` under `src/app/(admin)`, e.g. `/menu/availability`. */
function adminPageRoutes() {
    const dir = path.join(process.cwd(), "src/app/(admin)");
    return readdirSync(dir, { recursive: true, encoding: "utf8" })
        .filter((file) => file === "page.tsx" || file.endsWith("/page.tsx"))
        .map((file) => `/${file.slice(0, -"/page.tsx".length)}`);
}

describe("proxy", () => {
    it("redirects to /login when there is no session cookie", () => {
        const res = proxy(request("/dashboard"));
        expect(res.status).toBe(307);
        expect(getRedirectUrl(res)).toBe(`${ORIGIN}/login`);
    });

    it("remembers the requested page so sign-in returns there", () => {
        const res = proxy(request("/rooms?floor=2"));
        expect(getRedirectUrl(res)).toBe(`${ORIGIN}/login?next=${encodeURIComponent("/rooms?floor=2")}`);
    });

    it.each(["auth_token", "auth_refresh"])("lets the request through with only %s", (name) => {
        const res = proxy(request("/dashboard", { [name]: "jwt" }));
        expect(getRedirectUrl(res)).toBeNull();
        expect(res.headers.get("x-middleware-next")).toBe("1");
    });

    it("treats an empty cookie as signed out", () => {
        expect(getRedirectUrl(proxy(request("/dashboard", { auth_token: "" })))).toBe(`${ORIGIN}/login`);
    });
});

describe("proxy matcher", () => {
    it("covers every admin page", () => {
        const routes = adminPageRoutes();
        expect(routes.length).toBeGreaterThan(0);
        for (const route of routes) expect(matches(route), route).toBe(true);
    });

    it.each([
        "/",
        "/login",
        "/register",
        "/staff/access",
        "/menu/sea-view",
        "/services/sea-view",
        "/superadmin/hotels",
        "/api/auth/me",
        "/terms",
    ])("does not run on %s", (path) => {
        expect(matches(path)).toBe(false);
    });
});
