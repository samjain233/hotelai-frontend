import Link from "next/link";

/** Compact links for auth pages and footers */
export function LegalFooter({ className = "" }: { className?: string }) {
    return (
        <p className={`text-center text-xs text-muted-foreground ${className}`}>
            <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
                Privacy Policy
            </Link>
            <span className="mx-2 text-border">·</span>
            <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
                Terms of Service
            </Link>
        </p>
    );
}
