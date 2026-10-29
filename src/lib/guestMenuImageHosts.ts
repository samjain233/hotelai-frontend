/**
 * The only hosts guest-facing images (dish photos, hotel logos) may come from.
 *
 * Photos are uploaded through `/api/blob-upload` to our Vercel Blob store, so this is the
 * store's public hostname. Anything else — a pasted URL, a Gemini-imported URL — is treated
 * as "no photo" rather than rendered. `next.config.ts` builds `images.remotePatterns` from
 * this list, so `next/image` and the guest menu stay in sync.
 *
 * Kept free of path aliases and other imports so `next.config.ts` can import it.
 */
export const GUEST_MENU_IMAGE_HOSTS: readonly string[] = ["g4lkbzwx6qe62z9g.public.blob.vercel-storage.com"];

/**
 * Returns the trimmed URL when it is an https URL on an allowed host, else "" (render the
 * no-photo fallback). Templates call this instead of reading `item.imageUrl` directly.
 */
export function guestMenuImageSrc(url: string | null | undefined): string {
    const trimmed = url?.trim() ?? "";
    if (!trimmed) return "";
    try {
        const parsed = new URL(trimmed);
        if (parsed.protocol !== "https:") return "";
        return GUEST_MENU_IMAGE_HOSTS.includes(parsed.hostname.toLowerCase()) ? trimmed : "";
    } catch {
        return "";
    }
}
