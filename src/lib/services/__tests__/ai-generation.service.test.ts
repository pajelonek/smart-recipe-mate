import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createAIGeneration,
  updateAIGenerationSuccess,
  updateAIGenerationError,
  getUserGenerations,
  getGenerationById,
} from "../ai-generation.service";
import {
  createMockSupabaseClient,
  createSuccessResponse,
  createErrorResponse,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";
import type { AIInputPayload, AIGeneratedRecipe, AIGeneration } from "@/types";

describe("ai-generation.service", () => {
  let mockSupabase: MockSupabaseClient;
  const userId = "user-123";
  const generationId = "generation-123";

  const mockInputPayload: AIInputPayload = {
    available_ingredients: ["flour", "sugar"],
    dietary_goals: "high protein",
    additional_context: "quick meal",
    user_preferences: {
      diet_type: "omnivore",
      preferred_ingredients: "flour, sugar",
      preferred_cuisines: "american",
    },
  };

  const mockOutputPayload: AIGeneratedRecipe = {
    title: "Generated Recipe",
    summary: "A great recipe",
    ingredients: "Flour, sugar",
    preparation: "Mix and bake",
  };

  const mockGeneration: AIGeneration = {
    id: generationId,
    user_id: userId,
    input_payload: mockInputPayload as any,
    output_payload: mockOutputPayload as any,
    error_message: null,
    created_at: "2024-01-15T12:00:00Z",
  };

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient() as MockSupabaseClient;
  });

  describe("createAIGeneration", () => {
    it("should create AI generation record and return ID", async () => {
      mockSupabase.mockQuery(createSuccessResponse({ id: generationId }));

      const result = await createAIGeneration(userId, mockInputPayload, mockSupabase);

      expect(result).toBe(generationId);
      expect(mockSupabase.from).toHaveBeenCalledWith("ai_generations");
    });

    it("should throw error when Supabase returns error", async () => {
      const error = { message: "Database error", code: "PGRST001" };
      mockSupabase.mockQuery(createErrorResponse(error));

      await expect(createAIGeneration(userId, mockInputPayload, mockSupabase)).rejects.toEqual(error);
    });
  });

  describe("updateAIGenerationSuccess", () => {
    it("should update generation with output payload", async () => {
      const updatedGeneration = { ...mockGeneration, output_payload: mockOutputPayload };
      mockSupabase.mockQuery(createSuccessResponse(updatedGeneration));

      const result = await updateAIGenerationSuccess(generationId, mockOutputPayload, mockSupabase);

      expect(result).toEqual(updatedGeneration);
    });

    it("should throw error when Supabase returns error", async () => {
      const error = { message: "Database error", code: "PGRST001" };
      mockSupabase.mockQuery(createErrorResponse(error));

      await expect(updateAIGenerationSuccess(generationId, mockOutputPayload, mockSupabase)).rejects.toEqual(error);
    });
  });

  describe("updateAIGenerationError", () => {
    it("should update generation with error message", async () => {
      mockSupabase.mockQuery(createSuccessResponse({}));

      await updateAIGenerationError(generationId, "AI generation failed", mockSupabase);

      expect(mockSupabase.from).toHaveBeenCalledWith("ai_generations");
    });

    it("should throw error when Supabase returns error", async () => {
      const error = { message: "Database error", code: "PGRST001" };
      mockSupabase.mockQuery(createErrorResponse(error));

      await expect(updateAIGenerationError(generationId, "Error message", mockSupabase)).rejects.toEqual(error);
    });
  });

  describe("getUserGenerations", () => {
    it("should return all generations when statusFilter is 'all'", async () => {
      const mockGenerations = [mockGeneration];
      mockSupabase.mockQuery(createSuccessResponse(mockGenerations));

      const result = await getUserGenerations(userId, "all", mockSupabase);

      expect(result).toEqual(mockGenerations);
    });

    it("should filter only successful generations when statusFilter is 'success'", async () => {
      const successfulGeneration = { ...mockGeneration, output_payload: mockOutputPayload, error_message: null };
      const mockGenerations = [successfulGeneration];
      mockSupabase.mockQuery(createSuccessResponse(mockGenerations), false, true);

      const result = await getUserGenerations(userId, "success", mockSupabase);

      expect(result).toEqual(mockGenerations);
    });

    it("should filter only error generations when statusFilter is 'error'", async () => {
      const errorGeneration = { ...mockGeneration, output_payload: null, error_message: "Error occurred" };
      const mockGenerations = [errorGeneration];
      mockSupabase.mockQuery(createSuccessResponse(mockGenerations), false, true);

      const result = await getUserGenerations(userId, "error", mockSupabase);

      expect(result).toEqual(mockGenerations);
    });

    it("should return empty array when no generations found", async () => {
      mockSupabase.mockQuery(createSuccessResponse([]));

      const result = await getUserGenerations(userId, "all", mockSupabase);

      expect(result).toEqual([]);
    });

    it("should throw error when Supabase returns error", async () => {
      const error = { message: "Database error", code: "PGRST001" };
      mockSupabase.mockQuery(createErrorResponse(error));

      await expect(getUserGenerations(userId, "all", mockSupabase)).rejects.toEqual(error);
    });
  });

  describe("getGenerationById", () => {
    it("should return generation when it exists", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockReturnValue(createSuccessResponse(mockGeneration)),
        }),
      });

      (mockSupabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await getGenerationById(generationId, mockSupabase);

      expect(result).toEqual(mockGeneration);
      expect(mockSelect().eq).toHaveBeenCalledWith("id", generationId);
    });

    it("should return null when generation not found (PGRST116)", async () => {
      const error = { message: "Not found", code: "PGRST116" };
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockReturnValue(createErrorResponse(error)),
        }),
      });

      (mockSupabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await getGenerationById(generationId, mockSupabase);

      expect(result).toBeNull();
    });

    it("should throw error for non-PGRST116 errors", async () => {
      const error = { message: "Database error", code: "PGRST001" };
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockReturnValue(createErrorResponse(error)),
        }),
      });

      (mockSupabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      await expect(getGenerationById(generationId, mockSupabase)).rejects.toEqual(error);
    });
  });
});
