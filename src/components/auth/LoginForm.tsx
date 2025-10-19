import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [successMessage, setSuccessMessage] = useState<string>("");

  useEffect(() => {
    const urlParams = new URLSearchParams(globalThis.location.search);
    const message = urlParams.get("message");
    if (message) {
      setSuccessMessage(message);
      const newUrl = globalThis.location.pathname;
      globalThis.history.replaceState({}, "", newUrl);
    }
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Client-side validation
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = "Email jest wymagany";
    } else if (!validateEmail(email)) {
      newErrors.email = "Wprowadź prawidłowy adres email";
    }

    if (!password) {
      newErrors.password = "Hasło jest wymagane";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      // Call login API
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Login successful - redirect to intended page or dashboard
        const urlParams = new URLSearchParams(globalThis.location.search);
        const redirectTo = urlParams.get("redirect") || "/";
        globalThis.location.href = redirectTo;
      } else {
        // Handle API errors
        setErrors({ general: data.message || "Wystąpił błąd podczas logowania. Spróbuj ponownie." });
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrors({ general: "Wystąpił błąd podczas logowania. Sprawdź połączenie internetowe i spróbuj ponownie." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zaloguj się</CardTitle>
        <CardDescription>Wprowadź swoje dane aby uzyskać dostęp do konta</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {successMessage && (
            <div className="p-3 text-sm text-green-800 dark:text-green-200 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
              {successMessage}
            </div>
          )}

          {errors.general && (
            <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive rounded-md">
              {errors.general}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="twoj@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Hasło</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
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
            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
          </div>

          <div className="text-right">
            <a href="/reset-password" className="text-sm text-primary hover:underline">
              Zapomniałeś hasła?
            </a>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 mt-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
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
