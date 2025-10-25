import { z } from "zod";

// Password requirements - single source of truth for validation and UI
export interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

export const passwordRequirements: PasswordRequirement[] = [
  { label: "Co najmniej 8 znaków", test: (p) => p.length >= 8 },
  { label: "Wielka litera", test: (p) => /[A-Z]/.test(p) },
  { label: "Mała litera", test: (p) => /[a-z]/.test(p) },
  { label: "Cyfra", test: (p) => /\d/.test(p) },
];

// Helper function to validate password against all requirements
const validatePasswordRequirements = (password: string) => {
  return passwordRequirements.every((req) => req.test(password));
};

// Schemat logowania
export const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

// Schemat rejestracji
export const registerSchema = z
  .object({
    email: z.string().email("Nieprawidłowy format adresu email"),
    password: z.string().min(1, "Hasło jest wymagane").refine(validatePasswordRequirements, {
      message: "Hasło musi spełniać wszystkie wymagania",
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

// Schemat resetowania hasła
export const resetPasswordSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
});

// Schemat aktualizacji hasła
export const updatePasswordSchema = z
  .object({
    password: z.string().min(1, "Hasło jest wymagane").refine(validatePasswordRequirements, {
      message: "Hasło musi spełniać wszystkie wymagania",
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

// Typy wywnioskowane ze schematów
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordData = z.infer<typeof updatePasswordSchema>;
