export function randomPin() {
    return String(Math.floor(1000 + Math.random() * 9000));
}

/** "Today, 2:15 pm", "Yesterday, 11:00 am" or "31 Oct, 9:30 am". */
export function formatCheckIn(iso?: string | null) {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return `Today, ${time}`;
    if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
    return `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}, ${time}`;
}

/** Whole nights since check-in, counting from the calendar day. */
export function nightsSince(iso?: string | null) {
    if (!iso) return 0;
    const start = new Date(iso);
    if (Number.isNaN(start.getTime())) return 0;
    start.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((now.getTime() - start.getTime()) / 86_400_000));
}
