import { describe, it, expect } from "vitest";
import {
  RecipeCreateInputSchema,
  RecipeUpdateInputSchema,
  RecipePartialUpdateInputSchema,
  uuidSchema,
} from "../recipes.schemas";

describe("recipes.schemas", () => {
  describe("uuidSchema", () => {
    it("should validate valid UUID", () => {
      const validUUID = "123e4567-e89b-12d3-a456-426614174000";
      const result = uuidSchema.safeParse(validUUID);
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID format", () => {
      const invalidUUID = "not-a-uuid";
      const result = uuidSchema.safeParse(invalidUUID);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("Invalid recipe ID format");
      }
    });

    it("should reject empty string", () => {
      const result = uuidSchema.safeParse("");
      expect(result.success).toBe(false);
    });

    it("should reject null", () => {
      const result = uuidSchema.safeParse(null);
      expect(result.success).toBe(false);
    });
  });

  describe("RecipeCreateInputSchema", () => {
    describe("title validation", () => {
      it("should validate title with minimum length", () => {
        const input = {
          title: "a",
          ingredients: "a".repeat(10),
          preparation: "a".repeat(10),
        };
        const result = RecipeCreateInputSchema.safeParse(input);
        expect(result.success).toBe(true);
      });

      it("should validate title with maximum length", () => {
        const input = {
          title: "a".repeat(200),
          ingredients: "a".repeat(10),
          preparation: "a".repeat(10),
        };
        const result = RecipeCreateInputSchema.safeParse(input);
        expect(result.success).toBe(true);
      });

      it("should reject empty title", () => {
        const input = {
          title: "",
          ingredients: "a".repeat(10),
          preparation: "a".repeat(10),
        };
        const result = RecipeCreateInputSchema.safeParse(input);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain("title is required");
        }
      });

      it("should reject title longer than 200 characters", () => {
        const input = {
          title: "a".repeat(201),
          ingredients: "a".repeat(10),
          preparation: "a".repeat(10),
        };
        const result = RecipeCreateInputSchema.safeParse(input);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain("at most 200 characters");
        }
      });
    });

    describe("summary validation", () => {
      it("should accept valid summary", () => {
        const input = {
          title: "Recipe Title",
          summary: "Short summary",
          ingredients: "a".repeat(10),
          preparation: "a".repeat(10),
        };
        const result = RecipeCreateInputSchema.safeParse(input);
        expect(result.success).toBe(true);
      });

      it("should accept undefined summary", () => {
        const input = {
          title: "Recipe Title",
          ingredients: "a".repeat(10),
          preparation: "a".repeat(10),
        };
        const result = RecipeCreateInputSchema.safeParse(input);
        expect(result.success).toBe(true);
      });

      it("should accept empty string summary", () => {
        const input = {
          title: "Recipe Title",
          summary: "",
          ingredients: "a".repeat(10),
          preparation: "a".repeat(10),
        };
        const result = RecipeCreateInputSchema.safeParse(input);
        expect(result.success).toBe(true);
      });

      it("should reject summary longer than 500 characters", () => {
        const input = {
          title: "Recipe Title",
          summary: "a".repeat(501),
          ingredients: "a".repeat(10),
          preparation: "a".repeat(10),
        };
        const result = RecipeCreateInputSchema.safeParse(input);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain("at most 500 characters");
        }
      });

      it("should accept summary with exactly 500 characters", () => {
        const input = {
          title: "Recipe Title",
          summary: "a".repeat(500),
          ingredients: "a".repeat(10),
          preparation: "a".repeat(10),
        };
        const result = RecipeCreateInputSchema.safeParse(input);
        expect(result.success).toBe(true);
      });
    });

    describe("ingredients validation", () => {
      it("should validate ingredients with minimum length", () => {
        const input = {
          title: "Recipe Title",
          ingredients: "a".repeat(10),
          preparation: "a".repeat(10),
        };
        const result = RecipeCreateInputSchema.safeParse(input);
        expect(result.success).toBe(true);
      });

      it("should validate ingredients with maximum length", () => {
        const input = {
          title: "Recipe Title",
          ingredients: "a".repeat(5000),
          preparation: "a".repeat(10),
        };
        const result = RecipeCreateInputSchema.safeParse(input);
        expect(result.success).toBe(true);
      });

      it("should reject ingredients shorter than 10 characters", () => {
        const input = {
          title: "Recipe Title",
          ingredients: "a".repeat(9),
          preparation: "a".repeat(10),
        };
        const result = RecipeCreateInputSchema.safeParse(input);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain("at least 10 characters");
        }
      });

      it("should reject ingredients longer than 5000 characters", () => {
        const input = {
          title: "Recipe Title",
          ingredients: "a".repeat(5001),
          preparation: "a".repeat(10),
        };
        const result = RecipeCreateInputSchema.safeParse(input);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain("at most 5000 characters");
        }
      });
    });

    describe("preparation validation", () => {
      it("should validate preparation with minimum length", () => {
        const input = {
          title: "Recipe Title",
          ingredients: "a".repeat(10),
          preparation: "a".repeat(10),
        };
        const result = RecipeCreateInputSchema.safeParse(input);
        expect(result.success).toBe(true);
      });

      it("should validate preparation with maximum length", () => {
        const input = {
          title: "Recipe Title",
          ingredients: "a".repeat(10),
          preparation: "a".repeat(10000),
        };
        const result = RecipeCreateInputSchema.safeParse(input);
        expect(result.success).toBe(true);
      });

      it("should reject preparation shorter than 10 characters", () => {
        const input = {
          title: "Recipe Title",
          ingredients: "a".repeat(10),
          preparation: "a".repeat(9),
        };
        const result = RecipeCreateInputSchema.safeParse(input);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain("at least 10 characters");
        }
      });

      it("should reject preparation longer than 10000 characters", () => {
        const input = {
          title: "Recipe Title",
          ingredients: "a".repeat(10),
          preparation: "a".repeat(10001),
        };
        const result = RecipeCreateInputSchema.safeParse(input);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain("at most 10000 characters");
        }
      });
    });

    describe("complete input validation", () => {
      it("should validate complete valid input", () => {
        const input = {
          title: "Delicious Recipe",
          summary: "A great recipe",
          ingredients: "Flour, sugar, butter",
          preparation: "Mix ingredients and bake",
        };
        const result = RecipeCreateInputSchema.safeParse(input);
        expect(result.success).toBe(true);
      });

      it("should validate minimal valid input", () => {
        const input = {
          title: "Recipe",
          ingredients: "a".repeat(10),
          preparation: "a".repeat(10),
        };
        const result = RecipeCreateInputSchema.safeParse(input);
        expect(result.success).toBe(true);
      });

      it("should reject missing required fields", () => {
        const input = {
          title: "Recipe",
        };
        const result = RecipeCreateInputSchema.safeParse(input);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("RecipeUpdateInputSchema", () => {
    it("should have same validation rules as RecipeCreateInputSchema", () => {
      const validInput = {
        title: "Updated Recipe",
        summary: "Updated summary",
        ingredients: "a".repeat(10),
        preparation: "a".repeat(10),
      };

      const createResult = RecipeCreateInputSchema.safeParse(validInput);
      const updateResult = RecipeUpdateInputSchema.safeParse(validInput);

      expect(createResult.success).toBe(true);
      expect(updateResult.success).toBe(true);
    });

    it("should reject partial updates", () => {
      const input = {
        title: "Updated Recipe",
        // Missing ingredients and preparation
      };
      const result = RecipeUpdateInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("RecipePartialUpdateInputSchema", () => {
    it("should accept single field update", () => {
      const input = {
        title: "Updated Title",
      };
      const result = RecipePartialUpdateInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept multiple field update", () => {
      const input = {
        title: "Updated Title",
        summary: "Updated summary",
      };
      const result = RecipePartialUpdateInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept all fields update", () => {
      const input = {
        title: "Updated Title",
        summary: "Updated summary",
        ingredients: "a".repeat(10),
        preparation: "a".repeat(10),
      };
      const result = RecipePartialUpdateInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty object", () => {
      const input = {};
      const result = RecipePartialUpdateInputSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("At least one field must be provided");
      }
    });

    it("should validate title when provided", () => {
      const input = {
        title: "",
      };
      const result = RecipePartialUpdateInputSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("cannot be empty");
      }
    });

    it("should validate ingredients when provided", () => {
      const input = {
        ingredients: "a".repeat(9), // Too short
      };
      const result = RecipePartialUpdateInputSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("at least 10 characters");
      }
    });

    it("should validate preparation when provided", () => {
      const input = {
        preparation: "a".repeat(9), // Too short
      };
      const result = RecipePartialUpdateInputSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("at least 10 characters");
      }
    });

    it("should accept undefined fields", () => {
      const input = {
        title: "Updated Title",
        summary: undefined,
        ingredients: undefined,
        preparation: undefined,
      };
      const result = RecipePartialUpdateInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });
});
