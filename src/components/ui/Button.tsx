"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
    size?: "sm" | "md" | "lg" | "icon";
    loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", loading, children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={loading || props.disabled}
                className={cn(
                    "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    {
                        "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]": variant === "primary",
                        "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-white/5": variant === "secondary",
                        "bg-transparent border border-white/10 hover:bg-white/5 hover:text-foreground text-foreground": variant === "outline",
                        "hover:bg-white/5 hover:text-foreground text-muted-foreground": variant === "ghost",
                        "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20": variant === "destructive",
                    },
                    {
                        "h-8 px-3 text-xs": size === "sm",
                        "h-10 px-4 text-sm": size === "md",
                        "h-12 px-6 text-base": size === "lg",
                        "h-10 w-10 p-0": size === "icon",
                    },
                    loading && "opacity-70 cursor-wait",
                    className
                )}
                {...props}
            >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);
Button.displayName = "Button";

export { Button };
