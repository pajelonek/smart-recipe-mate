import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { passwordRequirements, updatePasswordSchema, type UpdatePasswordData } from "@/lib/validation/auth.schemas";

interface UpdatePasswordFormProps {
  hasSession?: boolean;
}

const redirectToLogin = () => {
  globalThis.location.href = "/login?message=password_updated";
};

export function UpdatePasswordForm({ hasSession = false }: UpdatePasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [generalError, setGeneralError] = useState<string>();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordData>({
    resolver: zodResolver(updatePasswordSchema),
    mode: "onChange",
  });

  const password = watch("password");

  const onSubmit = async (data: UpdatePasswordData) => {
    setGeneralError(undefined);

    try {
      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setGeneralError(result.message || "Wystąpił błąd podczas aktualizacji hasła");
        return;
      }

      redirectToLogin();
    } catch {
      setGeneralError("Wystąpił błąd połączenia. Spróbuj ponownie.");
    }
  };

  if (!hasSession) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Link resetujący wygasł</CardTitle>
          <CardDescription>
            Wygląda na to, że nie ma aktywnej sesji resetowania hasła. Kliknij w link z emaila lub poproś o nowy.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild variant="default" className="w-full">
            <a href="/reset-password">Poproś o nowy link resetujący</a>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <a href="/login">Powrót do logowania</a>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ustaw nowe hasło</CardTitle>
        <CardDescription>Wprowadź nowe hasło dla swojego konta</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {generalError && (
            <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive rounded-md">
              {generalError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Nowe hasło</Label>
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

            {/* Password Requirements */}
            {password && (
              <div className="space-y-1 pt-2">
                {passwordRequirements.map((req) => {
                  const isValid = req.test(password);
                  return (
                    <div key={req.label} className="flex items-center gap-2 text-sm">
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

            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("confirmPassword")}
                disabled={isSubmitting}
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
            {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
          </div>
        </CardContent>

        <CardFooter className="mt-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
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
