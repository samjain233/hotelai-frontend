/** MIME types allowed for menu / logo uploads (must match `/api/blob-upload` route). */
export const ALLOWED_IMAGE_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

function extFromFileName(fileName: string): string | null {
    const m = /\.([a-z0-9]+)$/i.exec(fileName.trim());
    if (!m) return null;
    const e = m[1].toLowerCase();
    if (e === "jpg" || e === "jpeg") return "jpeg";
    if (e === "png") return "png";
    if (e === "webp") return "webp";
    return null;
}

/**
 * Resolves a proper image MIME type. Some devices send `application/octet-stream` or empty `file.type`;
 * we fall back to the file name extension so Vercel Blob gets an allowed content type.
 */
export function resolveImageContentType(file: File): string | null {
    const t = file.type?.trim().toLowerCase();
    if (t === "image/jpg") return "image/jpeg";
    if (t && (ALLOWED_IMAGE_CONTENT_TYPES as readonly string[]).includes(t)) {
        return t;
    }
    const ext = extFromFileName(file.name);
    if (ext === "jpeg") return "image/jpeg";
    if (ext === "png") return "image/png";
    if (ext === "webp") return "image/webp";
    if (t === "application/octet-stream" || t === "") {
        return null;
    }
    return null;
}

/** File extension for blob pathname (Vercel uses path + explicit contentType). */
export function extensionForImageContentType(mime: string): string | null {
    switch (mime) {
        case "image/jpeg":
            return "jpg";
        case "image/png":
            return "png";
        case "image/webp":
            return "webp";
        default:
            return null;
    }
}

/**
 * Pathname from API has no extension; append one so Blob infers type correctly, and set contentType on upload.
 */
export function blobPathnameWithExtension(basePathname: string, contentType: string): string {
    const ext = extensionForImageContentType(contentType);
    if (!ext) return basePathname;
    const trimmed = basePathname.replace(/\/+$/, "");
    if (trimmed.toLowerCase().endsWith(`.${ext}`)) return trimmed;
    return `${trimmed}.${ext}`;
}
