/** Must match backend CreateBulkRoomsDto ArrayMaxSize */
export const MAX_ROOMS_PER_BATCH = 100;

/**
 * Parse flexible room input for bulk add:
 * - Single: `101` or `10A`
 * - List: `101, 102, 105`
 * - Range (numeric only): `101-105` → 101,102,103,104,105
 * - Combined: `101-103, 201, 305-306`
 */
export function parseRoomNumbersInput(raw: string): { numbers: string[]; error?: string } {
    const trimmed = raw.trim();
    if (!trimmed) {
        return { numbers: [], error: "Enter at least one room number." };
    }

    const segments = trimmed
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    const out: string[] = [];
    const seen = new Set<string>();

    const add = (n: string) => {
        if (seen.has(n)) return;
        seen.add(n);
        out.push(n);
    };

    for (const part of segments) {
        const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/);
        if (rangeMatch) {
            let a = parseInt(rangeMatch[1], 10);
            let b = parseInt(rangeMatch[2], 10);
            if (Number.isNaN(a) || Number.isNaN(b)) {
                return { numbers: [], error: `Invalid range: ${part}` };
            }
            if (a > b) [a, b] = [b, a];
            const span = b - a + 1;
            if (span > MAX_ROOMS_PER_BATCH) {
                return {
                    numbers: [],
                    error: `Range ${a}–${b} is too large (max ${MAX_ROOMS_PER_BATCH} rooms in one range).`,
                };
            }
            for (let i = a; i <= b; i++) {
                if (out.length >= MAX_ROOMS_PER_BATCH) {
                    return {
                        numbers: [],
                        error: `Cannot add more than ${MAX_ROOMS_PER_BATCH} rooms at once.`,
                    };
                }
                add(String(i));
            }
        } else {
            if (out.length >= MAX_ROOMS_PER_BATCH) {
                return {
                    numbers: [],
                    error: `Cannot add more than ${MAX_ROOMS_PER_BATCH} rooms at once.`,
                };
            }
            add(part);
        }
    }

    if (out.length === 0) {
        return { numbers: [], error: "Enter at least one room number." };
    }

    return { numbers: out };
}
