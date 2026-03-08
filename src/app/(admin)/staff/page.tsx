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
    Eye,
    EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

interface StaffMember {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: string;
}

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

export default function StaffPage() {
    const { admin } = useAuth();
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInvite, setShowInvite] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);

    // Invite form state
    const [invName, setInvName] = useState("");
    const [invEmail, setInvEmail] = useState("");
    const [invPassword, setInvPassword] = useState("");
    const [invRole, setInvRole] = useState("MANAGER");
    const [showPassword, setShowPassword] = useState(false);
    const [inviting, setInviting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        loadStaff();
    }, []);

    async function loadStaff() {
        try {
            const data = await api.getStaff();
            setStaff(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }

    async function handleInvite(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setInviting(true);
        try {
            await api.inviteStaff({
                name: invName,
                email: invEmail,
                password: invPassword,
                role: invRole,
            });
            setInvName(""); setInvEmail(""); setInvPassword(""); setInvRole("MANAGER");
            setShowInvite(false);
            await loadStaff();
        } catch (err: any) {
            setError(err.message || "Failed to invite staff");
        } finally {
            setInviting(false);
        }
    }

    async function handleRemove(id: string) {
        if (!confirm("Are you sure you want to remove this staff member? They will lose access immediately.")) return;
        setRemovingId(id);
        try {
            await api.removeStaff(id);
            setStaff(prev => prev.filter(s => s.id !== id));
        } catch (err: any) {
            alert(err.message || "Failed to remove staff");
        } finally {
            setRemovingId(null);
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Staff Management</h1>
                    <p className="text-muted-foreground mt-1">
                        {staff.length} team member{staff.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <Button onClick={() => setShowInvite(!showInvite)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite Staff
                </Button>
            </div>

            {/* Invite Form */}
            <AnimatePresence>
                {showInvite && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <form onSubmit={handleInvite} className="glass-panel rounded-xl p-6 space-y-4">
                            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-primary" />
                                Invite New Staff Member
                            </h3>

                            {error && (
                                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                                        Full Name
                                    </label>
                                    <Input
                                        required
                                        value={invName}
                                        onChange={(e) => setInvName(e.target.value)}
                                        placeholder="John Doe"
                                        className="bg-secondary/50"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                                        Email
                                    </label>
                                    <Input
                                        required
                                        type="email"
                                        value={invEmail}
                                        onChange={(e) => setInvEmail(e.target.value)}
                                        placeholder="john@hotel.com"
                                        className="bg-secondary/50"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                                        Temporary Password
                                    </label>
                                    <div className="relative">
                                        <Input
                                            required
                                            type={showPassword ? "text" : "password"}
                                            minLength={6}
                                            value={invPassword}
                                            onChange={(e) => setInvPassword(e.target.value)}
                                            placeholder="Min 6 characters"
                                            className="bg-secondary/50 pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                                        Role
                                    </label>
                                    <select
                                        value={invRole}
                                        onChange={(e) => setInvRole(e.target.value)}
                                        className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        {INVITABLE_ROLES.map(r => (
                                            <option key={r.value} value={r.value}>{r.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={() => setShowInvite(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={inviting}>
                                    {inviting ? "Sending Invite..." : "Create Staff Account"}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Staff List */}
            <div className="space-y-3">
                {staff.map(member => {
                    const config = ROLE_CONFIG[member.role] || ROLE_CONFIG.MANAGER;
                    const RoleIcon = config.icon;
                    const isCurrentUser = member.id === admin?.id;

                    return (
                        <motion.div
                            key={member.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                "glass-panel p-4 flex items-center gap-4 transition-all hover:bg-secondary/50",
                                isCurrentUser && "ring-1 ring-primary/30 bg-primary/5"
                            )}
                        >
                            {/* Avatar */}
                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", config.bg)}>
                                <RoleIcon className={cn("w-5 h-5", config.color)} />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-foreground truncate">{member.name}</span>
                                    {isCurrentUser && (
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                            You
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                            </div>

                            {/* Role Badge */}
                            <span className={cn(
                                "text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap",
                                config.bg, config.color
                            )}>
                                {config.label}
                            </span>

                            {/* Joined Date */}
                            <span className="text-xs text-muted-foreground hidden sm:block whitespace-nowrap">
                                Joined {new Date(member.createdAt).toLocaleDateString()}
                            </span>

                            {/* Remove Button — not for OWNER or self */}
                            {member.role !== "OWNER" && !isCurrentUser && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={removingId === member.id}
                                    onClick={() => handleRemove(member.id)}
                                    className="text-destructive hover:bg-destructive/10 flex-shrink-0"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {staff.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-lg font-medium">No staff members yet</p>
                    <p className="text-sm">Click &quot;Invite Staff&quot; to add your team</p>
                </div>
            )}
        </div>
    );
}
