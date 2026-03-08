"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { admin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      router.push(admin ? "/dashboard" : "/login");
    }
  }, [loading, admin, router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0f" }}>
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-t-[#d4a853] border-[rgba(255,255,255,0.1)] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-[#777]">Redirecting...</p>
      </div>
    </div>
  );
}
