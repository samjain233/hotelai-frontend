/** Query params that are secrets (reset / verification tokens) or personal data; never sent to analytics. */
const SENSITIVE_PARAMS = ["token", "email"] as const;

export function redactSensitiveUrl(url: string): string {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return url;
    }
    let changed = false;
    for (const name of SENSITIVE_PARAMS) {
        if (parsed.searchParams.has(name)) {
            parsed.searchParams.delete(name);
            changed = true;
        }
    }
    return changed ? parsed.toString() : url;
}
