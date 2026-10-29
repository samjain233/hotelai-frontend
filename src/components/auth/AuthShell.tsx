"use client";

import Link from "next/link";
import { forwardRef, InputHTMLAttributes, ButtonHTMLAttributes, ReactNode, useId } from "react";
import { Check, Eye, EyeOff, Loader2, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Light-themed building blocks for the public auth pages (login, register, …).
 * They match the landing page palette rather than the dark admin UI, so they
 * deliberately do not reuse `components/ui/Input` and `components/ui/Button`.
 */

export function AuthLogo({ className = "" }: { className?: string }) {
    return (
        <Link href="/" className={cn("inline-flex items-center gap-2.5", className)} aria-label="DreamCanvas home">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#14172b]">
                <QrCode className="h-4 w-4 text-[#d4a853]" strokeWidth={2.25} />
            </span>
            <span className="text-[17px] font-semibold tracking-tight text-[#14172b]">dreamcanvas</span>
        </Link>
    );
}

/* ───────────────────────── Layout ───────────────────────── */

type AuthShellProps = {
    /** Panel headline, rendered in the serif face. */
    panelTitle: ReactNode;
    panelPoints: readonly string[];
    children: ReactNode;
    /** Max width of the form column. Default fits login; register uses a wider one. */
    width?: "sm" | "md";
};

export function AuthShell({ panelTitle, panelPoints, children, width = "sm" }: AuthShellProps) {
    return (
        <div className="min-h-screen bg-white text-[#14172b] lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            {/* Brand panel */}
            <aside className="relative hidden overflow-hidden bg-[#14172b] text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-[0.07]"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
                        backgroundSize: "40px 40px",
                    }}
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute -bottom-40 -left-32 h-[480px] w-[480px] rounded-full bg-[#d4a853] opacity-[0.12] blur-3xl"
                />

                <Link href="/" className="relative inline-flex items-center gap-2.5" aria-label="DreamCanvas home">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                        <QrCode className="h-4 w-4 text-[#d4a853]" strokeWidth={2.25} />
                    </span>
                    <span className="text-[17px] font-semibold tracking-tight">dreamcanvas</span>
                </Link>

                <div className="relative max-w-md">
                    <h2 className="font-serif text-[38px] leading-[1.1] tracking-[-0.01em] xl:text-[44px]">{panelTitle}</h2>
                    <ul className="mt-8 space-y-3.5">
                        {panelPoints.map((p) => (
                            <li key={p} className="flex items-start gap-3 text-[15px] leading-snug text-white/80">
                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d4a853]/15 ring-1 ring-[#d4a853]/40">
                                    <Check className="h-3 w-3 text-[#d4a853]" strokeWidth={3} />
                                </span>
                                {p}
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="relative text-[13px] text-white/45">Digital menus and room service for independent hotels in India.</p>
            </aside>

            {/* Form column */}
            <main className="flex min-h-screen flex-col px-5 py-6 sm:px-8 lg:min-h-0 lg:px-12">
                <div className="flex items-center justify-between lg:hidden">
                    <AuthLogo />
                </div>
                <div className="flex flex-1 items-center justify-center py-10">
                    <div className={cn("w-full", width === "sm" ? "max-w-[400px]" : "max-w-[480px]")}>{children}</div>
                </div>
                <p className="text-center text-[12.5px] text-[#7a7f99]">
                    <Link href="/privacy" className="hover:text-[#14172b]">
                        Privacy
                    </Link>
                    <span className="mx-2 text-[#d9d6cd]">·</span>
                    <Link href="/terms" className="hover:text-[#14172b]">
                        Terms
                    </Link>
                    <span className="mx-2 text-[#d9d6cd]">·</span>
                    <Link href="/" className="hover:text-[#14172b]">
                        dreamcanvas.in
                    </Link>
                </p>
            </main>
        </div>
    );
}

export function AuthHeading({ title, subtitle }: { title: ReactNode; subtitle?: ReactNode }) {
    return (
        <div className="mb-8">
            <h1 className="font-serif text-[32px] leading-tight tracking-[-0.01em] sm:text-[36px]">{title}</h1>
            {subtitle ? <p className="mt-2 text-[15px] leading-relaxed text-[#4b5068]">{subtitle}</p> : null}
        </div>
    );
}

/* ───────────────────────── Form pieces ───────────────────────── */

export function AuthError({ children }: { children: ReactNode }) {
    if (!children) return null;
    return (
        <div
            role="alert"
            className="mb-5 rounded-xl border border-[#f1c7c2] bg-[#fdf2f0] px-4 py-3 text-[14px] leading-snug text-[#9b2c20]"
        >
            {children}
        </div>
    );
}

export function AuthSuccess({ children }: { children: ReactNode }) {
    if (!children) return null;
    return (
        <div
            role="status"
            className="mb-5 flex items-start gap-3 rounded-xl border border-[#cfe3dc] bg-[#eef7f4] px-4 py-3 text-[14px] leading-snug text-[#1f5d51]"
        >
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2f7f6f]/15">
                <Check className="h-3 w-3 text-[#2f7f6f]" strokeWidth={3} />
            </span>
            <span>{children}</span>
        </div>
    );
}

/** Centered icon badge used at the top of status-style pages (check your email, verifying…). */
export function AuthBadge({ children }: { children: ReactNode }) {
    return (
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fbf3e3] text-[#b8862b] ring-1 ring-[#f0dfb8]">
            {children}
        </div>
    );
}

export function AuthSection({ title, children }: { title: string; children: ReactNode }) {
    return (
        <fieldset className="space-y-4">
            <legend className="mb-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#b8862b]">{title}</legend>
            {children}
        </fieldset>
    );
}

export interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    hint?: ReactNode;
    /** Rendered to the right of the label, e.g. a "Forgot password?" link. */
    labelAside?: ReactNode;
    rightElement?: ReactNode;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
    ({ label, hint, labelAside, rightElement, className, id, ...props }, ref) => {
        const autoId = useId();
        const inputId = id ?? autoId;
        const hintId = hint ? `${inputId}-hint` : undefined;
        return (
            <div>
                <div className="mb-1.5 flex items-baseline justify-between">
                    <label htmlFor={inputId} className="text-[13.5px] font-medium text-[#14172b]">
                        {label}
                    </label>
                    {labelAside}
                </div>
                <div className="relative">
                    <input
                        ref={ref}
                        id={inputId}
                        aria-describedby={hintId}
                        className={cn(
                            "h-11 w-full rounded-xl border border-[#d9d6cd] bg-white px-3.5 text-[15px] text-[#14172b] shadow-[0_1px_2px_rgba(20,23,43,0.04)] outline-none transition-colors placeholder:text-[#a3a7ba]",
                            "hover:border-[#bfbbb0] focus:border-[#14172b] focus:ring-4 focus:ring-[#14172b]/10",
                            "disabled:cursor-not-allowed disabled:bg-[#f7f5f0] disabled:text-[#7a7f99]",
                            rightElement && "pr-11",
                            className,
                        )}
                        {...props}
                    />
                    {rightElement ? (
                        <div className="absolute inset-y-0 right-1.5 flex items-center">{rightElement}</div>
                    ) : null}
                </div>
                {hint ? (
                    <p id={hintId} className="mt-1.5 text-[12.5px] text-[#7a7f99]">
                        {hint}
                    </p>
                ) : null}
            </div>
        );
    },
);
AuthInput.displayName = "AuthInput";

export function PasswordToggle({ shown, onToggle, label = "password" }: { shown: boolean; onToggle: () => void; label?: string }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            aria-label={shown ? `Hide ${label}` : `Show ${label}`}
            aria-pressed={shown}
            className="rounded-lg p-2 text-[#7a7f99] transition-colors hover:bg-[#f2f0ea] hover:text-[#14172b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#14172b]/30"
        >
            {shown ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
        </button>
    );
}

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean;
    variant?: "primary" | "outline";
}

export const AuthButton = forwardRef<HTMLButtonElement, AuthButtonProps>(
    ({ loading, variant = "primary", className, children, disabled, ...props }, ref) => (
        <button
            ref={ref}
            disabled={loading || disabled}
            className={cn(
                "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a853] focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-60",
                variant === "primary" && "bg-[#14172b] text-white hover:bg-[#232848]",
                variant === "outline" && "border border-[#d9d6cd] bg-white text-[#14172b] hover:border-[#14172b]",
                className,
            )}
            {...props}
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {children}
        </button>
    ),
);
AuthButton.displayName = "AuthButton";

/** Full-width, button-styled internal link for single-action states. */
export function AuthLinkButton({
    href,
    variant = "primary",
    children,
}: {
    href: string;
    variant?: "primary" | "outline";
    children: ReactNode;
}) {
    return (
        <Link
            href={href}
            className={cn(
                "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a853] focus-visible:ring-offset-2",
                variant === "primary" && "bg-[#14172b] text-white hover:bg-[#232848]",
                variant === "outline" && "border border-[#d9d6cd] bg-white text-[#14172b] hover:border-[#14172b]",
            )}
        >
            {children}
        </Link>
    );
}

export function AuthDivider({ children = "or" }: { children?: ReactNode }) {
    return (
        <div className="relative my-6 flex items-center" role="separator">
            <span className="h-px flex-1 bg-[#ecebe6]" />
            <span className="px-3 text-[12px] uppercase tracking-[0.12em] text-[#7a7f99]">{children}</span>
            <span className="h-px flex-1 bg-[#ecebe6]" />
        </div>
    );
}

export function GoogleMark() {
    return (
        <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" aria-hidden>
            <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
        </svg>
    );
}

/**
 * Same-origin OAuth start. Must be a full-page navigation (route handler redirects to Google),
 * so a plain anchor is correct here rather than next/link.
 */
export function GoogleLinkButton({ label }: { label: string }) {
    return (
        // eslint-disable-next-line @next/next/no-html-link-for-pages
        <a
            href="/api/auth/google"
            className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-full border border-[#d9d6cd] bg-white px-5 text-[15px] font-semibold text-[#14172b] transition-colors hover:border-[#14172b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a853] focus-visible:ring-offset-2"
        >
            <GoogleMark />
            {label}
        </a>
    );
}

/**
 * Reads and clears a `?error=` message set by the OAuth callback, so a refresh
 * does not show it again. Client-only; call from a mount effect.
 */
export function consumeErrorParam(): string {
    const url = new URL(window.location.href);
    const e = url.searchParams.get("error");
    if (!e) return "";
    url.searchParams.delete("error");
    window.history.replaceState({}, "", url.pathname + url.search);
    return decodeURIComponent(e);
}

export function AuthFootnote({ children }: { children: ReactNode }) {
    return <p className="mt-6 text-center text-[14px] text-[#4b5068]">{children}</p>;
}

export function AuthTextLink({ href, children }: { href: string; children: ReactNode }) {
    return (
        <Link
            href={href}
            className="font-semibold text-[#14172b] underline decoration-[#d4a853] decoration-2 underline-offset-[3px] transition-colors hover:text-[#b8862b]"
        >
            {children}
        </Link>
    );
}
