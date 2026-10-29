'use client';

import { useEffect } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import { swrFetcher } from '@/lib/api';
import type { PublicMenuFullData } from '@/lib/types';

const publicMenuFullKey = (hotelSlug: string) => `/guest/menu/${hotelSlug}/full`;

/**
 * Combined menu + rooms (single request). Use with initialData from server for faster load.
 *
 * Freshness is driven by `useGuestMenuVersion` (cheap poll + focus), not by refetching this 7 KB
 * payload on every focus: `revalidateOnFocus` is off here on purpose.
 */
export function usePublicMenuFull(
    hotelSlug: string | null,
    options?: { fallbackData?: PublicMenuFullData }
) {
    const hasSsrFallback = !!options?.fallbackData;
    return useSWR<PublicMenuFullData>(
        hotelSlug ? publicMenuFullKey(hotelSlug) : null,
        swrFetcher,
        {
            dedupingInterval: 10_000,
            revalidateOnFocus: false,
            fallbackData: options?.fallbackData ?? undefined,
            // SSR already returned fresh data; avoid an immediate duplicate /full fetch on hydration.
            revalidateOnMount: !hasSsrFallback,
            // Initial try + 3 retries (~5s, ~10s, ~20s), then wait for the next focus/reconnect.
            // SWR's default is unbounded; a guest with the menu already on screen gains nothing from more.
            errorRetryCount: 3,
        },
    );
}

export const GUEST_MENU_VERSION_POLL_MS = 30_000;

/**
 * Change signal for an open guest tab. Polls `GET /guest/menu/:slug/version` (one indexed read,
 * ~20-byte body, 304 when unchanged) every 30 s while the tab is visible and on focus/reconnect, and
 * refetches `/full` only when `menuUpdatedAt` moves past what the page already holds.
 *
 * `currentMenuUpdatedAt` is `hotel.menuUpdatedAt` from the data on screen (SSR or last fetch).
 */
export function useGuestMenuVersion(hotelSlug: string | null, currentMenuUpdatedAt: number | undefined) {
    const { data } = useSWR<{ menuUpdatedAt: number }>(
        hotelSlug ? `/guest/menu/${hotelSlug}/version` : null,
        swrFetcher,
        {
            refreshInterval: GUEST_MENU_VERSION_POLL_MS,
            refreshWhenHidden: false,
            refreshWhenOffline: false,
            revalidateOnFocus: true,
            focusThrottleInterval: 10_000,
            dedupingInterval: 5_000,
            errorRetryCount: 3,
            // A failed poll is not worth surfacing anywhere; the menu on screen is still valid.
            shouldRetryOnError: true,
        },
    );

    const latest = data?.menuUpdatedAt;
    useEffect(() => {
        if (!hotelSlug || latest == null || currentMenuUpdatedAt == null) return;
        if (latest > currentMenuUpdatedAt) void globalMutate(publicMenuFullKey(hotelSlug));
    }, [hotelSlug, latest, currentMenuUpdatedAt]);
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

/**
 * Admin rooms.
 */
export function useAdminRooms(enabled = true) {
    return useSWR<import('@/lib/types').Room[]>(
        enabled ? '/admin/rooms' : null,
        swrFetcher,
        { dedupingInterval: 30_000, revalidateOnFocus: true },
    );
}

/**
 * Menu-view analytics for the signed-in hotel (Starter+). Pass `enabled=false` for FREE hotels
 * so the locked preview never triggers a 402 round-trip.
 */
export function useMenuAnalytics(range: import('@/lib/types').MenuAnalyticsRange, enabled = true) {
    return useSWR<import('@/lib/types').MenuAnalytics>(
        enabled ? `/admin/analytics/menu?range=${range}` : null,
        swrFetcher,
        { dedupingInterval: 60_000, revalidateOnFocus: false, keepPreviousData: true },
    );
}

/**
 * Admin navigation tabs. Rarely changes.
 */
export function useAdminNavigation(enabled = true) {
    return useSWR<{ name: string; href: string; iconName: string; featureLock?: string; isLocked?: boolean }[]>(
        enabled ? '/auth/navigation' : null,
        swrFetcher,
        { dedupingInterval: 300_000, revalidateOnFocus: false },
    );
}

/**
 * Invalidate admin menu caches after creating/updating/deleting categories or items. Guest menus
 * are refreshed by their own version poll (`useGuestMenuVersion`), not from here.
 */
export function invalidateMenuCache() {
    return globalMutate((key) => typeof key === 'string' && key.startsWith('/admin/'));
}
