import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { loginSchema } from "@/lib/validation/auth.schemas";
import type { LoginRequest } from "@/types/auth/types";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [generalError, setGeneralError] = useState<string>("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(globalThis.location.search);
    const message = urlParams.get("message");
    if (message) {
      toast.success(message);
      const newUrl = globalThis.location.pathname;
      globalThis.history.replaceState({}, "", newUrl);
    }
  }, []);

  const onSubmit = async (data: LoginRequest) => {
    setGeneralError("");

    try {
      // Call login API
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (response.ok) {
        // Login successful - redirect to intended page or dashboard
        const urlParams = new URLSearchParams(globalThis.location.search);
        const redirectTo = urlParams.get("redirect") || "/";
        // eslint-disable-next-line react-compiler/react-compiler
        globalThis.location.href = redirectTo;
      } else {
        // Handle API errors
        setGeneralError(responseData.message || "Wystąpił błąd podczas logowania. Spróbuj ponownie.");
      }
    } catch {
      setGeneralError("Wystąpił błąd podczas logowania. Sprawdź połączenie internetowe i spróbuj ponownie.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zaloguj się</CardTitle>
        <CardDescription>Wprowadź swoje dane aby uzyskać dostęp do konta</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {generalError && (
            <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive rounded-md">
              {generalError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="twoj@email.com"
              {...register("email")}
              disabled={isSubmitting}
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Hasło</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("password")}
                disabled={isSubmitting}
                aria-invalid={!!errors.password}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>

          <div className="text-right">
            <a href="/reset-password" className="text-sm text-primary hover:underline">
              Zapomniałeś hasła?
            </a>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 mt-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logowanie...
              </>
            ) : (
              "Zaloguj się"
            )}
          </Button>

          <p className="text-sm text-center text-muted-foreground">
            Nie masz konta?{" "}
            <a href="/register" className="text-primary hover:underline font-medium">
              Zarejestruj się
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
