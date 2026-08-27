"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AdminPageSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    Check,
    Loader2,
    Wrench,
} from "lucide-react";

type Service = {
    id: string;
    name: string;
    description?: string | null;
    icon?: string | null;
    price: number;
    available: boolean;
    createdAt?: string;
    updatedAt?: string;
};

const DELETE_CONFIRM_WORD = "delete";

export default function ServiceCataloguePage() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);

    const [form, setForm] = useState({
        name: "",
        description: "",
        icon: "",
        price: "",
        available: true,
    });

    const [saving, setSaving] = useState(false);

    const [deleteConfirm, setDeleteConfirm] = useState<Service | null>(null);
    const [deleteInput, setDeleteInput] = useState("");
    const [deleting, setDeleting] = useState(false);

    const deletePhraseMatches =
        deleteInput.trim().toLowerCase() === DELETE_CONFIRM_WORD;

    async function loadServices() {
        setLoading(true);

        try {
            const data = await api.getServices();
            setServices(data);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to load services",
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadServices();
    }, []);

    function resetForm() {
        setForm({
            name: "",
            description: "",
            icon: "",
            price: "",
            available: true,
        });
        setEditingService(null);
    }

    function openNewService() {
        resetForm();
        setShowModal(true);
    }

    function openEditService(service: Service) {
        setEditingService(service);

        setForm({
            name: service.name,
            description: service.description ?? "",
            icon: service.icon ?? "",
            price: service.price > 0 ? String(service.price) : "",
            available: service.available ?? true,
        });

        setShowModal(true);
    }

    function closeModal() {
        if (saving) return;

        setShowModal(false);
        resetForm();
    }

    async function saveService(e: React.FormEvent) {
        e.preventDefault();

        if (!form.name.trim()) {
            toast.error("Service name is required");
            return;
        }

        const price = form.price.trim() === "" ? 0 : Number(form.price);

        if (!Number.isFinite(price) || price < 0) {
            toast.error("Price must be 0 or greater");
            return;
        }

        setSaving(true);

        try {
            const data = {
                name: form.name.trim(),
                description: form.description.trim() || undefined,
                icon: form.icon.trim() || undefined,
                price,
                available: form.available,
            };

            if (editingService) {
                await api.updateService(
                    editingService.id,
                    data as Parameters<typeof api.updateService>[1],
                );

                toast.success("Service updated successfully");
            } else {
                await api.createService(data);

                toast.success("Service added successfully");
            }

            closeModal();
            await loadServices();
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to save service",
            );
        } finally {
            setSaving(false);
        }
    }

    function openDeleteModal(service: Service) {
        setDeleteConfirm(service);
        setDeleteInput("");
    }

    function closeDeleteModal() {
        if (deleting) return;

        setDeleteConfirm(null);
        setDeleteInput("");
    }

    async function confirmDelete() {
        if (!deleteConfirm || !deletePhraseMatches) return;

        setDeleting(true);

        try {
            await api.deleteService(deleteConfirm.id);

            toast.success("Service deleted");

            closeDeleteModal();
            await loadServices();
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to delete service",
            );
        } finally {
            setDeleting(false);
        }
    }

    async function toggleAvailability(service: Service) {
        try {
            await api.updateService(service.id, {
                available: !service.available,
            });

            setServices((current) =>
                current.map((item) =>
                    item.id === service.id
                        ? { ...item, available: !item.available }
                        : item,
                ),
            );

            toast.success(
                !service.available
                    ? `${service.name} is now available`
                    : `${service.name} is now unavailable`,
            );
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : "Failed to update availability",
            );
        }
    }

    const filteredServices = services.filter((service) => {
        const query = search.trim().toLowerCase();

        if (!query) return true;

        return (
            service.name.toLowerCase().includes(query) ||
            service.description?.toLowerCase().includes(query)
        );
    });

    if (loading) {
        return <AdminPageSkeleton cardCount={6} />;
    }

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-[env(safe-area-inset-bottom,0px)]">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                        Services
                    </h1>

                    <p className="text-sm sm:text-base text-muted-foreground mt-1">
                        Manage the services guests can request.
                    </p>
                </div>

                <Button
                    className="w-full sm:w-auto min-h-11 justify-center"
                    onClick={openNewService}
                >
                    <Plus className="w-4 h-4 mr-2 shrink-0" />
                    Add Service
                </Button>
            </div>

            {/* Toolbar */}
            <div className="flex justify-end border-b border-border pb-3">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />

                    <input
                        type="search"
                        enterKeyHint="search"
                        placeholder="Search services..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full min-h-11 bg-secondary/50 border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                </div>
            </div>

            {/* Service cards */}
            {filteredServices.length === 0 ? (
                <div className="dashboard-card p-10 text-center">
                    <Wrench className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />

                    <h3 className="font-semibold text-foreground">
                        {search ? "No services found" : "No services yet"}
                    </h3>

                    <p className="text-sm text-muted-foreground mt-1">
                        {search
                            ? "Try a different search."
                            : "Add your first service for guests to request."}
                    </p>

                    {!search && (
                        <Button
                            className="mt-5"
                            onClick={openNewService}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Service
                        </Button>
                    )}
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
                >
                    {filteredServices.map((service) => (
                        <div
                            key={service.id}
                            className="dashboard-card p-5 flex flex-col group"
                        >
                            {/* Top */}
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 min-w-0">
                                    <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                                        <Wrench className="w-5 h-5 text-primary" />
                                    </div>

                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-foreground text-lg truncate">
                                            {service.name}
                                        </h3>

                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                            {service.description ||
                                                "No description"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-1">
                                    <button
                                        type="button"
                                        onClick={() => openEditService(service)}
                                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                                        aria-label={`Edit ${service.name}`}
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            openDeleteModal(service)
                                        }
                                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                        aria-label={`Delete ${service.name}`}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="mt-5 pt-4 border-t border-border">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        {service.price > 0 ? (
                                            <span className="text-lg font-bold text-foreground">
                                                ₹{service.price}
                                            </span>
                                        ) : (
                                            <span className="text-sm font-semibold text-emerald-500">
                                                Free
                                            </span>
                                        )}
                                    </div>

                                    {/* Availability */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            toggleAvailability(service)
                                        }
                                        aria-pressed={service.available}
                                        className={cn(
                                            "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                                            service.available
                                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                                                : "border-border bg-secondary text-muted-foreground",
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "w-2 h-2 rounded-full",
                                                service.available
                                                    ? "bg-emerald-500"
                                                    : "bg-muted-foreground",
                                            )}
                                        />

                                        {service.available
                                            ? "Available"
                                            : "Unavailable"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </motion.div>
            )}

            {/* Create / Edit modal */}
            <AnimatePresence>
                {showModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md"
                        onClick={closeModal}
                    >
                        <motion.div
                            initial={{
                                opacity: 0,
                                scale: 0.96,
                                y: 8,
                            }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                y: 0,
                            }}
                            exit={{
                                opacity: 0,
                                scale: 0.96,
                                y: 8,
                            }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-lg bg-card border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="px-5 sm:px-6 py-4 border-b border-white/10">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-foreground">
                                        {editingService
                                            ? "Edit Service"
                                            : "New Service"}
                                    </h3>

                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="p-2 -m-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
                                        aria-label="Close"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <form
                                onSubmit={saveService}
                                className="p-5 sm:p-6 space-y-5"
                            >
                                {/* Name */}
                                <div>
                                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                                        Service name
                                    </label>

                                    <Input
                                        placeholder="e.g. Laundry"
                                        value={form.name}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                name: e.target.value,
                                            })
                                        }
                                        required
                                        maxLength={100}
                                        className="h-11"
                                    />
                                </div>

                                {/* Price */}
                                <div>
                                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                                        Price (₹)
                                    </label>

                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0"
                                        value={form.price}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                price: e.target.value,
                                            })
                                        }
                                        className="h-11"
                                    />

                                    <p className="text-xs text-muted-foreground mt-1.5">
                                        Leave as 0 for a free service.
                                    </p>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                                        Description
                                    </label>

                                    <textarea
                                        placeholder="Briefly describe this service"
                                        value={form.description}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                description: e.target.value,
                                            })
                                        }
                                        maxLength={500}
                                        className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/80 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 min-h-[120px] resize-none"
                                    />
                                </div>

                                {/* Icon */}
                                <div>
                                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                                        Icon
                                    </label>

                                    <Input
                                        placeholder="e.g. laundry"
                                        value={form.icon}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                icon: e.target.value,
                                            })
                                        }
                                        maxLength={50}
                                        className="h-11"
                                    />

                                    <p className="text-xs text-muted-foreground mt-1.5">
                                        Optional. We can add a proper icon
                                        picker later.
                                    </p>
                                </div>

                                {/* Availability */}
                                <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-foreground">
                                            Available to guests
                                        </p>

                                        <p className="text-xs text-muted-foreground">
                                            Turn this off when the service
                                            cannot currently be requested.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={form.available}
                                        onClick={() =>
                                            setForm({
                                                ...form,
                                                available: !form.available,
                                            })
                                        }
                                        className={cn(
                                            "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                                            form.available
                                                ? "bg-emerald-500"
                                                : "bg-secondary border border-border",
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                                                form.available
                                                    ? "left-6"
                                                    : "left-1",
                                            )}
                                        />
                                    </button>
                                </div>

                                {/* Footer */}
                                <div className="flex gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1 h-11 rounded-xl"
                                        onClick={closeModal}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </Button>

                                    <Button
                                        type="submit"
                                        loading={saving}
                                        className="flex-1 h-11 rounded-xl"
                                    >
                                        {editingService
                                            ? "Save Changes"
                                            : "Add Service"}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete confirmation */}
            <AnimatePresence>
                {deleteConfirm && (
                    <div
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
                        onClick={closeDeleteModal}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6"
                        >
                            <h3 className="text-lg font-semibold text-foreground">
                                Delete service?
                            </h3>

                            <p className="text-sm text-muted-foreground mt-2">
                                This will permanently delete{" "}
                                <strong className="text-foreground">
                                    {deleteConfirm.name}
                                </strong>
                                .
                            </p>

                            <div className="mt-5">
                                <label className="text-sm font-medium text-foreground mb-1.5 block">
                                    Type{" "}
                                    <span className="font-mono text-destructive">
                                        delete
                                    </span>{" "}
                                    to confirm
                                </label>

                                <Input
                                    value={deleteInput}
                                    onChange={(e) =>
                                        setDeleteInput(e.target.value)
                                    }
                                    placeholder="delete"
                                    className="h-11"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3 mt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={closeDeleteModal}
                                    disabled={deleting}
                                >
                                    Cancel
                                </Button>

                                <Button
                                    type="button"
                                    variant="destructive"
                                    className="flex-1"
                                    disabled={
                                        !deletePhraseMatches || deleting
                                    }
                                    onClick={confirmDelete}
                                >
                                    {deleting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete
                                        </>
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}