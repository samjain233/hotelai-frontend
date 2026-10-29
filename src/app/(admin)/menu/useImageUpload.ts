"use client";

import { useCallback, useState } from "react";
import { upload } from "@vercel/blob/client";
import { api } from "@/lib/api";
import { blobPathnameWithExtension, resolveImageContentType } from "@/lib/imageUpload";
import { MAX_IMAGE_SIZE } from "./menuForms";

/**
 * Upload a dish photo to Vercel Blob via a one-time token. Returns the public URL, or null if
 * the file was rejected or the upload failed (the user has already been told why).
 */
export function useImageUpload() {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const uploadImage = useCallback(async (file: File): Promise<string | null> => {
        const contentType = resolveImageContentType(file);
        if (!contentType) {
            alert(
                `Please use a JPEG, PNG, or WebP image. If your file is correct but still fails, rename it to end in .jpg, .png, or .webp (some phones send type "${file.type || "empty"}").`,
            );
            return null;
        }
        if (file.size > MAX_IMAGE_SIZE) {
            alert("Image must be 10 MB or smaller.");
            return null;
        }
        setUploading(true);
        setProgress(4);
        try {
            const { token } = await api.getUploadToken();
            setProgress(12);
            const { pathname: basePath } = await api.getUploadPathname(token);
            const pathname = blobPathnameWithExtension(basePath, contentType);
            setProgress(22);
            const blob = await upload(pathname, file, {
                access: "public",
                handleUploadUrl: "/api/blob-upload",
                clientPayload: JSON.stringify({ token }),
                contentType,
                onUploadProgress: ({ percentage }) => {
                    setProgress(22 + Math.round((percentage / 100) * 73));
                },
            });
            setProgress(100);
            return blob.url;
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Upload failed");
            return null;
        } finally {
            setUploading(false);
            setProgress(0);
        }
    }, []);

    return { uploading, progress, uploadImage };
}
