import type {
  OpenRouterConfig,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  GenerateRecipeInput,
  RecipeOutput,
  ModelInfo,
  UserPreferences,
  JsonSchemaFormat,
  ModelParams,
  AIInputPayload,
  AIGeneratedRecipe,
} from "../../../types";
import { ConfigurationError, ApiError, RateLimitError, ValidationError } from "./errors";

export class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly appReferer: string;
  private readonly appTitle: string;

  constructor(config: OpenRouterConfig) {
    // Validate API key early
    if (!config.apiKey || config.apiKey.trim() === "") {
      throw new ConfigurationError("OpenRouter API key is required and cannot be empty");
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://openrouter.ai/api/v1";
    this.defaultModel = config.defaultModel || "openai/gpt-4o-mini";
    this.appReferer = "https://smart-recipe-mate.app";
    this.appTitle = "Smart Recipe Mate";
  }

  async generateRecipe(input: GenerateRecipeInput): Promise<RecipeOutput> {
    if (!input.userId || input.userId.trim() === "") {
      throw new ValidationError("User ID is required");
    }

    if (!input.ingredients || input.ingredients.length === 0) {
      throw new ValidationError("At least one ingredient is required");
    }

    if (input.ingredients.length > 20) {
      throw new ValidationError("Maximum 20 ingredients allowed");
    }

    const { system, user } = this.buildRecipePrompt(input.userId, input.ingredients, input.preferences);

    const recipeSchema: JsonSchemaFormat = {
      type: "json_schema",
      json_schema: {
        name: "recipe",
        strict: true,
        schema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "The name of the recipe",
            },
            summary: {
              type: "string",
              description: "A brief description of the recipe",
            },
            ingredients: {
              type: "string",
              description: "List of ingredients with quantities, one per line",
            },
            preparation: {
              type: "string",
              description: "Step-by-step cooking instructions",
            },
            nutrition: {
              type: "object",
              properties: {
                calories: { type: "number" },
                protein: { type: "number" },
                carbohydrates: { type: "number" },
                fat: { type: "number" },
              },
              required: ["calories", "protein", "carbohydrates", "fat"],
              additionalProperties: false,
            },
          },
          required: ["title", "summary", "ingredients", "preparation", "nutrition"],
          additionalProperties: false,
        },
      },
    };

    const messages: ChatMessage[] = [system, user];
    const options: ChatOptions = {
      model: input.model || this.defaultModel,
      responseFormat: recipeSchema,
      params: input.params || {
        temperature: 0.7,
        maxTokens: 1500,
      },
    };

    const response = await this.chatCompletion(messages, options);

    const recipe = this.parseStructuredResponse(response.content, "recipe");

    return recipe as RecipeOutput;
  }

  async chatCompletion(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    if (!messages || messages.length === 0) {
      throw new ValidationError("At least one message is required");
    }

    for (const msg of messages) {
      if (!msg.role || !["system", "user", "assistant"].includes(msg.role)) {
        throw new ValidationError(`Invalid message role: ${msg.role}`);
      }
      if (!msg.content || msg.content.trim() === "") {
        throw new ValidationError("Message content cannot be empty");
      }
    }

    const model = options?.model || this.defaultModel;
    const params = options?.params || {};
    const responseFormat = options?.responseFormat;

    return await this.chatCompletionInternal(messages, model, params, responseFormat);
  }

  async getModels(): Promise<ModelInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "HTTP-Referer": this.appReferer,
          "X-Title": this.appTitle,
        },
      });

      if (!response.ok) {
        throw await this.handleApiError(response);
      }

      const data = await response.json();

      const models: ModelInfo[] = (data.data || []).map((model: any) => ({
        id: model.id,
        name: model.name || model.id,
        pricing: {
          prompt: Number.parseFloat(model.pricing?.prompt || "0"),
          completion: Number.parseFloat(model.pricing?.completion || "0"),
        },
        context_length: model.context_length || 0,
      }));

      return models;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error("Failed to fetch models:", error);
      throw new ApiError("Failed to fetch available models", undefined, "FETCH_MODELS_FAILED");
    }
  }

  private async chatCompletionInternal(
    messages: ChatMessage[],
    model: string,
    params: ModelParams,
    responseFormat?: JsonSchemaFormat
  ): Promise<ChatResponse> {
    const requestBody: any = {
      model,
      messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 1000,
    };

    if (params.topP !== undefined) {
      requestBody.top_p = params.topP;
    }

    if (responseFormat) {
      requestBody.response_format = responseFormat;
    }

    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": this.appReferer,
          "X-Title": this.appTitle,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw await this.handleApiError(response);
      }

      const data = await response.json();

      // Extract response content
      const content = data.choices?.[0]?.message?.content || "";
      const usage = data.usage
        ? {
            promptTokens: data.usage.prompt_tokens || 0,
            completionTokens: data.usage.completion_tokens || 0,
          }
        : undefined;

      return {
        content,
        structured: responseFormat ? this.parseStructuredResponse(content, responseFormat.json_schema.name) : undefined,
        usage,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error("Chat completion failed:", error);
      throw new ApiError("Failed to complete chat request", undefined, "CHAT_COMPLETION_FAILED");
    }
  }

  private buildRecipePrompt(
    userId: string,
    ingredients: string[],
    preferences?: UserPreferences
  ): { system: ChatMessage; user: ChatMessage } {
    // Build system message with user preferences
    let systemContent = `Jesteś ekspertem kulinarnym i asystentem AI dla aplikacji Smart Recipe Mate. Twoim zadaniem jest tworzenie spersonalizowanych, profesjonalnych przepisów kulinarnych na podstawie dostępnych składników i preferencji żywieniowych użytkownika.

KRYTYCZNE WYMAGANIA:
- Wszystkie odpowiedzi MUSZĄ być w języku polskim (polski)
- Zawsze odpowiadaj w formacie JSON zgodnym z dostarczonym schematem
- Wszystkie treści tekstowe (tytuł, opis, składniki, instrukcje) MUSZĄ być w języku polskim

WYTYCZNE DOTYCZĄCE TWORZENIA PRZEPISÓW:

1. PROFESJONALIZM I PRECYZJA:
   - Twórz przepisy praktyczne i wykonalne z podanymi składnikami
   - Używaj precyzyjnych ilości (np. "200g", "2 łyżki", "1 szklanka")
   - Podawaj konkretne czasy przygotowania i gotowania
   - Wskazuj odpowiednie techniki kulinarne (smażenie, duszenie, pieczenie, etc.)
   - Uwzględniaj kolejność dodawania składników dla optymalnego smaku

2. RÓWNOWAGA ODŻYWCZA:
   - Twórz przepisy zrównoważone pod względem makroskładników
   - Uwzględniaj różnorodność grup żywnościowych
   - Podawaj realistyczne wartości odżywcze oparte na faktycznych składnikach
   - W przypadku diet specjalnych (wegańska, bezglutenowa, etc.) zapewnij odpowiednie zamienniki

3. DOSTOSOWANIE DO PREFERENCJI:
   - Ściśle przestrzegaj ograniczeń dietetycznych i alergenów
   - Wykorzystuj preferowane kuchnie i składniki, gdy są dostępne
   - Twórz przepisy zgodne z typem diety użytkownika
   - Jeśli preferencje są zbyt restrykcyjne dla dostępnych składników, kreatywnie znajdź rozwiązania

4. JAKOŚĆ TREŚCI:
   - Tytuły powinny być atrakcyjne, opisowe i zachęcające
   - Opisy powinny zawierać informacje o smaku, teksturze i charakterystyce dania
   - Instrukcje powinny być szczegółowe, krok po kroku, z konkretnymi wskazówkami
   - Uwzględniaj wskazówki dotyczące przygotowania (np. temperatura, czas, technika)

5. KREATYWNOŚĆ I PRAKTYCZNOŚĆ:
   - Jeśli składników jest mało, zaproponuj proste, ale smaczne danie
   - Jeśli składników jest dużo, stwórz bardziej złożone danie wykorzystujące ich różnorodność
   - Uwzględniaj podstawowe składniki kuchenne (sól, pieprz, olej), jeśli nie są wymienione
   - Sugeruj optymalne wykorzystanie wszystkich dostępnych składników`;

    if (preferences) {
      systemContent += `\n\nPREFERENCJE UŻYTKOWNIKA:`;

      if (preferences.diet_type && preferences.diet_type !== "none") {
        systemContent += `\n- Typ diety: ${preferences.diet_type}`;
        systemContent += `\n  → PRZESTRZEGAJ ściśle zasad tej diety. Nie używaj składników niezgodnych z tym typem diety.`;
      }

      if (preferences.allergens && preferences.allergens.trim() !== "") {
        systemContent += `\n- Alergeny do unikania: ${preferences.allergens}`;
        systemContent += `\n  → ABSOLUTNIE ZABRONIONE jest użycie tych składników lub ich pochodnych. Sprawdź każdy składnik pod kątem ukrytych alergenów.`;
      }

      if (preferences.preferred_cuisines && preferences.preferred_cuisines.trim() !== "") {
        systemContent += `\n- Preferowane kuchnie: ${preferences.preferred_cuisines}`;
        systemContent += `\n  → Wykorzystaj techniki i smaki charakterystyczne dla tych kuchni, gdy jest to możliwe.`;
      }

      if (preferences.preferred_ingredients && preferences.preferred_ingredients.trim() !== "") {
        systemContent += `\n- Preferowane składniki: ${preferences.preferred_ingredients}`;
        systemContent += `\n  → Priorytetyzuj wykorzystanie tych składników w przepisie, jeśli są dostępne.`;
      }

      if (preferences.notes && preferences.notes.trim() !== "") {
        systemContent += `\n- Dodatkowe informacje i cele: ${preferences.notes}`;
        systemContent += `\n  → Uwzględnij te informacje przy tworzeniu przepisu.`;
      }
    }

    systemContent += `\n\nPAMIĘTAJ: Twój przepis powinien być profesjonalny, praktyczny i dostosowany do potrzeb użytkownika. Jakość i precyzja są kluczowe.`;

    const system: ChatMessage = {
      role: "system",
      content: systemContent,
    };

    // Build user message
    const ingredientsList = ingredients.join(", ");
    const userContent = `Wygeneruj profesjonalny przepis kulinarny wykorzystujący następujące dostępne składniki: ${ingredientsList}

WYMAGANE ELEMENTY PRZEPISU (wszystko w języku polskim):

1. TYTUŁ PRZEPISU:
   - Atrakcyjny, opisowy tytuł, który oddaje charakter dania
   - Powinien być zachęcający i profesjonalny

2. OPIS/STRESZCZENIE:
   - Krótki, ale informacyjny opis dania (2-3 zdania)
   - Opisz smak, teksturę, charakterystykę dania
   - Wspomnij o głównych składnikach i technice przygotowania

3. LISTA SKŁADNIKÓW:
   - Kompletna lista wszystkich składników z precyzyjnymi ilościami
   - Format: jeden składnik na linię
   - Używaj standardowych jednostek miary (g, kg, ml, l, łyżki, szklanki, sztuki)
   - Uwzględnij podstawowe przyprawy i składniki (sól, pieprz, olej), jeśli są potrzebne
   - Podaj ilości dla 2-4 porcji (dostosuj do ilości składników)

4. INSTRUKCJE PRZYGOTOWANIA:
   - Szczegółowe instrukcje krok po kroku
   - Każdy krok powinien być jasny i precyzyjny
   - Uwzględnij:
     * Czasy przygotowania i gotowania
     * Temperatury (jeśli dotyczy)
     * Techniki kulinarne
     * Wskazówki dotyczące kolejności dodawania składników
     * Wizualne wskazówki (np. "aż do zrumienienia", "aż zmiękną")
   - Instrukcje powinny być praktyczne i łatwe do wykonania

5. INFORMACJE O WARTOŚCI ODŻYWCZEJ:
   - Szacowane wartości odżywcze dla całego przepisu (lub jednej porcji, jeśli podałeś ilość porcji)
   - Podaj w gramach:
     * Kalorie (kcal)
     * Białko (g)
     * Węglowodany (g)
     * Tłuszcz (g)
   - Wartości powinny być realistyczne i oparte na faktycznych składnikach

Stwórz przepis, który jest profesjonalny, praktyczny i maksymalnie wykorzystuje dostępne składniki, jednocześnie respektując wszystkie preferencje i ograniczenia użytkownika.`;

    const user: ChatMessage = {
      role: "user",
      content: userContent,
    };

    return { system, user };
  }

  private parseStructuredResponse(content: string, schemaName: string): any {
    if (!content || content.trim() === "") {
      throw new ValidationError("Empty response content received");
    }

    try {
      const parsed = JSON.parse(content);
      return parsed;
    } catch (error) {
      console.error(`Failed to parse ${schemaName} response:`, error);
      throw new ValidationError(`Invalid JSON response for ${schemaName}`, {
        content: content.substring(0, 200),
        error: error instanceof Error ? error.message : "Unknown parsing error",
      });
    }
  }

  private async fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);

        // If rate limited, retry with exponential backoff
        if (response.status === 429) {
          const retryAfter = Number.parseInt(response.headers.get("Retry-After") || "1", 10);
          const delay = Math.min(Math.pow(2, attempt) * 1000, retryAfter * 1000);

          console.warn(`Rate limited, retrying after ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);

          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // If server error, retry
        if (response.status >= 500 && attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          console.warn(
            `Server error ${response.status}, retrying after ${delay}ms (attempt ${attempt + 1}/${maxRetries})`
          );

          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");

        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          console.warn(`Request failed, retrying after ${delay}ms (attempt ${attempt + 1}/${maxRetries}):`, error);

          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }
    }

    throw new ApiError(lastError?.message || "Request failed after retries", undefined, "MAX_RETRIES_EXCEEDED");
  }

  private async handleApiError(response: Response): Promise<Error> {
    console.log("response", await response.json());
    const status = response.status;
    let errorMessage = `API request failed with status ${status}`;
    let errorCode = "UNKNOWN_ERROR";

    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorData.message || errorMessage;
      errorCode = errorData.error?.code || errorData.code || errorCode;
    } catch {
      // Failed to parse error response
      errorMessage = `${errorMessage}: ${response.statusText}`;
    }

    switch (status) {
      case 401:
        return new ApiError(
          "Invalid or missing API key. Please check your OpenRouter configuration.",
          401,
          "UNAUTHORIZED"
        );

      case 403:
        return new ApiError("Access forbidden. Please verify your API key permissions.", 403, "FORBIDDEN");

      case 404:
        return new ApiError("Requested resource not found. Please check the model name.", 404, "NOT_FOUND");

      case 429: {
        const retryAfter = Number.parseInt(response.headers.get("Retry-After") || "60", 10);
        return new RateLimitError("Rate limit exceeded. Please try again later.", retryAfter);
      }

      case 500:
      case 502:
      case 503:
      case 504:
        return new ApiError(
          "OpenRouter service is temporarily unavailable. Please try again later.",
          status,
          "SERVICE_UNAVAILABLE"
        );

      default:
        return new ApiError(errorMessage, status, errorCode);
    }
  }
}

export async function generateRecipe(inputPayload: AIInputPayload, apiKey: string): Promise<AIGeneratedRecipe> {
  const service = new OpenRouterService({ apiKey });

  // Convert AIInputPayload to GenerateRecipeInput format
  const generateInput: GenerateRecipeInput = {
    userId: "system", // This is used internally, actual userId tracked separately
    ingredients: inputPayload.available_ingredients,
    preferences: {
      user_id: "system",
      diet_type: inputPayload.user_preferences.diet_type,
      preferred_ingredients: inputPayload.user_preferences.preferred_ingredients || "",
      preferred_cuisines: inputPayload.user_preferences.preferred_cuisines || "",
      allergens: inputPayload.user_preferences.allergens || "",
      notes: inputPayload.user_preferences.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };

  // Add dietary goals and context to prompt by creating enhanced preferences
  if (inputPayload.dietary_goals || inputPayload.additional_context) {
    let enhancedNotes = generateInput.preferences?.notes || "";

    if (inputPayload.dietary_goals) {
      enhancedNotes += `\nDietary Goals: ${inputPayload.dietary_goals}`;
    }

    if (inputPayload.additional_context) {
      enhancedNotes += `\nAdditional Context: ${inputPayload.additional_context}`;
    }

    if (generateInput.preferences) {
      generateInput.preferences.notes = enhancedNotes.trim();
    }
  }

  const result = await service.generateRecipe(generateInput);

  return {
    title: result.title,
    summary: result.summary,
    ingredients: result.ingredients,
    preparation: result.preparation,
  };
}

export function generateSuggestions(ingredients: string[], preferences: UserPreferences): string[] {
  const suggestions: string[] = [];

  // Analyze ingredients
  if (ingredients.length < 3) {
    suggestions.push("Add more ingredients - at least 3-5 ingredients work best for generating recipes");
  }

  // Check allergens vs ingredients
  const allergens =
    preferences.allergens
      ?.toLowerCase()
      .split(",")
      .map((a) => a.trim()) || [];
  const hasConflict = ingredients.some((ing) => allergens.some((allergen) => ing.toLowerCase().includes(allergen)));

  if (hasConflict) {
    suggestions.push("Some ingredients may conflict with your allergens - try removing them");
  }

  // Check diet type compatibility
  if (preferences.diet_type && preferences.diet_type !== "none") {
    const dietType = preferences.diet_type.toLowerCase();
    const problematicIngredients = ingredients.filter((ing) => {
      const lower = ing.toLowerCase();
      if (dietType.includes("vegan") && (lower.includes("meat") || lower.includes("dairy") || lower.includes("egg"))) {
        return true;
      }
      if (dietType.includes("vegetarian") && lower.includes("meat")) {
        return true;
      }
      return false;
    });

    if (problematicIngredients.length > 0) {
      suggestions.push(
        `Some ingredients (${problematicIngredients.join(", ")}) may not fit your ${preferences.diet_type} diet`
      );
    }
  }

  // Generic suggestions
  if (suggestions.length === 0) {
    suggestions.push(
      "Try adding more common ingredients like vegetables, grains, or proteins",
      "Consider adjusting your dietary restrictions if they're too limiting",
      "Add ingredients from different food groups for better recipe options"
    );
  }

  return suggestions;
}
