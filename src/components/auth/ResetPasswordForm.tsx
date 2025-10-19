import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; general?: string }>({});

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Client-side validation
    const newErrors: { email?: string } = {};

    if (!email) {
      newErrors.email = "Email jest wymagany";
    } else if (!validateEmail(email)) {
      newErrors.email = "Wprowadź prawidłowy adres email";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    // TODO: Replace with actual API call
    console.log("Password reset request:", { email });

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      console.log("Password reset email sent (placeholder)");
    }, 1000);
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
            Sprawdź swoją skrzynkę email. Wysłaliśmy link do resetowania hasła na adres <strong>{email}</strong>
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
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
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
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
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
