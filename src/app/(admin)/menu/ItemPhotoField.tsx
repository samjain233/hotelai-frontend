"use client";

import { useRef } from "react";
import { Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { ITEM_LABEL } from "./menuForms";

interface ItemPhotoFieldProps {
    imageUrl: string;
    uploading: boolean;
    progress: number;
    onFile: (file: File) => void;
    onRemove: () => void;
}

/** Click / drag-and-drop photo uploader with progress overlay. */
export function ItemPhotoField({ imageUrl, uploading, progress, onFile, onRemove }: ItemPhotoFieldProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <div>
            <p className={ITEM_LABEL}>Photo</p>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) onFile(file);
                }}
            />
            <div
                role="button"
                tabIndex={0}
                aria-label={imageUrl ? "Change photo" : "Upload photo"}
                onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && !uploading) {
                        e.preventDefault();
                        fileInputRef.current?.click();
                    }
                }}
                onDragOver={(e) => {
                    if (uploading) return;
                    e.preventDefault();
                    e.currentTarget.classList.add("!border-brand", "!bg-brand/10");
                }}
                onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove("!border-brand", "!bg-brand/10");
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove("!border-brand", "!bg-brand/10");
                    if (uploading) return;
                    const f = e.dataTransfer.files?.[0];
                    if (f) onFile(f);
                }}
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={cn(
                    "group relative flex aspect-square w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
                    uploading ? "pointer-events-none cursor-wait" : "cursor-pointer",
                    imageUrl ? "border-transparent bg-secondary" : "border-border bg-background hover:border-brand/60 hover:bg-brand/5",
                )}
            >
                {uploading && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-background/85 px-6 backdrop-blur-sm">
                        <Loader2 className="h-7 w-7 animate-spin text-brand" aria-hidden />
                        <div className="h-1.5 w-full max-w-[180px] overflow-hidden rounded-full bg-secondary">
                            <div
                                className="h-full rounded-full bg-brand transition-[width] duration-200 ease-out"
                                style={{ width: `${Math.min(100, Math.max(progress, 2))}%` }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">Uploading{progress > 0 ? ` ${progress}%` : "…"}</p>
                    </div>
                )}
                {imageUrl ? (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                        <span
                            className={cn(
                                "absolute inset-x-3 bottom-3 rounded-lg bg-black/70 py-2 text-xs font-medium text-white backdrop-blur-sm transition-opacity",
                                uploading ? "opacity-0" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
                            )}
                        >
                            Change photo
                        </span>
                    </>
                ) : (
                    <>
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-brand ring-1 ring-brand/25">
                            <Upload className="h-5 w-5" />
                        </span>
                        <span className="text-sm font-medium text-foreground">Upload a photo</span>
                        <span className="px-4 text-xs text-muted-foreground">Drag and drop, or click. JPEG, PNG or WebP up to 10 MB.</span>
                    </>
                )}
            </div>
            {imageUrl && !uploading && (
                <button type="button" onClick={onRemove} className="mt-2 cursor-pointer text-xs font-medium text-muted-foreground hover:text-red-500">
                    Remove photo
                </button>
            )}
        </div>
    );
}
