"use client";

import { useCallback, useEffect } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { api, swrFetcher } from "@/lib/api";
import type { MenuTag } from "@/lib/types";

export type MenuTagType = MenuTag["type"];

const TAGS_KEY = "/tags";

/**
 * Allergen and dietary tags for the hotel (built-in + custom). Backed by the SWR cache, so the
 * list is fetched once per session and later visits to the Menu page render without a skeleton.
 * Mutations patch the cached list in place; no refetch needed.
 */
export function useMenuTags() {
    const { data, error, isLoading, mutate } = useSWR<MenuTag[]>(TAGS_KEY, swrFetcher, {
        dedupingInterval: 60_000,
        revalidateOnFocus: false,
    });

    useEffect(() => {
        if (error) {
            console.error("Failed to load menu tags:", error);
            toast.error("Failed to load allergens and dietary tags");
        }
    }, [error]);

    /** Create or rename a tag. Throws on failure so the caller can keep its modal open. */
    const saveTag = useCallback(
        async (editing: MenuTag | null, name: string, type: MenuTagType): Promise<MenuTag> => {
            if (editing) {
                const updated = await api.updateTag(editing.id, { name });
                await mutate((prev) => (prev ?? []).map((tag) => (tag.id === updated.id ? updated : tag)), { revalidate: false });
                return updated;
            }
            const created = await api.createTag({ name, type });
            await mutate((prev) => [...(prev ?? []), created], { revalidate: false });
            return created;
        },
        [mutate],
    );

    const removeTag = useCallback(
        async (id: number): Promise<void> => {
            await api.deleteTag(id);
            await mutate((prev) => (prev ?? []).filter((tag) => tag.id !== id), { revalidate: false });
        },
        [mutate],
    );

    const tags = data ?? [];
    return {
        tags,
        // Only block the page while there is nothing cached yet; a background revalidate is silent.
        loading: isLoading && !data,
        allergenTags: tags.filter((tag) => tag.type === "ALLERGEN"),
        dietaryTags: tags.filter((tag) => tag.type === "DIETARY"),
        saveTag,
        removeTag,
    };
}
