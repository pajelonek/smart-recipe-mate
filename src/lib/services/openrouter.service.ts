import type { AIInputPayload, AIGeneratedRecipe } from "../../types";

export async function generateRecipe(inputPayload: AIInputPayload, _apiKey: string): Promise<AIGeneratedRecipe> {
  // Simulate API latency (1-3 seconds)
  const delay = 1000 + Math.random() * 2000;
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Get first few ingredients for personalization
  const mainIngredients = inputPayload.available_ingredients.slice(0, 3).join(", ");

  // Return mock recipe
  return {
    title: `Delicious ${mainIngredients} Recipe`,
    summary: `A quick and healthy recipe using ${mainIngredients}, tailored to your ${inputPayload.user_preferences.diet_type} diet preferences.`,
    ingredients: `
Main ingredients:
- ${inputPayload.available_ingredients.map((ing) => `${ing} (as needed)`).join("\n- ")}

Additional:
- 2 tbsp olive oil
- Salt and pepper to taste
- 1 tsp garlic powder
- Fresh herbs for garnish
    `.trim(),
    preparation: `
1. Prepare all ingredients: wash, peel, and chop as needed.

2. Heat olive oil in a large pan over medium-high heat.

3. Add your main ingredients (${mainIngredients}) and cook for 5-7 minutes, stirring occasionally.

4. Season with salt, pepper, and garlic powder to taste.

5. ${inputPayload.dietary_goals ? `Follow your dietary goals: ${inputPayload.dietary_goals}` : "Cook until ingredients are tender and well combined."}

6. ${inputPayload.additional_context ? `Note: ${inputPayload.additional_context}` : "Adjust cooking time based on your preference."}

7. Garnish with fresh herbs and serve immediately.

Enjoy your meal!
    `.trim(),
  };
}

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
