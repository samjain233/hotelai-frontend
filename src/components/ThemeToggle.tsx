"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/Button";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    // Prevent hydration mismatch
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-lg" disabled>
                <div className="w-4 h-4" />
            </Button>
        );
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 relative overflow-hidden"
            title="Toggle Theme"
        >
            <Sun className="h-[1.1rem] w-[1.1rem] transition-all duration-300 rotate-0 scale-100 dark:-rotate-90 dark:scale-0 dark:opacity-0" />
            <Moon className="absolute h-[1.1rem] w-[1.1rem] transition-all duration-300 rotate-90 scale-0 opacity-0 dark:rotate-0 dark:scale-100 dark:opacity-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
