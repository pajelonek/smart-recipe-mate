import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  passwordRequirements,
} from "../auth.schemas";

describe("auth.schemas", () => {
  describe("passwordRequirements", () => {
    it("should have all required password requirements", () => {
      expect(passwordRequirements).toHaveLength(4);
      expect(passwordRequirements[0]?.label).toContain("8 znaków");
      expect(passwordRequirements[1]?.label).toContain("Wielka litera");
      expect(passwordRequirements[2]?.label).toContain("Mała litera");
      expect(passwordRequirements[3]?.label).toContain("Cyfra");
    });

    it("should validate minimum length requirement", () => {
      const lengthReq = passwordRequirements[0];
      expect(lengthReq?.test("12345678")).toBe(true);
      expect(lengthReq?.test("1234567")).toBe(false);
    });

    it("should validate uppercase requirement", () => {
      const uppercaseReq = passwordRequirements[1];
      expect(uppercaseReq?.test("A")).toBe(true);
      expect(uppercaseReq?.test("a")).toBe(false);
    });

    it("should validate lowercase requirement", () => {
      const lowercaseReq = passwordRequirements[2];
      expect(lowercaseReq?.test("a")).toBe(true);
      expect(lowercaseReq?.test("A")).toBe(false);
    });

    it("should validate digit requirement", () => {
      const digitReq = passwordRequirements[3];
      expect(digitReq?.test("1")).toBe(true);
      expect(digitReq?.test("a")).toBe(false);
    });
  });

  describe("loginSchema", () => {
    it("should validate valid email and password", () => {
      const input = {
        email: "test@example.com",
        password: "password123",
      };
      const result = loginSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email format", () => {
      const input = {
        email: "not-an-email",
        password: "password123",
      };
      const result = loginSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("Nieprawidłowy format");
      }
    });

    it("should reject empty email", () => {
      const input = {
        email: "",
        password: "password123",
      };
      const result = loginSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty password", () => {
      const input = {
        email: "test@example.com",
        password: "",
      };
      const result = loginSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("wymagane");
      }
    });

    it("should accept various valid email formats", () => {
      const validEmails = [
        "user@example.com",
        "user.name@example.com",
        "user+tag@example.co.uk",
        "user_name@example-domain.com",
      ];

      validEmails.forEach((email) => {
        const input = {
          email,
          password: "password123",
        };
        const result = loginSchema.safeParse(input);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("registerSchema", () => {
    it("should validate valid registration data", () => {
      const input = {
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      };
      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject password that doesn't match confirmPassword", () => {
      const input = {
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Different123",
      };
      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("Hasła nie są identyczne");
        expect(result.error.issues[0]?.path).toContain("confirmPassword");
      }
    });

    it("should reject password without uppercase letter", () => {
      const input = {
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
      };
      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("wymagania");
      }
    });

    it("should reject password without lowercase letter", () => {
      const input = {
        email: "test@example.com",
        password: "PASSWORD123",
        confirmPassword: "PASSWORD123",
      };
      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject password without digit", () => {
      const input = {
        email: "test@example.com",
        password: "Password",
        confirmPassword: "Password",
      };
      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject password shorter than 8 characters", () => {
      const input = {
        email: "test@example.com",
        password: "Pass123",
        confirmPassword: "Pass123",
      };
      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should accept password with exactly 8 characters meeting all requirements", () => {
      const input = {
        email: "test@example.com",
        password: "Pass1234",
        confirmPassword: "Pass1234",
      };
      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept password with special characters", () => {
      const input = {
        email: "test@example.com",
        password: "Password123!@#",
        confirmPassword: "Password123!@#",
      };
      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const input = {
        email: "not-an-email",
        password: "Password123",
        confirmPassword: "Password123",
      };
      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("resetPasswordSchema", () => {
    it("should validate valid email", () => {
      const input = {
        email: "test@example.com",
      };
      const result = resetPasswordSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email format", () => {
      const input = {
        email: "not-an-email",
      };
      const result = resetPasswordSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("Nieprawidłowy format");
      }
    });

    it("should reject empty email", () => {
      const input = {
        email: "",
      };
      const result = resetPasswordSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("updatePasswordSchema", () => {
    it("should validate valid password update", () => {
      const input = {
        password: "NewPassword123",
        confirmPassword: "NewPassword123",
      };
      const result = updatePasswordSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject password that doesn't match confirmPassword", () => {
      const input = {
        password: "NewPassword123",
        confirmPassword: "Different123",
      };
      const result = updatePasswordSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("Hasła nie są identyczne");
        expect(result.error.issues[0]?.path).toContain("confirmPassword");
      }
    });

    it("should reject password without uppercase letter", () => {
      const input = {
        password: "newpassword123",
        confirmPassword: "newpassword123",
      };
      const result = updatePasswordSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject password without lowercase letter", () => {
      const input = {
        password: "NEWPASSWORD123",
        confirmPassword: "NEWPASSWORD123",
      };
      const result = updatePasswordSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject password without digit", () => {
      const input = {
        password: "NewPassword",
        confirmPassword: "NewPassword",
      };
      const result = updatePasswordSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject password shorter than 8 characters", () => {
      const input = {
        password: "New123",
        confirmPassword: "New123",
      };
      const result = updatePasswordSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty password", () => {
      const input = {
        password: "",
        confirmPassword: "",
      };
      const result = updatePasswordSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("wymagane");
      }
    });
  });
});
