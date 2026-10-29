"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { AlertTriangle, CalendarClock, IndianRupee, Loader2, Pencil, X } from "lucide-react";
import { platformApi, type HotelSubscription, type UpdateSubscriptionPayload } from "@/lib/platformApi";
import type { SubscriptionTier } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TIER_LABEL, TIER_ORDER, TIER_PRICE_INR, TierBadge, daysUntil, formatDate, formatInr } from "../../_components/tier";

interface Props {
    hotelId: string;
    hotelName: string;
    subscription: HotelSubscription | null;
    onSaved: (next: HotelSubscription) => void;
}

/** Shows the current plan and payment record; editing happens in a confirm dialog. */
export function SubscriptionCard({ hotelId, hotelName, subscription, onSaved }: Props) {
    const [editing, setEditing] = useState(false);
    const tier: SubscriptionTier = subscription?.tier ?? "FREE";
    const isActive = subscription?.isActive ?? true;
    const effectiveTier: SubscriptionTier = isActive ? tier : "FREE";
    const expiresIn = daysUntil(subscription?.expiresAt);

    return (
        <section className="dashboard-card p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                    <h2 className="text-base font-semibold">Subscription</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Payments are recorded by hand (UPI) until Razorpay is wired in.</p>
                </div>
                <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-border bg-card hover:bg-secondary transition"
                >
                    <Pencil className="w-3.5 h-3.5" />
                    Change plan
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Field label="Plan">
                    <div className="flex items-center gap-2">
                        <TierBadge tier={tier} inactive={!isActive && tier !== "FREE"} />
                        {!isActive && tier !== "FREE" && (
                            <span className="text-xs text-amber-400">treated as {TIER_LABEL[effectiveTier]}</span>
                        )}
                    </div>
                </Field>
                <Field label="Paid on">
                    <span className="text-sm">{formatDate(subscription?.paidAt)}</span>
                    {subscription?.amountPaise != null && (
                        <span className="block text-xs text-muted-foreground">{formatInr(subscription.amountPaise / 100)}</span>
                    )}
                </Field>
                <Field label="Expires">
                    <span
                        className={cn(
                            "text-sm",
                            expiresIn !== null && expiresIn < 0 && "text-red-400 font-medium",
                            expiresIn !== null && expiresIn >= 0 && expiresIn <= 14 && "text-amber-400 font-medium",
                        )}
                    >
                        {formatDate(subscription?.expiresAt)}
                    </span>
                    {expiresIn !== null && (
                        <span className="block text-xs text-muted-foreground">
                            {expiresIn < 0 ? `${Math.abs(expiresIn)} days ago` : expiresIn === 0 ? "today" : `in ${expiresIn} days`}
                        </span>
                    )}
                </Field>
                <Field label="Reference">
                    <span className="text-sm font-mono break-all">{subscription?.paymentRef || "—"}</span>
                </Field>
            </div>

            {subscription?.note && (
                <p className="mt-3 text-sm text-muted-foreground border-l-2 border-border pl-3 whitespace-pre-wrap">{subscription.note}</p>
            )}

            {expiresIn !== null && expiresIn < 0 && effectiveTier !== "FREE" && (
                <p className="mt-4 flex items-center gap-2 text-xs text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Paid period has ended but the plan is still active. Record the renewal or switch to Free.
                </p>
            )}

            {editing && (
                <SubscriptionDialog
                    hotelId={hotelId}
                    hotelName={hotelName}
                    current={subscription}
                    onClose={() => setEditing(false)}
                    onSaved={(next) => {
                        onSaved(next);
                        setEditing(false);
                    }}
                />
            )}
        </section>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="rounded-lg border border-border/60 bg-secondary/20 p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
            {children}
        </div>
    );
}

// ─── Dialog ────────────────────────────────────────────────

type Period = "monthly" | "annual" | "custom";

interface FormState {
    tier: SubscriptionTier;
    isActive: boolean;
    period: Period;
    paidAt: string; // yyyy-mm-dd
    expiresAt: string; // yyyy-mm-dd
    amountInr: string;
    paymentRef: string;
    note: string;
}

const toInputDate = (iso: string | null | undefined) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");
const today = () => new Date().toISOString().slice(0, 10);

function addMonths(yyyyMmDd: string, months: number): string {
    const d = new Date(`${yyyyMmDd}T00:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() + months);
    return d.toISOString().slice(0, 10);
}

/** Default price for a tier + period; annual = ten months (two free). */
function defaultAmount(tier: SubscriptionTier, period: Period): string {
    const monthly = TIER_PRICE_INR[tier];
    if (!monthly) return "";
    if (period === "monthly") return String(monthly);
    if (period === "annual") return String(tier === "STARTER" ? 4999 : monthly * 10);
    return "";
}

function SubscriptionDialog({
    hotelId,
    hotelName,
    current,
    onClose,
    onSaved,
}: {
    hotelId: string;
    hotelName: string;
    current: HotelSubscription | null;
    onClose: () => void;
    onSaved: (next: HotelSubscription) => void;
}) {
    const [form, setForm] = useState<FormState>(() => ({
        tier: current?.tier ?? "FREE",
        isActive: current?.isActive ?? true,
        period: "custom",
        paidAt: toInputDate(current?.paidAt),
        expiresAt: toInputDate(current?.expiresAt),
        amountInr: current?.amountPaise != null ? String(current.amountPaise / 100) : "",
        paymentRef: current?.paymentRef ?? "",
        note: current?.note ?? "",
    }));
    const [confirming, setConfirming] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && !saving && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose, saving]);

    const isPaidTier = form.tier !== "FREE";
    const tierChanged = form.tier !== (current?.tier ?? "FREE");
    const activeChanged = form.isActive !== (current?.isActive ?? true);

    function update<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((f) => ({ ...f, [key]: value }));
    }

    /** Picking a period fills paidAt/expiresAt/amount; the user can still override any of them. */
    function applyPeriod(period: Period) {
        setForm((f) => {
            if (period === "custom") return { ...f, period };
            const paidAt = f.paidAt || today();
            return {
                ...f,
                period,
                paidAt,
                expiresAt: addMonths(paidAt, period === "monthly" ? 1 : 12),
                amountInr: defaultAmount(f.tier, period),
            };
        });
    }

    function applyTier(tier: SubscriptionTier) {
        setForm((f) => ({
            ...f,
            tier,
            isActive: tier === "FREE" ? true : f.isActive,
            amountInr: f.period === "custom" ? f.amountInr : defaultAmount(tier, f.period),
        }));
    }

    function validate(): string {
        if (isPaidTier && form.amountInr !== "" && !/^\d+(\.\d{1,2})?$/.test(form.amountInr)) return "Amount must be a number in rupees.";
        if (form.paidAt && form.expiresAt && form.expiresAt < form.paidAt) return "Expiry must be after the paid date.";
        return "";
    }

    /** Dates are stored as UTC day boundaries: paid at start of day, expiry at end of day. Empty fields clear. */
    function buildPayload(): UpdateSubscriptionPayload {
        return {
            tier: form.tier,
            isActive: form.isActive,
            paidAt: form.paidAt ? new Date(`${form.paidAt}T00:00:00Z`).toISOString() : null,
            expiresAt: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59Z`).toISOString() : null,
            amountPaise: form.amountInr ? Math.round(parseFloat(form.amountInr) * 100) : null,
            paymentRef: form.paymentRef.trim() || null,
            note: form.note.trim() || null,
        };
    }

    async function save() {
        const problem = validate();
        if (problem) {
            setError(problem);
            setConfirming(false);
            return;
        }
        setSaving(true);
        setError("");
        try {
            const next = await platformApi.updateHotelSubscription(hotelId, buildPayload());
            toast.success(`${hotelName} is now on ${TIER_LABEL[next.tier]}${next.isActive ? "" : " (inactive)"}`);
            onSaved(next);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Could not update subscription");
            setConfirming(false);
        } finally {
            setSaving(false);
        }
    }

    const summary = [
        tierChanged ? `${TIER_LABEL[current?.tier ?? "FREE"]} → ${TIER_LABEL[form.tier]}` : `stays on ${TIER_LABEL[form.tier]}`,
        activeChanged ? (form.isActive ? "re-activated" : "marked inactive (treated as Free)") : null,
        isPaidTier && form.expiresAt ? `expires ${formatDate(`${form.expiresAt}T00:00:00Z`)}` : null,
        isPaidTier && form.amountInr ? `${formatInr(parseFloat(form.amountInr))} received` : null,
    ].filter(Boolean);

    if (typeof document === "undefined") return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="sub-dialog-title">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !saving && onClose()} />
            <div className="relative w-full max-w-lg dashboard-card bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                        <h3 id="sub-dialog-title" className="text-lg font-semibold">Change plan</h3>
                        <p className="text-sm text-muted-foreground">{hotelName}</p>
                    </div>
                    <button type="button" onClick={onClose} disabled={saving} className="text-muted-foreground hover:text-foreground transition" aria-label="Close">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-5">
                    {/* Tier */}
                    <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Tier</p>
                        <div className="grid grid-cols-5 gap-1.5">
                            {TIER_ORDER.map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => applyTier(t)}
                                    className={cn(
                                        "rounded-lg border px-2 py-2 text-xs font-medium transition text-center",
                                        form.tier === t ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground",
                                    )}
                                >
                                    {TIER_LABEL[t]}
                                    <span className="block text-[10px] opacity-70 mt-0.5">{TIER_PRICE_INR[t] ? `₹${TIER_PRICE_INR[t]}/mo` : "₹0"}</span>
                                </button>
                            ))}
                        </div>
                        {form.tier !== "FREE" && form.tier !== "STARTER" && (
                            <p className="mt-2 text-xs text-amber-400">
                                Ordering tiers are not launched yet. This unlocks ordering and service features for the hotel.
                            </p>
                        )}
                    </div>

                    {/* Active */}
                    {isPaidTier && (
                        <label className="flex items-start gap-2.5 text-sm cursor-pointer select-none">
                            <input type="checkbox" checked={form.isActive} onChange={(e) => update("isActive", e.target.checked)} className="mt-0.5 rounded border-border" />
                            <span>
                                Active
                                <span className="block text-xs text-muted-foreground">
                                    Untick to suspend without losing the record. The hotel is treated as Free while inactive.
                                </span>
                            </span>
                        </label>
                    )}

                    {/* Payment */}
                    {isPaidTier && (
                        <div className="rounded-xl border border-border/60 bg-secondary/20 p-4 space-y-4">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <IndianRupee className="w-4 h-4 text-emerald-500" />
                                Payment received
                            </div>
                            <div className="flex gap-1.5">
                                {(["monthly", "annual", "custom"] as Period[]).map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => applyPeriod(p)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-full text-xs font-medium border transition capitalize",
                                            form.period === p ? "bg-primary/10 text-primary border-primary/30" : "bg-card text-muted-foreground border-border hover:text-foreground",
                                        )}
                                    >
                                        {p === "annual" ? "Annual (2 months free)" : p}
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <LabeledInput label="Paid on" type="date" value={form.paidAt} onChange={(v) => update("paidAt", v)} />
                                <LabeledInput label="Expires on" type="date" value={form.expiresAt} onChange={(v) => update("expiresAt", v)} icon={CalendarClock} />
                                <LabeledInput label="Amount (₹)" type="text" inputMode="decimal" placeholder="499" value={form.amountInr} onChange={(v) => update("amountInr", v)} />
                                <LabeledInput label="UPI / payment ref" type="text" placeholder="UTR or txn ID" value={form.paymentRef} onChange={(v) => update("paymentRef", v)} mono />
                            </div>
                        </div>
                    )}

                    {/* Note */}
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5" htmlFor="sub-note">
                            Note
                        </label>
                        <textarea
                            id="sub-note"
                            rows={2}
                            value={form.note}
                            onChange={(e) => update("note", e.target.value)}
                            placeholder="e.g. Paid via GPay to Suraj, screenshot on WhatsApp. First hotel in Rishikesh, setup fee waived."
                            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
                        />
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}

                    {/* Confirm step */}
                    {confirming ? (
                        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                            <p className="text-sm font-medium">Apply these changes?</p>
                            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-0.5">
                                {summary.map((s) => (
                                    <li key={s as string}>{s}</li>
                                ))}
                            </ul>
                            <div className="flex justify-end gap-2 pt-1">
                                <button type="button" onClick={() => setConfirming(false)} disabled={saving} className="px-3 py-2 rounded-lg text-sm border border-border hover:bg-secondary transition">
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={save}
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition"
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Confirm
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg text-sm border border-border hover:bg-secondary transition">
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const problem = validate();
                                    if (problem) return setError(problem);
                                    setError("");
                                    setConfirming(true);
                                }}
                                className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition"
                            >
                                Review changes
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
}

function LabeledInput({
    label,
    value,
    onChange,
    type,
    placeholder,
    inputMode,
    icon: Icon,
    mono,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type: "date" | "text";
    placeholder?: string;
    inputMode?: "decimal" | "text";
    icon?: typeof CalendarClock;
    mono?: boolean;
}) {
    return (
        <label className="block">
            <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                {Icon && <Icon className="w-3 h-3" />}
                {label}
            </span>
            <input
                type={type}
                value={value}
                inputMode={inputMode}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className={cn(
                    "w-full px-3 py-2 rounded-lg border border-border bg-card text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40",
                    mono && "font-mono",
                )}
            />
        </label>
    );
}
