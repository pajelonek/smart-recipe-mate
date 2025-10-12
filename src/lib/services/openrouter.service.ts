import type { AIInputPayload, AIGeneratedRecipe } from "../../types";

const AI_REQUEST_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 2;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

/**
 * Generates a recipe using OpenRouter AI API
 *
 * Implements:
 * - Retry logic with exponential backoff
 * - Timeout handling (30 seconds)
 * - Error handling and logging
 *
 * @param inputPayload - Full input including ingredients and user preferences
 * @param apiKey - OpenRouter API key
 * @returns Generated recipe object
 * @throws Error if AI generation fails after retries or times out
 */
export async function generateRecipe(inputPayload: AIInputPayload, apiKey: string): Promise<AIGeneratedRecipe> {
  const prompt = buildPrompt(inputPayload);

  let lastError: Error;

  // Retry loop with exponential backoff
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("AI request timeout")), AI_REQUEST_TIMEOUT);
      });

      // Create fetch promise
      const fetchPromise = fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://smart-recipe-mate.com",
          "X-Title": "Smart Recipe Mate",
        },
        body: JSON.stringify({
          model: "anthropic/claude-3.5-sonnet",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return parseAIResponse(data);
    } catch (error) {
      lastError = error as Error;

      console.error(`AI generation attempt ${attempt + 1} failed:`, {
        error: lastError.message,
        attempt: attempt + 1,
        maxRetries: MAX_RETRIES,
      });

      // Don't retry for 4xx client errors
      if (error instanceof Error && error.message.includes("400")) {
        throw error;
      }

      // Exponential backoff before retry
      if (attempt < MAX_RETRIES) {
        const backoffMs = Math.pow(2, attempt) * 1000;
        console.log(`Retrying in ${backoffMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  // All retries exhausted
  throw new Error(`AI generation failed after ${MAX_RETRIES + 1} attempts: ${lastError!.message}`);
}

/**
 * Builds a detailed prompt for the AI based on user input and preferences
 *
 * @param inputPayload - Full input including ingredients and preferences
 * @returns Formatted prompt string for AI
 */
function buildPrompt(inputPayload: AIInputPayload): string {
  const { available_ingredients, dietary_goals, additional_context, user_preferences } = inputPayload;

  return `You are a professional chef assistant. Generate a detailed recipe based on the following:

AVAILABLE INGREDIENTS:
${available_ingredients.join(", ")}

USER DIETARY PREFERENCES:
- Diet Type: ${user_preferences.diet_type}
- Preferred Ingredients: ${user_preferences.preferred_ingredients || "None specified"}
- Preferred Cuisines: ${user_preferences.preferred_cuisines || "Any"}
- Allergens to AVOID: ${user_preferences.allergens || "None"}
${user_preferences.notes ? `- Additional Notes: ${user_preferences.notes}` : ""}

${dietary_goals ? `DIETARY GOALS:\n${dietary_goals}\n` : ""}
${additional_context ? `ADDITIONAL CONTEXT:\n${additional_context}\n` : ""}

INSTRUCTIONS:
1. Create a complete, practical recipe using the available ingredients
2. Respect ALL dietary preferences and allergens
3. If ingredients are insufficient, return an error message
4. Format your response as a JSON object with this exact structure:

{
  "title": "Recipe Name",
  "summary": "Brief 1-2 sentence description",
  "ingredients": "Detailed ingredient list with measurements",
  "preparation": "Step-by-step cooking instructions"
}

IMPORTANT: Return ONLY the JSON object, no other text.`;
}

/**
 * Parses the AI response and extracts the recipe JSON
 *
 * Handles:
 * - JSON extraction from markdown code blocks
 * - Validation of required fields
 * - Error handling for malformed responses
 *
 * @param aiResponse - Raw response from OpenRouter API
 * @returns Parsed recipe object
 * @throws Error if response is invalid or missing required fields
 */
function parseAIResponse(aiResponse: any): AIGeneratedRecipe {
  try {
    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content in AI response");
    }

    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);

    const jsonString = jsonMatch ? jsonMatch[1] : content;
    const parsed = JSON.parse(jsonString);

    // Validate required fields
    if (!parsed.title || !parsed.summary || !parsed.ingredients || !parsed.preparation) {
      throw new Error("Missing required fields in AI response");
    }

    return {
      title: parsed.title,
      summary: parsed.summary,
      ingredients: parsed.ingredients,
      preparation: parsed.preparation,
    };
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    throw new Error("Invalid AI response format");
  }
}

/**
 * Generates helpful suggestions for the user when AI cannot generate a recipe
 *
 * Analyzes:
 * - Number of ingredients
 * - Presence of protein sources
 * - Presence of carbohydrates
 * - Dietary restrictions complexity
 *
 * @param ingredients - Array of available ingredients
 * @param preferences - User's dietary preferences
 * @returns Array of suggestion strings
 */
export function generateSuggestions(ingredients: string[], preferences: any): string[] {
  const suggestions: string[] = [];

  // Check ingredient count
  if (ingredients.length < 3) {
    suggestions.push("Add more ingredients (at least 3-4 for a complete meal)");
  }

  // Check for protein sources
  const proteinKeywords = ["chicken", "beef", "pork", "fish", "tofu", "eggs", "beans", "lentils", "chickpeas"];
  const hasProtein = ingredients.some((ing) => proteinKeywords.some((p) => ing.toLowerCase().includes(p)));
  if (!hasProtein) {
    suggestions.push("Add a protein source (meat, tofu, eggs, beans)");
  }

  // Check for carbohydrates
  const carbKeywords = ["rice", "pasta", "potato", "bread", "quinoa", "noodles", "couscous"];
  const hasCarbs = ingredients.some((ing) => carbKeywords.some((c) => ing.toLowerCase().includes(c)));
  if (!hasCarbs) {
    suggestions.push("Include a carbohydrate (rice, pasta, potatoes)");
  }

  // Check for overly restrictive allergens
  if (preferences.allergens && preferences.allergens.length > 50) {
    suggestions.push("Consider relaxing some dietary restrictions");
  }

  // If no specific suggestions, provide general advice
  if (suggestions.length === 0) {
    suggestions.push("Try different ingredient combinations");
    suggestions.push("Consider adding staple ingredients (oil, salt, spices)");
  }

  return suggestions;
}
