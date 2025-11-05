import { describe, it, expect, beforeEach } from "vitest";
import * as recipesService from "../recipes.service";
import {
  createMockSupabaseClient,
  createSuccessResponse,
  createErrorResponse,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";
import type { Recipe, RecipeCreateInput, RecipeUpdateInput, RecipePartialUpdateInput } from "@/types";

describe("recipes.service", () => {
  let mockSupabase: MockSupabaseClient;
  const userId = "user-123";
  const recipeId = "recipe-123";

  const mockRecipe: Recipe = {
    id: recipeId,
    owner_id: userId,
    title: "Test Recipe",
    summary: "Test Summary",
    ingredients: "Test Ingredients",
    preparation: "Test Preparation",
    created_at: "2024-01-15T12:00:00Z",
    updated_at: "2024-01-15T12:00:00Z",
  };

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient() as MockSupabaseClient;
    mockSupabase.reset();
  });

  describe("getUserRecipes", () => {
    it("should return recipes for user", async () => {
      const mockRecipes = [mockRecipe];
      mockSupabase.mockQuery(createSuccessResponse(mockRecipes));

      const result = await recipesService.getUserRecipes(userId, mockSupabase);

      expect(mockSupabase.from).toHaveBeenCalledWith("recipes");
      expect(result).toEqual(mockRecipes);
    });

    it("should return empty array when no recipes found", async () => {
      mockSupabase.mockQuery(createSuccessResponse([]));

      const result = await recipesService.getUserRecipes(userId, mockSupabase);
      expect(result).toEqual([]);
    });

    it("should throw error when Supabase returns error", async () => {
      const error = { message: "Database error", code: "PGRST001" };
      mockSupabase.mockQuery(createErrorResponse(error));

      await expect(recipesService.getUserRecipes(userId, mockSupabase)).rejects.toEqual(error);
    });
  });

  describe("getRecipeById", () => {
    it("should return recipe when it exists and belongs to user", async () => {
      mockSupabase.mockQuery(createSuccessResponse(mockRecipe));

      const result = await recipesService.getRecipeById(recipeId, userId, mockSupabase);

      expect(result).toEqual(mockRecipe);
    });

    it("should return null when recipe not found (PGRST116)", async () => {
      const error = { message: "Not found", code: "PGRST116" };
      mockSupabase.mockQuery(createErrorResponse(error));

      const result = await recipesService.getRecipeById(recipeId, userId, mockSupabase);

      expect(result).toBeNull();
    });

    it("should throw error for non-PGRST116 errors", async () => {
      const error = { message: "Database error", code: "PGRST001" };
      mockSupabase.mockQuery(createErrorResponse(error));

      await expect(recipesService.getRecipeById(recipeId, userId, mockSupabase)).rejects.toEqual(error);
    });
  });

  describe("createRecipe", () => {
    const createInput: RecipeCreateInput = {
      title: "New Recipe",
      summary: "New Summary",
      ingredients: "New Ingredients",
      preparation: "New Preparation",
    };

    it("should create recipe with all fields", async () => {
      const newRecipe = { ...mockRecipe, ...createInput };
      mockSupabase.mockQuery(createSuccessResponse(newRecipe));

      const result = await recipesService.createRecipe(userId, createInput, mockSupabase);

      expect(mockSupabase.from).toHaveBeenCalledWith("recipes");
      expect(result).toMatchObject({
        title: createInput.title,
        summary: createInput.summary,
        ingredients: createInput.ingredients,
        preparation: createInput.preparation,
      });
    });

    it("should create recipe with optional summary as null", async () => {
      const inputWithoutSummary: RecipeCreateInput = {
        title: "New Recipe",
        ingredients: "New Ingredients",
        preparation: "New Preparation",
      };
      const newRecipe = { ...mockRecipe, summary: null, ...inputWithoutSummary };
      mockSupabase.mockQuery(createSuccessResponse(newRecipe));

      const result = await recipesService.createRecipe(userId, inputWithoutSummary, mockSupabase);

      expect(result.summary).toBeNull();
    });

    it("should throw error when Supabase returns error", async () => {
      const error = { message: "Database error", code: "PGRST001" };
      mockSupabase.mockQuery(createErrorResponse(error));

      await expect(recipesService.createRecipe(userId, createInput, mockSupabase)).rejects.toEqual(error);
    });
  });

  describe("updateRecipe", () => {
    const updateInput: RecipeUpdateInput = {
      title: "Updated Recipe",
      summary: "Updated Summary",
      ingredients: "Updated Ingredients",
      preparation: "Updated Preparation",
    };

    it("should update recipe when it exists and belongs to user", async () => {
      const updatedRecipe = { ...mockRecipe, ...updateInput };

      // First call: getRecipeById (check ownership)
      // Second call: update
      mockSupabase.mockQuery(createSuccessResponse(mockRecipe)).mockQuery(createSuccessResponse(updatedRecipe));

      const result = await recipesService.updateRecipe(recipeId, userId, updateInput, mockSupabase);

      expect(result).toMatchObject(updateInput);
      expect(result?.updated_at).toBeTruthy();
    });

    it("should return null when recipe not found", async () => {
      mockSupabase.mockQuery(createErrorResponse({ message: "Not found", code: "PGRST116" }));

      const result = await recipesService.updateRecipe(recipeId, userId, updateInput, mockSupabase);

      expect(result).toBeNull();
    });

    it("should set summary to null when not provided", async () => {
      const updateInputWithoutSummary: RecipeUpdateInput = {
        title: "Updated Recipe",
        ingredients: "Updated Ingredients",
        preparation: "Updated Preparation",
      };

      const updatedRecipe = { ...mockRecipe, summary: null, ...updateInputWithoutSummary };
      mockSupabase.mockQuery(createSuccessResponse(mockRecipe)).mockQuery(createSuccessResponse(updatedRecipe));

      const result = await recipesService.updateRecipe(recipeId, userId, updateInputWithoutSummary, mockSupabase);

      expect(result?.summary).toBeNull();
    });

    it("should throw error when Supabase returns error", async () => {
      const error = { message: "Database error", code: "PGRST001" };
      mockSupabase.mockQuery(createSuccessResponse(mockRecipe)).mockQuery(createErrorResponse(error));

      await expect(recipesService.updateRecipe(recipeId, userId, updateInput, mockSupabase)).rejects.toEqual(error);
    });
  });

  describe("patchRecipe", () => {
    it("should update only provided fields", async () => {
      const partialInput: RecipePartialUpdateInput = {
        title: "Patched Title",
      };

      const patchedRecipe = { ...mockRecipe, title: "Patched Title" };
      mockSupabase.mockQuery(createSuccessResponse(mockRecipe)).mockQuery(createSuccessResponse(patchedRecipe));

      const result = await recipesService.patchRecipe(recipeId, userId, partialInput, mockSupabase);

      expect(result?.title).toBe("Patched Title");
      expect(result?.ingredients).toBe(mockRecipe.ingredients); // Unchanged
      expect(result?.updated_at).toBeTruthy();
    });

    it("should update multiple fields", async () => {
      const partialInput: RecipePartialUpdateInput = {
        title: "Patched Title",
        summary: "Patched Summary",
      };

      const patchedRecipe = { ...mockRecipe, ...partialInput };
      mockSupabase.mockQuery(createSuccessResponse(mockRecipe)).mockQuery(createSuccessResponse(patchedRecipe));

      const result = await recipesService.patchRecipe(recipeId, userId, partialInput, mockSupabase);

      expect(result?.title).toBe("Patched Title");
      expect(result?.summary).toBe("Patched Summary");
    });

    it("should set summary to null when explicitly set to empty string", async () => {
      const partialInput: RecipePartialUpdateInput = {
        summary: "",
      };

      const patchedRecipe = { ...mockRecipe, summary: null };
      mockSupabase.mockQuery(createSuccessResponse(mockRecipe)).mockQuery(createSuccessResponse(patchedRecipe));

      const result = await recipesService.patchRecipe(recipeId, userId, partialInput, mockSupabase);

      expect(result?.summary).toBeNull();
    });

    it("should return null when recipe not found", async () => {
      const partialInput: RecipePartialUpdateInput = {
        title: "Patched Title",
      };

      mockSupabase.mockQuery(createErrorResponse({ message: "Not found", code: "PGRST116" }));

      const result = await recipesService.patchRecipe(recipeId, userId, partialInput, mockSupabase);

      expect(result).toBeNull();
    });

    it("should throw error when Supabase returns error", async () => {
      const error = { message: "Database error", code: "PGRST001" };
      const partialInput: RecipePartialUpdateInput = {
        title: "Patched Title",
      };

      mockSupabase.mockQuery(createSuccessResponse(mockRecipe)).mockQuery(createErrorResponse(error));

      await expect(recipesService.patchRecipe(recipeId, userId, partialInput, mockSupabase)).rejects.toEqual(error);
    });
  });

  describe("deleteRecipe", () => {
    it("should soft delete recipe when it exists and belongs to user", async () => {
      // First call: getRecipeById (check ownership) - uses single()
      // Second call: update (soft delete) - uses update().eq().eq() where last eq() returns response
      mockSupabase.mockQuery(createSuccessResponse(mockRecipe)).mockQuery(createSuccessResponse({}), true); // eqAsTerminal = true

      const result = await recipesService.deleteRecipe(recipeId, userId, mockSupabase);

      expect(result).toBe(true);
    });

    it("should return false when recipe not found", async () => {
      mockSupabase.mockQuery(createErrorResponse({ message: "Not found", code: "PGRST116" }));

      const result = await recipesService.deleteRecipe(recipeId, userId, mockSupabase);

      expect(result).toBe(false);
    });

    it("should throw error when Supabase returns error", async () => {
      const error = { message: "Database error", code: "PGRST001" };
      mockSupabase.mockQuery(createSuccessResponse(mockRecipe)).mockQuery(createErrorResponse(error), true); // eqAsTerminal = true

      await expect(recipesService.deleteRecipe(recipeId, userId, mockSupabase)).rejects.toEqual(error);
    });
  });
});
