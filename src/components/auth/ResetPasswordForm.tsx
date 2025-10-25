import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { resetPasswordSchema, type ResetPasswordData } from "@/lib/validation/auth.schemas";

export function ResetPasswordForm() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordData) => {
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        setError("root.serverError", {
          type: "manual",
          message: responseData.message || "Wystąpił błąd podczas wysyłania linku resetującego",
        });
        return;
      }

      setSubmittedEmail(data.email);
      setIsSuccess(true);
    } catch {
      setError("root.serverError", {
        type: "manual",
        message: "Wystąpił błąd połączenia. Spróbuj ponownie.",
      });
    }
  };

  if (isSuccess) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <CheckCircle2 className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-center">Link wysłany!</CardTitle>
          <CardDescription className="text-center">
            Sprawdź swoją skrzynkę email. Wysłaliśmy link do resetowania hasła na adres{" "}
            <strong>{submittedEmail}</strong>
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col space-y-4">
          <Button asChild className="w-full">
            <a href="/login">Powrót do logowania</a>
          </Button>
          <button
            onClick={() => setIsSuccess(false)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Nie otrzymałeś emaila? Spróbuj ponownie
          </button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zresetuj hasło</CardTitle>
        <CardDescription>Wprowadź swój adres email aby otrzymać link do resetowania hasła</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {errors.root?.serverError && (
            <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive rounded-md">
              {errors.root.serverError.message}
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
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 mt-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wysyłanie...
              </>
            ) : (
              "Wyślij link resetujący"
            )}
          </Button>

          <a
            href="/login"
            className="text-sm text-center text-muted-foreground hover:text-foreground transition-colors"
          >
            Powrót do logowania
          </a>
        </CardFooter>
      </form>
    </Card>
  );
}
