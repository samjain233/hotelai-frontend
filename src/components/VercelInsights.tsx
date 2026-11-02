"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { redactSensitiveUrl } from "@/lib/analyticsRedact";

/** Client wrapper so `beforeSend` (a function) can be passed; the root layout is a server component. */
export function VercelInsights() {
    return (
        <>
            <Analytics beforeSend={(event) => ({ ...event, url: redactSensitiveUrl(event.url) })} />
            <SpeedInsights beforeSend={(event) => ({ ...event, url: redactSensitiveUrl(event.url) })} />
        </>
    );
}
