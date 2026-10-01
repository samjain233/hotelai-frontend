"use client";

import { useAdminNavigation } from "@/hooks/useSwrApi";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function FeatureGuard({ children, requiredPath }: { children: React.ReactNode, requiredPath?: string }) {
    const { data: navigation = [], isLoading } = useAdminNavigation();
    const pathname = usePathname();
    const pathToCheck = requiredPath || pathname;

    if (isLoading) {
        return (
            <div className="flex h-full min-h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const hasAccess = navigation.some((nav) => nav.href === pathToCheck);

    if (!hasAccess) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-4">
                <div className="bg-primary/5 p-6 rounded-full mb-6">
                    <Lock className="h-12 w-12 text-primary" />
                </div>
                <h1 className="text-3xl font-playfair font-semibold mb-4 text-foreground">Digital Experience Locked</h1>
                <p className="text-muted-foreground text-lg max-w-md mb-8 leading-relaxed">
                    This feature is not available on your current subscription plan. Upgrade your plan to unlock advanced digital experiences and operations.
                </p>
                <div className="flex gap-4">
                    <Link href="/settings">
                        <Button variant="primary" size="lg">Manage Subscription</Button>
                    </Link>
                    <Link href="/dashboard">
                        <Button variant="outline" size="lg">Back to Dashboard</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
