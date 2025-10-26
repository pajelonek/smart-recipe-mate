# OpenRouter Service Implementation Plan

## 1. Service Description

The OpenRouter service is a TypeScript-based utility class designed to integrate with the OpenRouter API, enabling seamless interaction for LLM-based chat completions in the Smart Recipe Mate application. It abstracts API calls, handles prompt construction (system and user messages), model selection, parameter tuning, and structured JSON responses using JSON schema enforcement. This service supports generating personalized recipes based on user preferences and ingredients, aligning with the MVP's AI integration goals. It uses HTTP clients like Axios or native Fetch for API requests, ensuring compatibility with the Astro 5 backend and Supabase for user data.

Key goals:

- Provide a clean interface for generating AI responses.
- Enforce structured outputs for recipe generation (e.g., JSON with ingredients, steps, nutrition).
- Handle authentication via API keys stored securely in environment variables.
- Integrate with the application's services (e.g., preferences.service.ts) to inject user data into prompts.

This service will be placed in `./src/lib/services/openrouter.service.ts`, following the project structure.

## 2. Constructor Description

The constructor initializes the service with configuration options, primarily the API key and optional base URL for the OpenRouter endpoint. It validates inputs early and sets up any internal state, such as default model or HTTP client instance.

### Parameters:

- `apiKey: string` - Required OpenRouter API key, sourced from environment variables (e.g., `process.env.OPENROUTER_API_KEY`).
- `baseUrl?: string` - Optional; defaults to `https://openrouter.ai/api/v1`. Allows for testing or custom endpoints.
- `defaultModel?: string` - Optional; defaults to a cost-effective model like `openai/gpt-4o-mini` for recipe generation tasks.

### Implementation Notes:

- Use TypeScript interfaces for type safety: `interface OpenRouterConfig { apiKey: string; baseUrl?: string; defaultModel?: string; }`.
- Validate `apiKey` is non-empty; throw a custom `ConfigurationError` if invalid.
- Initialize a private HTTP client (e.g., Axios instance) with base URL and default headers: `Authorization: Bearer ${apiKey}`, `Content-Type: application/json`, and `HTTP-Referer`/`X-Title` for OpenRouter compliance.

Example:

```typescript
constructor(config: OpenRouterConfig) {
  if (!config.apiKey) {
    throw new ConfigurationError('OpenRouter API key is required');
  }
  this.apiKey = config.apiKey;
  this.baseUrl = config.baseUrl || 'https://openrouter.ai/api/v1';
  this.defaultModel = config.defaultModel || 'openai/gpt-4o-mini';
  this.httpClient = axios.create({
    baseURL: this.baseUrl,
    headers: {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://your-app-domain.com',
      'X-Title': 'Smart Recipe Mate',
    },
  });
}
```

## 3. Public Methods and Fields

Public interface exposes core functionality for the application to use, such as generating recipes. Methods are async, return typed responses, and integrate with Supabase user data.

### Public Fields:

- None exposed; all configuration is private to enforce encapsulation.

### Public Methods:

1. **`generateRecipe(promptData: GenerateRecipeInput): Promise<RecipeOutput>`**
   - Purpose: Main entry point for generating a structured recipe using user preferences and ingredients.
   - Inputs: `interface GenerateRecipeInput { userId: string; ingredients: string[]; preferences: UserPreferences; model?: string; params?: ModelParams; }` (fetches preferences from Supabase via preferences.service.ts).
   - Constructs system/user messages, calls private `chatCompletion`, parses JSON response.
   - Returns: Typed `RecipeOutput` (e.g., { title: string; ingredients: string[]; steps: string[]; nutrition: object; }).

2. **`chatCompletion(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>`**
   - Purpose: General-purpose chat completion for flexible LLM interactions (e.g., refining recipes).
   - Inputs: `interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string; }`, `interface ChatOptions { model?: string; responseFormat?: JsonSchemaFormat; params?: ModelParams; }`.
   - Supports structured responses via `responseFormat`.
   - Returns: `interface ChatResponse { content: string; structured?: any; usage?: { promptTokens: number; completionTokens: number; }; }`.

3. **`getModels(): Promise<ModelInfo[]>`**
   - Purpose: Fetch available models from OpenRouter for admin/debugging.
   - Returns: List of models with names, providers, and pricing.

Example Usage in React Component (e.g., DashboardContent.tsx):

```typescript
const openrouter = new OpenRouterService({ apiKey: process.env.OPENROUTER_API_KEY! });
const recipe = await openrouter.generateRecipe({
  userId: user.id,
  ingredients: ["chicken", "rice"],
  preferences: userPrefs,
});
```

## 4. Private Methods and Fields

Internal helpers for API orchestration, prompt building, and response parsing. Not exposed to prevent direct manipulation.

### Private Fields:

- `apiKey: string` - Stored API key.
- `baseUrl: string` - API base URL.
- `defaultModel: string` - Fallback model.
- `httpClient: AxiosInstance` - Configured HTTP client.

### Private Methods:

1. **`private async chatCompletionInternal(messages: ChatMessage[], model: string, params: ModelParams, responseFormat?: JsonSchemaFormat): Promise<any>`**
   - Builds request body: `{ model, messages, response_format: responseFormat, ...params }`.
   - Sends POST to `/chat/completions`.
   - Handles raw response, extracts `choices[0].message.content`.

2. **`private buildPrompt(userId: string, ingredients: string[], preferences: UserPreferences): { system: string; user: string; }`**
   - Fetches user data via Supabase if needed.
   - System: "You are a helpful recipe assistant. Generate recipes in JSON format matching the schema."
   - User: "Based on ingredients: [list] and preferences: [allergies, diet], suggest a recipe."

3. **`private parseStructuredResponse(content: string, schemaName: string): any`**
   - Assumes content is JSON; parses and validates against schema (using Zod or similar for runtime checks).

4. **`private handleApiError(error: any): Error`** - Throws custom errors based on status codes (e.g., 401 for auth, 429 for rate limits).

Example for `buildPrompt`:

```typescript
private buildPrompt(userId: string, ingredients: string[], preferences: UserPreferences) {
  const system = `You are a culinary AI assistant for Smart Recipe Mate. Always respond in JSON format as per the provided schema. Consider user preferences: allergies - ${preferences.allergies.join(', ')}, diet - ${preferences.diet}.`;
  const user = `Generate a recipe using these ingredients: ${ingredients.join(', ')}. Include title, ingredients list, steps, and nutritional info.`;
  return { system: [{ role: 'system', content: system }], user: [{ role: 'user', content: user }] };
}
```

## 5. Error Handling

Implement robust error handling following clean code guidelines: early returns, custom errors, and logging.

### Custom Error Types:

- `ConfigurationError` - For invalid setup (extends Error).
- `ApiError` - For OpenRouter failures, with `status`, `message`, `code`.
- `ValidationError` - For invalid inputs or schema mismatches.
- `RateLimitError` - Specific for 429 responses.

### Scenarios and Handling:

1. **Invalid API Key (401 Unauthorized)**: Throw `ApiError` in `chatCompletionInternal`; log warning, suggest key rotation.
2. **Rate Limiting (429 Too Many Requests)**: Implement exponential backoff (e.g., retry with delay up to 3 times); expose `maxRetries` in params.
3. **Network/Timeout Errors**: Use Axios timeouts (e.g., 30s); retry once on 5xx errors.
4. **Invalid JSON Response**: In `parseStructuredResponse`, catch JSON.parse errors, throw `ValidationError` with fallback to plain text.
5. **Model Not Found (404)**: Validate model existence via `getModels` before use; throw `ConfigurationError`.
6. **Input Validation**: Use Zod schemas (from `./src/lib/validation/`) for all inputs; early return on failure.
7. **Supabase Integration Errors**: When fetching preferences, wrap in try-catch; fallback to defaults if user data unavailable.

Logging: Use console.error in dev; integrate with a service like Sentry in production. Always return user-friendly messages (e.g., "Failed to generate recipe, try again later") while logging details.

## 6. Security Considerations

Prioritize security in line with best practices:

- **API Key Management**: Never hardcode; use `.env` files (ignored in Git). In Astro, access via `import.meta.env`. Rotate keys periodically via OpenRouter dashboard.
- **Input Sanitization**: Escape user inputs in prompts to prevent injection (though LLM APIs are generally safe); validate with Zod.
- **Rate Limiting**: Enforce client-side limits (e.g., 5 requests/min per user) via Supabase row-level security or middleware (`./src/middleware/index.ts`).
- **CORS and Headers**: OpenRouter handles CORS; ensure app headers comply (no exposing keys client-side).
- **Data Privacy**: Prompts include user preferences; anonymize in logs. Comply with GDPR via Supabase auth.
- **Structured Responses**: Enforce `strict: true` in JSON schema to prevent hallucinations outside schema.
- **HTTPS Only**: Enforce via baseUrl; avoid local testing without proxy if possible.
- **Dependency Security**: Regularly update Axios/Zod; use `npm audit` in CI/CD (GitHub Actions).

Avoid client-side API calls; proxy through Astro API routes (e.g., `./src/pages/api/ai/generate-recipe.ts`) to hide keys.

## 7. Step-by-Step Implementation Plan

### Step 1: Setup and Configuration

- Create `./src/lib/services/openrouter.service.ts`.
- Install dependencies if needed: `npm install axios zod` (add to `package.json`).
- Define types in `./src/types.ts`: Add `OpenRouterConfig`, `GenerateRecipeInput`, `RecipeOutput`, `JsonSchemaFormat`, etc.
- Add env var to `.env`: `OPENROUTER_API_KEY=your_key_here`.
- Implement constructor with validation.

### Step 2: Implement Private Methods

- Build `httpClient` with Axios.
- Implement `buildPrompt` integrating with `preferences.service.ts` (import and fetch user prefs via Supabase).
- Add `chatCompletionInternal` with request body construction.
- Implement `parseStructuredResponse` using Zod for validation.

### Step 3: Implement Public Methods

- Develop `generateRecipe`: Combine buildPrompt, call chatCompletion, parse response.
- Add `chatCompletion` wrapping internal method, supporting options.
- Implement `getModels` as a simple GET to `/models`.

### Step 4: Configure Key Elements

- **System Message**: Hardcode or load from config; example: `{ role: 'system', content: 'You are a recipe AI. Respond in JSON: {title, ingredients[], steps[], nutrition{calories, protein}}.' }`.
- **User Message**: Dynamic; example: `{ role: 'user', content: 'Create a low-carb recipe with chicken and broccoli.' }`.
- **Structured Responses (response_format)**: Use `{ type: 'json_schema', json_schema: { name: 'recipe', strict: true, schema: { type: 'object', properties: { title: {type: 'string'}, ingredients: {type: 'array', items: {type: 'string'}}, steps: {type: 'array', items: {type: 'string'}}, nutrition: {type: 'object', properties: {calories: {type: 'number'}} } }, required: ['title', 'ingredients', 'steps'] } } }`. Enforce in `chatCompletion` options.
- **Model Name**: Default 'openai/gpt-4o-mini'; allow override (e.g., 'anthropic/claude-3.5-sonnet' for complex recipes). Fetch via `getModels`.
- **Model Parameters**: `interface ModelParams { temperature?: number (0-2, default 0.7 for creativity); maxTokens?: number (default 1000); topP?: number; }`. Pass to request body.

### Step 5: Error Handling and Security

- Define custom errors in a new file `./src/lib/errors/openrouter.errors.ts`.
- Add try-catch in all async methods; implement backoff for retries.
- Proxy API calls through `./src/pages/api/ai/openrouter-proxy.ts` to secure keys.
- Test security: Ensure no key leaks in browser dev tools.
