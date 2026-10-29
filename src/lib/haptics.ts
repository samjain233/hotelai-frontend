/**
 * Short haptic tick for tactile confirmation of a tap (e.g. adding a dish to the cart).
 * Android browsers vibrate; iOS Safari has no Vibration API and ignores the call.
 */
export function hapticTick(ms = 10): void {
    if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
    try {
        navigator.vibrate(ms);
    } catch {
        // Some browsers throw when vibration is blocked by policy; the tick is best-effort.
    }
}
