/**
 * Optional env for legal pages (set in .env.local / Vercel):
 * NEXT_PUBLIC_LEGAL_ENTITY_NAME — registered business name
 * NEXT_PUBLIC_LEGAL_CONTACT_EMAIL — privacy / grievance contact
 * NEXT_PUBLIC_LEGAL_JURISDICTION — e.g. "New Delhi, India"
 */
export const legalEntityName =
    process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME?.trim() || "Hotel AI";

export const legalContactEmail = process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL?.trim() || "";

export const legalJurisdiction =
    process.env.NEXT_PUBLIC_LEGAL_JURISDICTION?.trim() || "New Delhi, India";

export function legalContactLine(): string {
    if (legalContactEmail) {
        return legalContactEmail;
    }
    return "the contact details shared with you when you subscribed to the Service, or your account administrator.";
}
