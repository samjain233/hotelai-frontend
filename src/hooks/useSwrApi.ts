'use client';

import useSWR, { mutate as globalMutate } from 'swr';
import { swrFetcher } from '@/lib/api';
import type { PublicMenuData } from '@/lib/types';

/** Cache keys - centralized for consistent invalidation */
export const SWR_KEYS = {
    publicMenu: (hotelSlug: string) => [`guest/menu/${hotelSlug}`] as const,
    publicRooms: (hotelSlug: string) => [`guest/rooms/${hotelSlug}`] as const,
    categories: () => ['admin/categories'] as const,
    menuItems: () => ['admin/menu'] as const,
} as const;

/** SWR config: 60s dedup - avoid duplicate requests within a minute */
const STALE_60 = { dedupingInterval: 60_000, revalidateOnFocus: true };

/**
 * Public menu for guests. Safe to cache; menu changes infrequently.
 */
export function usePublicMenu(hotelSlug: string | null) {
    return useSWR<PublicMenuData>(
        hotelSlug ? `/guest/menu/${hotelSlug}` : null,
        swrFetcher,
        STALE_60,
    );
}

/**
 * Public rooms for guests. Safe to cache.
 */
export function usePublicRooms(hotelSlug: string | null) {
    return useSWR<{ id: string; number: string; floor?: string; type?: string; hotelId?: string }[]>(
        hotelSlug ? `/guest/rooms/${hotelSlug}` : null,
        swrFetcher,
        STALE_60,
    );
}

/**
 * Admin categories. Invalidates when menu data changes.
 */
export function useCategories(enabled = true) {
    return useSWR<import('@/lib/types').MenuCategory[]>(
        enabled ? '/admin/categories' : null,
        swrFetcher,
        { dedupingInterval: 30_000, revalidateOnFocus: true },
    );
}

/**
 * Admin menu items. Invalidates when menu data changes.
 */
export function useMenuItems(enabled = true) {
    return useSWR<import('@/lib/types').MenuItem[]>(
        enabled ? '/admin/menu' : null,
        swrFetcher,
        { dedupingInterval: 30_000, revalidateOnFocus: true },
    );
}

/** Invalidate menu-related cache after admin creates/updates/deletes categories or items */
export function invalidateMenuCache() {
    return globalMutate(
        (key) => typeof key === 'string' && (key.startsWith('/admin/') || key.startsWith('guest/')),
    );
}
