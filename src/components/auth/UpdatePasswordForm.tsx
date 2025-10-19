import { useState } from "react";
import { Eye, EyeOff, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: "Co najmniej 8 znaków", test: (p) => p.length >= 8 },
  { label: "Wielka litera", test: (p) => /[A-Z]/.test(p) },
  { label: "Mała litera", test: (p) => /[a-z]/.test(p) },
  { label: "Cyfra", test: (p) => /[0-9]/.test(p) },
];

export function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const validatePassword = (password: string) => {
    return passwordRequirements.every((req) => req.test(password));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Client-side validation
    const newErrors: {
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!password) {
      newErrors.password = "Hasło jest wymagane";
    } else if (!validatePassword(password)) {
      newErrors.password = "Hasło musi spełniać wszystkie wymagania";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Potwierdzenie hasła jest wymagane";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Hasła nie są identyczne";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    // TODO: Replace with actual API call
    console.log("Password update attempt:", { password });

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // For now, just log success
      console.log("Password updated successfully (placeholder)");
      // TODO: Redirect to dashboard after successful update
    }, 1000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ustaw nowe hasło</CardTitle>
        <CardDescription>Wprowadź nowe hasło dla swojego konta</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {errors.general && (
            <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive rounded-md">
              {errors.general}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Nowe hasło</Label>
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

            {/* Password Requirements */}
            {password && (
              <div className="space-y-1 pt-2">
                {passwordRequirements.map((req, index) => {
                  const isValid = req.test(password);
                  return (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      {isValid ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={isValid ? "text-primary" : "text-muted-foreground"}>{req.label}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                aria-invalid={!!errors.confirmPassword}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Aktualizacja...
              </>
            ) : (
              "Zmień hasło"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

