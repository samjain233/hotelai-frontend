import type { GuestPublicMenuCategory, MenuItem } from "@/lib/types";

export type GuestMenuSort = "default" | "name-asc" | "name-desc" | "price-asc" | "price-desc";

export type GuestDietFilterKey = "VEG" | "NON_VEG" | "EGGITARIAN";

/** Collapse whitespace and lowercase for matching. */
export function normalizeSearchText(s: string): string {
    return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function compactAlnum(s: string): string {
    return s.toLowerCase().replace(/\s+/g, "");
}

/** Haystack: name + description + optional aliases (normalized). */
export function buildItemHaystack(item: MenuItem): string {
    const parts = [item.name, item.description ?? "", ...(item.searchAliases ?? [])];
    return normalizeSearchText(parts.join(" "));
}

/** True if every character of `query` appears in order inside `text` (light typo / skip-char tolerance). */
export function isLooseSubsequence(query: string, text: string): boolean {
    if (query.length < 3) return false;
    let i = 0;
    for (const c of text) {
        if (c === query[i]) i++;
        if (i === query.length) return true;
    }
    return false;
}

/** Levenshtein distance (small strings only — guest menus). */
export function levenshtein(a: string, b: string): number {
    if (a === b) return 0;
    const m = a.length;
    const n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    const row = new Array<number>(n + 1);
    for (let j = 0; j <= n; j++) row[j] = j;
    for (let i = 1; i <= m; i++) {
        let prev = row[0];
        row[0] = i;
        for (let j = 1; j <= n; j++) {
            const tmp = row[j];
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
            prev = tmp;
        }
    }
    return row[n]!;
}

function maxFuzzyDistanceForQuery(len: number): number {
    if (len < 4) return 1;
    if (len <= 8) return 2;
    return Math.min(3, Math.floor(len / 4));
}

/**
 * Match: substring on haystack → all query tokens appear in haystack → subsequence on compact name → Levenshtein on full name.
 */
export function itemMatchesSearch(item: MenuItem, queryRaw: string): boolean {
    const q = normalizeSearchText(queryRaw);
    if (!q) return true;

    const haystack = buildItemHaystack(item);
    if (haystack.includes(q)) return true;

    const tokens = q.split(" ").filter((t) => t.length > 0);
    if (tokens.length > 1 && tokens.every((t) => haystack.includes(t))) return true;

    const nameNorm = normalizeSearchText(item.name);
    const qCompact = compactAlnum(q);
    const nameCompact = compactAlnum(item.name);
    if (qCompact.length >= 3 && isLooseSubsequence(qCompact, nameCompact)) return true;

    if (q.length >= 4 && q.length <= 48) {
        const maxD = maxFuzzyDistanceForQuery(q.length);
        if (levenshtein(q, nameNorm) <= maxD) return true;
        for (const word of nameNorm.split(" ")) {
            if (word.length < 3) continue;
            if (levenshtein(q, word) <= Math.min(maxD, 2)) return true;
        }
    }

    return false;
}

/** Best fuzzy name match when literal search returns nothing. */
export function findDidYouMeanItem(queryRaw: string, items: MenuItem[]): MenuItem | null {
    const q = normalizeSearchText(queryRaw);
    if (q.length < 3) return null;

    let best: MenuItem | null = null;
    let bestScore = Infinity;

    for (const item of items) {
        const nameNorm = normalizeSearchText(item.name);
        const d = levenshtein(q, nameNorm);
        const threshold = maxFuzzyDistanceForQuery(q.length) + 1;
        if (d <= threshold && d < bestScore) {
            bestScore = d;
            best = item;
        }
    }
    return best;
}

function categoryItems(cat: GuestPublicMenuCategory): MenuItem[] {
    return cat.items ?? [];
}

export function filterCategoriesBySearch(
    categories: GuestPublicMenuCategory[],
    queryRaw: string,
): GuestPublicMenuCategory[] {
    const q = normalizeSearchText(queryRaw);
    if (!q) {
        return categories.map((c) => ({ ...c, items: [...categoryItems(c)] }));
    }
    return categories
        .map((cat) => ({
            ...cat,
            items: categoryItems(cat).filter((item) => itemMatchesSearch(item, queryRaw)),
        }))
        .filter((cat) => cat.items.length > 0);
}

export function itemPassesDietFilters(item: MenuItem, selected: ReadonlySet<GuestDietFilterKey>): boolean {
    if (selected.size === 0) return true;
    const p = item.dietaryPreference;
    if (!p || p === "NONE") return false;
    return selected.has(p as GuestDietFilterKey);
}

export function filterCategoriesByDiet(
    categories: GuestPublicMenuCategory[],
    selected: ReadonlySet<GuestDietFilterKey>,
): GuestPublicMenuCategory[] {
    if (selected.size === 0) {
        return categories.map((c) => ({ ...c, items: [...categoryItems(c)] }));
    }
    return categories
        .map((cat) => ({
            ...cat,
            items: categoryItems(cat).filter((item) => itemPassesDietFilters(item, selected)),
        }))
        .filter((cat) => cat.items.length > 0);
}

export function sortMenuItems(items: readonly MenuItem[], sort: GuestMenuSort): MenuItem[] {
    if (sort === "default") return [...items];
    const copy = [...items];
    switch (sort) {
        case "name-asc":
            copy.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
            break;
        case "name-desc":
            copy.sort((a, b) => b.name.localeCompare(a.name, undefined, { sensitivity: "base" }));
            break;
        case "price-asc":
            copy.sort((a, b) => a.price - b.price);
            break;
        case "price-desc":
            copy.sort((a, b) => b.price - a.price);
            break;
        default:
            break;
    }
    return copy;
}

export function applySortToCategories(
    categories: GuestPublicMenuCategory[],
    sort: GuestMenuSort,
): GuestPublicMenuCategory[] {
    return categories.map((c) => ({ ...c, items: sortMenuItems(categoryItems(c), sort) }));
}

export function flattenMenuItems(categories: GuestPublicMenuCategory[]): MenuItem[] {
    return categories.flatMap((c) => categoryItems(c));
}
