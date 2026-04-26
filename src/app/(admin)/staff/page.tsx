"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    UserPlus,
    Trash2,
    Shield,
    ChefHat,
    Headset,
    Crown,
    Copy,
    Check,
    KeyRound,
    Clock,
    Ban,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { AdminPageSkeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";
import type { StaffListMember } from "@/lib/types";

interface PendingInvite {
    id: string;
    name: string;
    role: string;
    expiresAt: string | null;
    createdAt: string;
}

const STAFF_KEY_EMAIL_SUFFIX = "@staff.dreamcanvas.internal";

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Shield }> = {
    OWNER: { label: "Owner", color: "text-purple-400", bg: "bg-purple-500/10", icon: Crown },
    MANAGER: { label: "Manager", color: "text-blue-400", bg: "bg-blue-500/10", icon: Shield },
    KITCHEN: { label: "Kitchen", color: "text-amber-400", bg: "bg-amber-500/10", icon: ChefHat },
    FRONT_DESK: { label: "Front Desk", color: "text-emerald-400", bg: "bg-emerald-500/10", icon: Headset },
};

const INVITABLE_ROLES = [
    { value: "MANAGER", label: "Manager — Full access except staff management" },
    { value: "KITCHEN", label: "Kitchen — Orders & Kitchen display only" },
    { value: "FRONT_DESK", label: "Front Desk — Orders, Services, Rooms" },
];

const INVITE_VALIDITY_OPTIONS: { value: string; label: string }[] = [
    { value: "1d", label: "1 day" },
    { value: "7d", label: "1 week" },
    { value: "30d", label: "1 month" },
    { value: "90d", label: "3 months" },
    { value: "365d", label: "1 year" },
    { value: "lifetime", label: "Lifetime (until you revoke)" },
];

function formatInviteExpiryLabel(iso: string | null): string {
    if (iso == null) return "No calendar expiry — revoke the key anytime to disable it";
    try {
        return `Expires ${new Date(iso).toLocaleString()}`;
    } catch {
        return `Expires ${iso}`;
    }
}

function isKeyOnlyStaffEmail(email: string) {
    return email.endsWith(STAFF_KEY_EMAIL_SUFFIX);
}

export default function StaffPage() {
    const { admin } = useAuth();
    const [staff, setStaff] = useState<StaffListMember[]>([]);
    const [pending, setPending] = useState<PendingInvite[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInvite, setShowInvite] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [revokingInvitationId, setRevokingInvitationId] = useState<string | null>(null);

    const [invName, setInvName] = useState("");
    const [invRole, setInvRole] = useState("MANAGER");
    const [invValidity, setInvValidity] = useState("30d");
    const [inviting, setInviting] = useState(false);
    const [error, setError] = useState("");

    const [keyModal, setKeyModal] = useState<{
        inviteKey: string;
        expiresAt: string | null;
        name: string;
        role: string;
    } | null>(null);
    const [copied, setCopied] = useState(false);

    const staffAccessUrl =
        typeof window !== "undefined" ? `${window.location.origin}/staff/access` : "/staff/access";

    useEffect(() => {
        loadAll();
    }, []);

    async function loadAll() {
        setLoading(true);
        try {
            const [s, p] = await Promise.all([api.getStaff(), api.getPendingStaffInvitations()]);
            setStaff(s);
            setPending(p);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleInvite(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setInviting(true);
        try {
            const res = await api.inviteStaff({
                name: invName.trim(),
                role: invRole,
                validity: invValidity,
            });
            setInvName("");
            setInvRole("MANAGER");
            setInvValidity("30d");
            setShowInvite(false);
            setKeyModal({
                inviteKey: res.inviteKey,
                expiresAt: res.expiresAt,
                name: res.name,
                role: res.role,
            });
            setCopied(false);
            await loadAll();
            toast.success("Access key created — copy it now; it won’t be shown again.");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to create invite");
        } finally {
            setInviting(false);
        }
    }

    async function copyKey() {
        if (!keyModal) return;
        try {
            await navigator.clipboard.writeText(keyModal.inviteKey);
            setCopied(true);
            toast.success("Key copied");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Could not copy");
        }
    }

    async function handleRemove(id: string) {
        if (!confirm("Remove this staff member? They will lose access immediately.")) return;
        setRemovingId(id);
        try {
            await api.removeStaff(id);
            setStaff((prev) => prev.filter((s) => s.id !== id));
            toast.success("Staff removed");
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to remove");
        } finally {
            setRemovingId(null);
        }
    }

    async function handleRevokeInvitation(invitationId: string) {
        if (!confirm("Revoke this access key? It will stop working immediately.")) return;
        setRevokingInvitationId(invitationId);
        try {
            await api.revokeStaffInvitation(invitationId);
            await loadAll();
            toast.success("Access key revoked");
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to revoke");
        } finally {
            setRevokingInvitationId(null);
        }
    }

    if (loading) return <AdminPageSkeleton cardCount={4} />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Staff Management</h1>
                    <p className="mt-1 text-muted-foreground">
                        {staff.length} team member{staff.length !== 1 ? "s" : ""}
                        {pending.length > 0 ? ` · ${pending.length} pending invite${pending.length !== 1 ? "s" : ""}` : ""}
                    </p>
                </div>
                <Button onClick={() => setShowInvite(!showInvite)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create access key
                </Button>
            </div>

            <AnimatePresence>
                {showInvite && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <form
                            onSubmit={handleInvite}
                            className="glass-panel space-y-4 rounded-xl p-6"
                        >
                            <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                                <KeyRound className="h-5 w-5 text-primary" />
                                New staff access key
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Add a name and role. We’ll generate a one-time key you can share. Staff opens{" "}
                                <span className="font-mono text-foreground/80">{staffAccessUrl}</span> and pastes
                                the key — no email or password.
                            </p>
                            {error && (
                                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400">
                                    {error}
                                </div>
                            )}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Name (for your reference)
                                    </label>
                                    <Input
                                        required
                                        value={invName}
                                        onChange={(e) => setInvName(e.target.value)}
                                        placeholder="e.g. Kitchen tablet"
                                        className="bg-secondary/50"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Role
                                    </label>
                                    <select
                                        value={invRole}
                                        onChange={(e) => setInvRole(e.target.value)}
                                        className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        {INVITABLE_ROLES.map((r) => (
                                            <option key={r.value} value={r.value}>
                                                {r.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Key valid for
                                    </label>
                                    <select
                                        value={invValidity}
                                        onChange={(e) => setInvValidity(e.target.value)}
                                        className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        {INVITE_VALIDITY_OPTIONS.map((o) => (
                                            <option key={o.value} value={o.value}>
                                                {o.label}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                                        Timed options: the key stops working after this window (including for people
                                        who already used it). Lifetime: the key works until you revoke it from the
                                        staff list or pending keys.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={() => setShowInvite(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={inviting}>
                                    {inviting ? "Creating…" : "Generate key"}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {pending.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Pending keys (not used yet)
                    </h2>
                    {pending.map((p) => {
                        const config = ROLE_CONFIG[p.role] || ROLE_CONFIG.MANAGER;
                        const RoleIcon = config.icon;
                        return (
                            <div
                                key={p.id}
                                className="glass-panel flex items-center gap-4 rounded-xl border border-dashed border-amber-500/20 p-4"
                            >
                                <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", config.bg)}>
                                    <RoleIcon className={cn("h-5 w-5", config.color)} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-foreground">{p.name}</p>
                                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3 shrink-0" />
                                        {formatInviteExpiryLabel(p.expiresAt)}
                                    </p>
                                </div>
                                <span
                                    className={cn(
                                        "rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap",
                                        config.bg,
                                        config.color,
                                    )}
                                >
                                    {config.label}
                                </span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    type="button"
                                    title="Revoke access key"
                                    disabled={revokingInvitationId === p.id}
                                    onClick={() => handleRevokeInvitation(p.id)}
                                    className="shrink-0 text-destructive hover:bg-destructive/10"
                                >
                                    <Ban className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="space-y-3">
                {staff.map((member) => {
                    const config = ROLE_CONFIG[member.role] || ROLE_CONFIG.MANAGER;
                    const RoleIcon = config.icon;
                    const isCurrentUser = member.id === admin?.id;
                    const keyStaff = isKeyOnlyStaffEmail(member.email);
                    const inv = member.staffInvitation;
                    const canRevokeKey = Boolean(inv?.id && !inv.revokedAt);

                    return (
                        <motion.div
                            key={member.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                "glass-panel flex items-center gap-4 p-4 transition-all hover:bg-secondary/50",
                                isCurrentUser && "bg-primary/5 ring-1 ring-primary/30",
                            )}
                        >
                            <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", config.bg)}>
                                <RoleIcon className={cn("h-5 w-5", config.color)} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="truncate font-semibold text-foreground">{member.name}</span>
                                    {isCurrentUser && (
                                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                            You
                                        </span>
                                    )}
                                </div>
                                <p className="truncate text-sm text-muted-foreground">
                                    {keyStaff ? (
                                        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                            <span className="inline-flex items-center gap-1">
                                                <KeyRound className="h-3.5 w-3.5 shrink-0" />
                                                Signed in with access key
                                            </span>
                                            {inv?.revokedAt ? (
                                                <span className="text-[11px] text-amber-600 dark:text-amber-400">
                                                    Key revoked — existing session may work until they sign out
                                                </span>
                                            ) : null}
                                        </span>
                                    ) : (
                                        member.email
                                    )}
                                </p>
                            </div>
                            <span
                                className={cn(
                                    "rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap",
                                    config.bg,
                                    config.color,
                                )}
                            >
                                {config.label}
                            </span>
                            <span className="hidden whitespace-nowrap text-xs text-muted-foreground sm:block">
                                Joined {new Date(member.createdAt).toLocaleDateString()}
                            </span>
                            {member.role !== "OWNER" && !isCurrentUser && (
                                <div className="flex shrink-0 items-center gap-1">
                                    {canRevokeKey ? (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            type="button"
                                            title="Revoke access key"
                                            disabled={revokingInvitationId === inv!.id}
                                            onClick={() => handleRevokeInvitation(inv!.id)}
                                            className="text-amber-700 hover:bg-amber-500/10 dark:text-amber-400"
                                        >
                                            <Ban className="h-3.5 w-3.5" />
                                        </Button>
                                    ) : null}
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        type="button"
                                        disabled={removingId === member.id}
                                        onClick={() => handleRemove(member.id)}
                                        className="text-destructive hover:bg-destructive/10"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {staff.length === 0 && pending.length === 0 && (
                <div className="py-16 text-center text-muted-foreground">
                    <Users className="mx-auto mb-3 h-12 w-12 opacity-30" />
                    <p className="text-lg font-medium">No staff yet</p>
                    <p className="text-sm">Create an access key and share it with your team</p>
                </div>
            )}

            <AnimatePresence>
                {keyModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                        onClick={() => setKeyModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.96 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.96 }}
                            className="glass-panel max-w-md rounded-2xl border border-border p-6 shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="mb-1 text-lg font-semibold text-foreground">Save this key</h3>
                            <p className="mb-4 text-sm text-muted-foreground">
                                It won’t be shown again. Staff opens{" "}
                                <span className="break-all font-mono text-xs text-foreground">{staffAccessUrl}</span>{" "}
                                and pastes the key.
                            </p>
                            <div className="mb-2 rounded-xl bg-secondary/80 p-3 font-mono text-sm break-all text-foreground">
                                {keyModal.inviteKey}
                            </div>
                            <p className="mb-4 text-xs text-muted-foreground">
                                {keyModal.name} · {ROLE_CONFIG[keyModal.role]?.label ?? keyModal.role} ·{" "}
                                {formatInviteExpiryLabel(keyModal.expiresAt)}
                            </p>
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" className="flex-1" onClick={copyKey}>
                                    {copied ? (
                                        <Check className="mr-2 h-4 w-4 text-emerald-500" />
                                    ) : (
                                        <Copy className="mr-2 h-4 w-4" />
                                    )}
                                    {copied ? "Copied" : "Copy key"}
                                </Button>
                                <Button type="button" className="flex-1" onClick={() => setKeyModal(null)}>
                                    Done
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
