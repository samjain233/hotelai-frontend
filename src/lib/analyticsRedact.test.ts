import { describe, expect, it } from "vitest";
import { redactSensitiveUrl } from "./analyticsRedact";

describe("redactSensitiveUrl", () => {
    it("removes reset and verification tokens", () => {
        expect(redactSensitiveUrl("https://dreamcanvas.in/reset-password?token=abc123")).toBe(
            "https://dreamcanvas.in/reset-password",
        );
        expect(redactSensitiveUrl("https://dreamcanvas.in/verify-email?token=abc&utm_source=mail")).toBe(
            "https://dreamcanvas.in/verify-email?utm_source=mail",
        );
    });

    it("removes email addresses", () => {
        expect(redactSensitiveUrl("https://dreamcanvas.in/login?verified=1&email=a%40b.com")).toBe(
            "https://dreamcanvas.in/login?verified=1",
        );
    });

    it("leaves other URLs untouched", () => {
        expect(redactSensitiveUrl("https://dreamcanvas.in/menu/hotel-lux?room=101")).toBe(
            "https://dreamcanvas.in/menu/hotel-lux?room=101",
        );
        expect(redactSensitiveUrl("not a url")).toBe("not a url");
    });
});
