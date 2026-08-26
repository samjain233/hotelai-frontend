"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, ShieldCheck, X, Loader2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { setStaySession, getStayPin } from "@/lib/staySession";
import { toast } from "sonner";

interface StayPinModalProps {
    isOpen: boolean;
    onClose: () => void;
    roomId: string;
    roomNumber: string;
    onSuccess: (stayToken: string) => void;
}

export function StayPinModal({
    isOpen,
    onClose,
    roomId,
    roomNumber,
    onSuccess,
}: StayPinModalProps) {
    const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (isOpen) {
            const existingPin = getStayPin(roomId);
            if (existingPin && existingPin.length === 4) {
                setDigits(existingPin.split(""));
            } else {
                setDigits(["", "", "", ""]);
            }
            setError(null);
            setTimeout(() => {
                inputRefs.current[0]?.focus();
            }, 150);
        }
    }, [isOpen, roomId]);

    const handleDigitChange = (index: number, value: string) => {
        setError(null);
        const val = value.replace(/\D/g, "");

        if (!val) {
            const next = [...digits];
            next[index] = "";
            setDigits(next);
            return;
        }

        // Handling paste of multiple digits
        if (val.length > 1) {
            const pasted = val.slice(0, 4).split("");
            const next = ["", "", "", ""];
            for (let i = 0; i < pasted.length; i++) {
                next[i] = pasted[i];
            }
            setDigits(next);
            if (pasted.length === 4) {
                inputRefs.current[3]?.focus();
                handleSubmit(next.join(""));
            } else {
                inputRefs.current[pasted.length]?.focus();
            }
            return;
        }

        const next = [...digits];
        next[index] = val;
        setDigits(next);

        if (index < 3 && val) {
            inputRefs.current[index + 1]?.focus();
        }

        const fullCode = next.join("");
        if (fullCode.length === 4) {
            handleSubmit(fullCode);
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleSubmit = async (pinCode?: string) => {
        const pin = pinCode || digits.join("");
        if (pin.length !== 4) {
            setError("Please enter the full 4-digit PIN");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await api.verifyGuestRoomPin(roomId, pin);
            if (res.stayToken) {
                setStaySession(roomId, res.stayToken, pin);
                toast.success(`Verified! Welcome to Room ${roomNumber}`);
                onSuccess(res.stayToken);
                onClose();
            } else {
                setError("Verification failed. Please try again.");
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Invalid Stay PIN";
            setError(msg);
            // Shake or clear digits on error
            setDigits(["", "", "", ""]);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="relative w-full max-w-sm overflow-hidden bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 text-zinc-900 dark:text-zinc-100"
                >
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Icon & Title */}
                    <div className="flex flex-col items-center text-center mt-2 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                            <KeyRound className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold tracking-tight">
                            Room {roomNumber} Stay PIN
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-[260px] leading-relaxed">
                            Enter the 4-digit PIN provided by front desk at check-in (on your keycard).
                        </p>
                    </div>

                    {/* 4 Digit Boxes */}
                    <div className="flex justify-center gap-3 mb-4">
                        {digits.map((d, i) => (
                            <input
                                key={i}
                                ref={(el) => { inputRefs.current[i] = el; }}
                                type="password"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={4}
                                value={d}
                                disabled={loading}
                                onChange={(e) => handleDigitChange(i, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(i, e)}
                                className={`w-13 h-14 text-center text-2xl font-mono font-bold rounded-2xl border transition-all outline-none ${
                                    error
                                        ? "border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400"
                                        : d
                                        ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800/80 shadow-sm"
                                        : "border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/40 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                                }`}
                            />
                        ))}
                    </div>

                    {/* Error display */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-center gap-1.5 text-red-600 dark:text-red-400 text-xs font-medium mb-4 text-center"
                        >
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{error}</span>
                        </motion.div>
                    )}

                    {/* Submit Button */}
                    <button
                        onClick={() => handleSubmit()}
                        disabled={loading || digits.join("").length !== 4}
                        className="w-full py-3.5 px-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-2xl font-semibold text-sm transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Verifying...</span>
                            </>
                        ) : (
                            <>
                                <ShieldCheck className="w-4 h-4" />
                                <span>Verify & Continue</span>
                            </>
                        )}
                    </button>

                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 text-center mt-3">
                        🔒 Verified once for your entire stay on this phone.
                    </p>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
