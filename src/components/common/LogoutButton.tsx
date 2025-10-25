import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogoutButtonProps {
  readonly variant?: "default" | "outline" | "ghost" | "destructive";
  readonly size?: "default" | "sm" | "lg" | "icon";
  readonly showIcon?: boolean;
  readonly className?: string;
}

export function LogoutButton({
  variant = "outline",
  size = "default",
  showIcon = false,
  className,
}: Readonly<LogoutButtonProps>) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Logout error:", error);
        // Even if there's an error, redirect to home - the session should be cleared client-side
      }

      // Redirect to home page
      globalThis.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's a network error, try to redirect
      globalThis.location.href = "/";
    }
  };

  return (
    <Button variant={variant} size={size} onClick={handleLogout} disabled={isLoading} className={className}>
      {showIcon && <LogOut className="h-4 w-4 mr-2" />}
      {isLoading ? "Wylogowywanie..." : "Wyloguj się"}
    </Button>
  );
}
