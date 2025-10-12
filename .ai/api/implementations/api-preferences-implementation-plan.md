# API Endpoint Implementation Plan: User Preferences

## Analysis

### 1. Key Points from API Specification

- **Three endpoints for user preferences management:**
  - GET /api/preferences - Retrieve current user's dietary preferences
  - PUT /api/preferences - Full replacement of user preferences
  - PATCH /api/preferences - Partial update of user preferences
- **All endpoints require authentication** via Supabase JWT
- **Direct user-to-preferences relationship** (one-to-one via user_id)
- **Preferences are created during onboarding completion** but can be updated independently
- **404 response** when preferences don't exist (user hasn't completed onboarding)

### 2. Required and Optional Parameters

**GET /api/preferences:**

- No parameters (uses authenticated user_id from JWT)

**PUT /api/preferences:**

- Required: `diet_type` (string, 1-50 chars)
- Optional: `preferred_ingredients` (string, 0-1000 chars, defaults to "")
- Optional: `preferred_cuisines` (string, 0-500 chars, defaults to "")
- Optional: `allergens` (string, 0-500 chars, defaults to "")
- Optional: `notes` (string, 0-2000 chars, defaults to "")

**PATCH /api/preferences:**

- At least one field must be provided
- Optional: `diet_type` (string, 1-50 chars if provided)
- Optional: `preferred_ingredients` (string, 0-1000 chars)
- Optional: `preferred_cuisines` (string, 0-500 chars)
- Optional: `allergens` (string, 0-500 chars)
- Optional: `notes` (string, 0-2000 chars)

### 3. Required DTOs and Command Models

**From types.ts:**

- `UserPreferences` - Entity type (response)
- `PreferencesInput` - Full preferences input
- `PreferencesUpdateInput` - Full update (same as PreferencesInput)
- `PreferencesPartialUpdateInput` - Partial update (Partial<PreferencesInput>)
- `ApiError` - Error response format

**New validation schemas needed (Zod):**

- `PreferencesInputSchema` - For PUT requests with required diet_type
- `PreferencesPartialInputSchema` - For PATCH requests (all optional, but at least one required)

### 4. Service Layer Extraction

**New service:** `src/lib/services/preferences.service.ts`

Functions needed:

- `getUserPreferences(userId: string, supabase: SupabaseClient)` - Fetch preferences by user_id
- `updateUserPreferences(userId: string, data: PreferencesUpdateInput, supabase: SupabaseClient)` - Full upsert
- `patchUserPreferences(userId: string, data: PreferencesPartialUpdateInput, supabase: SupabaseClient)` - Partial update

Service will handle:

- Database queries via Supabase client
- Row-level security enforcement (automatic via Supabase RLS)
- Return typed results or null

### 5. Input Validation Strategy

**Validation using Zod schemas:**

```typescript
const PreferencesInputSchema = z.object({
  diet_type: z.string().min(1, "diet_type is required").max(50, "diet_type must be at most 50 characters"),
  preferred_ingredients: z
    .string()
    .max(1000, "preferred_ingredients must be at most 1000 characters")
    .optional()
    .default(""),
  preferred_cuisines: z.string().max(500, "preferred_cuisines must be at most 500 characters").optional().default(""),
  allergens: z.string().max(500, "allergens must be at most 500 characters").optional().default(""),
  notes: z.string().max(2000, "notes must be at most 2000 characters").optional().default(""),
});

const PreferencesPartialInputSchema = z
  .object({
    diet_type: z
      .string()
      .min(1, "diet_type cannot be empty")
      .max(50, "diet_type must be at most 50 characters")
      .optional(),
    preferred_ingredients: z.string().max(1000, "preferred_ingredients must be at most 1000 characters").optional(),
    preferred_cuisines: z.string().max(500, "preferred_cuisines must be at most 500 characters").optional(),
    allergens: z.string().max(500, "allergens must be at most 500 characters").optional(),
    notes: z.string().max(2000, "notes must be at most 2000 characters").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });
```

**Validation flow:**

1. Parse request body with Zod schema
2. Return 400 with validation errors on failure
3. Pass validated data to service layer
4. Service layer executes database operations

### 6. Error Logging

**No dedicated error_log table mentioned in schema**, but we should:

- Log all 500 errors to console/application logging system
- Include: timestamp, user_id, endpoint, error message, stack trace
- For 4xx errors, log minimal info (endpoint, status code) for metrics
- Use Astro's built-in error handling or create utility in `src/lib/error-handler.ts`

### 7. Security Considerations

**Authentication:**

- JWT verification via Supabase `getUser()` from `context.locals.supabase`
- Middleware checks authentication before route handler executes

**Input sanitization:**

- Zod validates input types and lengths
- No SQL injection risk (using Supabase ORM)
- No XSS risk (API only returns JSON)

**Rate limiting:**

- Not mentioned in spec for preferences endpoints
- Could be added at middleware level if needed

### 8. Error Scenarios and Status Codes

**GET /api/preferences:**

- 200 OK - Preferences found and returned
- 401 Unauthorized - Missing/invalid JWT token
- 404 Not Found - Preferences don't exist (user hasn't completed onboarding)
- 500 Internal Server Error - Database error

**PUT /api/preferences:**

- 200 OK - Preferences updated successfully (upsert)
- 400 Bad Request - Validation failed (missing diet_type, field too long)
- 401 Unauthorized - Missing/invalid JWT token
- 500 Internal Server Error - Database error

**PATCH /api/preferences:**

- 200 OK - Preferences partially updated
- 400 Bad Request - Validation failed (no fields provided, field too long, empty required field)
- 401 Unauthorized - Missing/invalid JWT token
- 404 Not Found - Preferences don't exist (cannot patch non-existent record)
- 500 Internal Server Error - Database error

---

## 1. Endpoint Overview

The User Preferences endpoints manage dietary preferences and restrictions for authenticated users. These preferences are initially created during the onboarding process but can be independently updated afterward. The endpoints support full replacement (PUT) and partial updates (PATCH) of preferences, enabling flexible user profile management.

**Endpoints:**

- `GET /api/preferences` - Retrieve current user's preferences
- `PUT /api/preferences` - Replace all preferences (upsert operation)
- `PATCH /api/preferences` - Partially update existing preferences

**Purpose:**

- Enable users to manage their dietary requirements and food preferences
- Support AI recipe generation by providing user context
- Ensure 90% of users have complete preference profiles (success metric)

---

## 2. Request Details

### GET /api/preferences

- **HTTP Method:** GET
- **URL Structure:** `/api/preferences`
- **Authentication:** Required (JWT via `Authorization: Bearer <token>`)
- **Parameters:**
  - Required: None (user_id extracted from JWT)
  - Optional: None
- **Request Body:** None

### PUT /api/preferences

- **HTTP Method:** PUT
- **URL Structure:** `/api/preferences`
- **Authentication:** Required (JWT via `Authorization: Bearer <token>`)
- **Parameters:**
  - Required: None (user_id extracted from JWT)
  - Optional: None
- **Request Body:**

```json
{
  "diet_type": "string (required, 1-50 chars)",
  "preferred_ingredients": "string (optional, 0-1000 chars)",
  "preferred_cuisines": "string (optional, 0-500 chars)",
  "allergens": "string (optional, 0-500 chars)",
  "notes": "string (optional, 0-2000 chars)"
}
```

### PATCH /api/preferences

- **HTTP Method:** PATCH
- **URL Structure:** `/api/preferences`
- **Authentication:** Required (JWT via `Authorization: Bearer <token>`)
- **Parameters:**
  - Required: None (user_id extracted from JWT)
  - Optional: None
- **Request Body:** (at least one field required)

```json
{
  "diet_type": "string (optional, 1-50 chars if provided)",
  "preferred_ingredients": "string (optional, 0-1000 chars)",
  "preferred_cuisines": "string (optional, 0-500 chars)",
  "allergens": "string (optional, 0-500 chars)",
  "notes": "string (optional, 0-2000 chars)"
}
```

---

## 3. Types Used

### DTOs (from `src/types.ts`)

```typescript
// Response type
export type UserPreferences = UserPreferencesEntity;

// Input types
export interface PreferencesInput {
  diet_type: string;
  preferred_ingredients?: string;
  preferred_cuisines?: string;
  allergens?: string;
  notes?: string;
}

export type PreferencesUpdateInput = PreferencesInput;
export type PreferencesPartialUpdateInput = Partial<PreferencesInput>;

// Error response
export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}
```

### Validation Schemas (to be created in route files)

```typescript
// src/lib/validation/preferences.schemas.ts
import { z } from "zod";

export const PreferencesInputSchema = z.object({
  diet_type: z.string().min(1, "diet_type is required").max(50, "diet_type must be at most 50 characters"),
  preferred_ingredients: z
    .string()
    .max(1000, "preferred_ingredients must be at most 1000 characters")
    .optional()
    .default(""),
  preferred_cuisines: z.string().max(500, "preferred_cuisines must be at most 500 characters").optional().default(""),
  allergens: z.string().max(500, "allergens must be at most 500 characters").optional().default(""),
  notes: z.string().max(2000, "notes must be at most 2000 characters").optional().default(""),
});

export const PreferencesPartialInputSchema = z
  .object({
    diet_type: z
      .string()
      .min(1, "diet_type cannot be empty")
      .max(50, "diet_type must be at most 50 characters")
      .optional(),
    preferred_ingredients: z.string().max(1000, "preferred_ingredients must be at most 1000 characters").optional(),
    preferred_cuisines: z.string().max(500, "preferred_cuisines must be at most 500 characters").optional(),
    allergens: z.string().max(500, "allergens must be at most 500 characters").optional(),
    notes: z.string().max(2000, "notes must be at most 2000 characters").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });
```

---

## 4. Response Details

### GET /api/preferences

**Success Response (200 OK):**

```json
{
  "user_id": "uuid",
  "diet_type": "vegetarian",
  "preferred_ingredients": "tomatoes, basil, cheese",
  "preferred_cuisines": "Italian, Mediterranean",
  "allergens": "peanuts, shellfish",
  "notes": "I prefer quick recipes under 30 minutes",
  "created_at": "2025-10-12T10:00:00Z",
  "updated_at": "2025-10-12T10:15:00Z"
}
```

**Error Response (404 Not Found):**

```json
{
  "error": "Preferences not found",
  "message": "User has not completed onboarding"
}
```

### PUT /api/preferences

**Success Response (200 OK):**

```json
{
  "user_id": "uuid",
  "diet_type": "vegan",
  "preferred_ingredients": "tofu, quinoa, kale",
  "preferred_cuisines": "Asian, Middle Eastern",
  "allergens": "peanuts, tree nuts",
  "notes": "High protein meals preferred",
  "created_at": "2025-10-12T10:00:00Z",
  "updated_at": "2025-10-12T11:00:00Z"
}
```

**Error Response (400 Bad Request):**

```json
{
  "error": "Validation failed",
  "message": "diet_type is required"
}
```

### PATCH /api/preferences

**Success Response (200 OK):**

```json
{
  "user_id": "uuid",
  "diet_type": "vegan",
  "preferred_ingredients": "tofu, quinoa, kale",
  "preferred_cuisines": "Asian, Middle Eastern",
  "allergens": "peanuts, tree nuts, soy",
  "notes": "High protein meals preferred",
  "created_at": "2025-10-12T10:00:00Z",
  "updated_at": "2025-10-12T11:30:00Z"
}
```

**Error Response (400 Bad Request - No fields):**

```json
{
  "error": "Validation failed",
  "message": "At least one field must be provided"
}
```

**Error Response (404 Not Found):**

```json
{
  "error": "Preferences not found",
  "message": "Cannot update preferences that don't exist. Complete onboarding first."
}
```

---

## 5. Data Flow

### GET /api/preferences Flow

```
1. Client Request
   ↓
2. Astro Middleware (authentication check)
   ↓ (extracts user_id from JWT)
3. Route Handler (src/pages/api/preferences/index.ts - GET)
   ↓
4. Service Layer (getUserPreferences)
   ↓
5. Supabase Query
   SELECT * FROM smart_recipe_mate.user_preferences
   WHERE user_id = auth.uid() (RLS enforced)
   ↓
6. Service returns UserPreferences | null
   ↓
7. Route Handler:
   - If null → 404 response
   - If found → 200 response with preferences
   ↓
8. Client Response
```

### PUT /api/preferences Flow

```
1. Client Request (JSON body)
   ↓
2. Astro Middleware (authentication check)
   ↓ (extracts user_id from JWT)
3. Route Handler (src/pages/api/preferences/index.ts - PUT)
   ↓
4. Validation (Zod PreferencesInputSchema)
   ↓ (if fails → 400 response)
5. Service Layer (updateUserPreferences)
   ↓
6. Supabase Upsert
   INSERT INTO smart_recipe_mate.user_preferences
   (user_id, diet_type, preferred_ingredients, ...)
   VALUES (...)
   ON CONFLICT (user_id)
   DO UPDATE SET diet_type = ..., updated_at = NOW()
   WHERE user_id = auth.uid() (RLS enforced)
   ↓
7. Service returns updated UserPreferences
   ↓
8. Route Handler → 200 response with preferences
   ↓
9. Client Response
```

### PATCH /api/preferences Flow

```
1. Client Request (JSON body with partial fields)
   ↓
2. Astro Middleware (authentication check)
   ↓ (extracts user_id from JWT)
3. Route Handler (src/pages/api/preferences/index.ts - PATCH)
   ↓
4. Validation (Zod PreferencesPartialInputSchema)
   ↓ (if fails → 400 response)
5. Service Layer (patchUserPreferences)
   ↓
6. Check if preferences exist
   SELECT id FROM smart_recipe_mate.user_preferences
   WHERE user_id = auth.uid()
   ↓ (if not exists → return null)
7. If exists, Supabase Update
   UPDATE smart_recipe_mate.user_preferences
   SET <provided_fields>, updated_at = NOW()
   WHERE user_id = auth.uid() (RLS enforced)
   ↓
8. Service returns updated UserPreferences | null
   ↓
9. Route Handler:
   - If null → 404 response
   - If updated → 200 response with preferences
   ↓
10. Client Response
```

---

## 6. Security Considerations

### Authentication

- **JWT Token Verification:** All endpoints require valid Supabase JWT token in `Authorization: Bearer <token>` header
- **Middleware Enforcement:** Authentication checked by Astro middleware before route handler execution
- **Token Extraction:** User ID extracted from validated JWT via `supabase.auth.getUser()`
- **Unauthorized Response:** 401 status returned if token missing, invalid, or expired

### Authorization

- **No Manual Checks Required:** Authorization handled at database level, preventing privilege escalation

### Input Validation

- **Schema Validation:** Zod schemas validate all input data types, formats, and constraints
- **Length Limits:** Maximum character lengths enforced for all fields to prevent storage issues
- **Required Fields:** diet_type required for PUT, at least one field required for PATCH
- **SQL Injection:** Not possible (using Supabase ORM, no raw SQL queries)
- **XSS Prevention:** API returns JSON only, no HTML rendering

### Data Privacy

- **User Isolation:** Each user can only read/write their own preferences
- **No Sensitive Data Exposure:** Preferences don't contain highly sensitive PII (credit cards, SSN, etc.)
- **Logging Considerations:** Don't log full preference details in application logs (may contain dietary restrictions that are health-related)

### Rate Limiting

- **Not Implemented in Spec:** Preferences endpoints don't have rate limiting requirements
- **Future Consideration:** Could add rate limiting middleware if abuse detected
- **Low Risk:** Read/write operations on user's own data pose minimal abuse risk

---

## 7. Error Handling

### Validation Errors (400 Bad Request)

**Scenarios:**

- Missing required field (diet_type) in PUT request
- Field exceeds maximum length
- No fields provided in PATCH request
- Empty diet_type in PATCH request

**Handling:**

```typescript
try {
  const validatedData = PreferencesInputSchema.parse(requestBody);
} catch (error) {
  if (error instanceof z.ZodError) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        message: error.errors[0].message,
        details: { fields: error.errors },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}
```

### Authentication Errors (401 Unauthorized)

**Scenarios:**

- Missing Authorization header
- Invalid JWT token
- Expired JWT token

**Handling:**

- Handled by middleware
- Returns 401 with generic message

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### Not Found Errors (404 Not Found)

**Scenarios:**

- GET request when preferences don't exist (user hasn't completed onboarding)
- PATCH request when preferences don't exist (can't update non-existent record)

**Handling:**

```typescript
const preferences = await getUserPreferences(userId, supabase);
if (!preferences) {
  return new Response(
    JSON.stringify({
      error: "Preferences not found",
      message: "User has not completed onboarding",
    }),
    { status: 404, headers: { "Content-Type": "application/json" } }
  );
}
```

### Server Errors (500 Internal Server Error)

**Scenarios:**

- Database connection failure
- Supabase service unavailable
- Unexpected exceptions

**Handling:**

```typescript
try {
  // ... service call
} catch (error) {
  console.error("Error updating preferences:", error);
  return new Response(
    JSON.stringify({
      error: "Internal server error",
      message: "Failed to update preferences. Please try again later.",
    }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}
```

### Error Response Format

All errors follow consistent format from `src/types.ts`:

```typescript
interface ApiError {
  error: string; // Short error identifier
  message: string; // Human-readable description
  details?: Record<string, unknown>; // Optional additional context
}
```

---

## 8. Performance Considerations

### Database Query Optimization

**GET /api/preferences:**

- **Single row query** by primary key (user_id) - O(1) lookup
- **Index:** Primary key index ensures fast retrieval
- **No joins:** Direct table access, minimal overhead
- **Expected latency:** < 10ms

**PUT /api/preferences:**

- **Upsert operation** - single query handles insert or update
- **Index:** Primary key index for conflict detection
- **No cascading updates:** Isolated table operation
- **Expected latency:** < 20ms

**PATCH /api/preferences:**

- **Two queries:** SELECT to check existence, UPDATE to modify
- **Optimization opportunity:** Could use upsert with conditional logic
- **Index:** Primary key index for both queries
- **Expected latency:** < 30ms

### Caching Strategy

**Not implemented in MVP but future considerations:**

- User preferences rarely change (daily/weekly at most)
- Could cache in user session or client-side storage
- Cache invalidation on PUT/PATCH responses
- Would reduce database load for repeated reads

### Payload Size

**Typical response size:**

- User preferences: ~200-500 bytes (minimal)
- No large text fields or binary data
- JSON serialization overhead negligible
- Network transfer < 1ms on modern connections

### Connection Pooling

**Supabase handles connection pooling automatically:**

- No manual connection management required
- Pooling optimizes database connections
- Scales with concurrent users

### Bottlenecks and Mitigations

**Potential bottlenecks:**

1. **Database connection limits** - Mitigated by Supabase pooling
2. **JWT verification overhead** - Cached by middleware per request
3. **JSON parsing** - Minimal overhead for small payloads

**No anticipated performance issues for MVP scale.**

---

## 9. Implementation Steps

### Step 1: Create Validation Schemas

**File:** `src/lib/validation/preferences.schemas.ts`

```typescript
import { z } from "zod";

export const PreferencesInputSchema = z.object({
  diet_type: z.string().min(1, "diet_type is required").max(50, "diet_type must be at most 50 characters"),
  preferred_ingredients: z
    .string()
    .max(1000, "preferred_ingredients must be at most 1000 characters")
    .optional()
    .default(""),
  preferred_cuisines: z.string().max(500, "preferred_cuisines must be at most 500 characters").optional().default(""),
  allergens: z.string().max(500, "allergens must be at most 500 characters").optional().default(""),
  notes: z.string().max(2000, "notes must be at most 2000 characters").optional().default(""),
});

export const PreferencesPartialInputSchema = z
  .object({
    diet_type: z
      .string()
      .min(1, "diet_type cannot be empty")
      .max(50, "diet_type must be at most 50 characters")
      .optional(),
    preferred_ingredients: z.string().max(1000, "preferred_ingredients must be at most 1000 characters").optional(),
    preferred_cuisines: z.string().max(500, "preferred_cuisines must be at most 500 characters").optional(),
    allergens: z.string().max(500, "allergens must be at most 500 characters").optional(),
    notes: z.string().max(2000, "notes must be at most 2000 characters").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });
```

### Step 2: Create Preferences Service

**File:** `src/lib/services/preferences.service.ts`

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { UserPreferences, PreferencesUpdateInput, PreferencesPartialUpdateInput } from "../../types";

type SupabaseClientType = SupabaseClient<Database>;

/**
 * Get user preferences by user_id
 * Returns null if preferences don't exist
 */
export async function getUserPreferences(
  userId: string,
  supabase: SupabaseClientType
): Promise<UserPreferences | null> {
  const { data, error } = await supabase.from("user_preferences").select("*").eq("user_id", userId).single();

  if (error) {
    // PostgreSQL error code 'PGRST116' means no rows returned
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return data;
}

/**
 * Upsert user preferences (create or replace)
 * Returns updated preferences
 */
export async function updateUserPreferences(
  userId: string,
  preferencesData: PreferencesUpdateInput,
  supabase: SupabaseClientType
): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from("user_preferences")
    .upsert({
      user_id: userId,
      ...preferencesData,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Partially update user preferences
 * Returns updated preferences or null if preferences don't exist
 */
export async function patchUserPreferences(
  userId: string,
  preferencesData: PreferencesPartialUpdateInput,
  supabase: SupabaseClientType
): Promise<UserPreferences | null> {
  // First check if preferences exist
  const existing = await getUserPreferences(userId, supabase);
  if (!existing) {
    return null;
  }

  // Update only provided fields
  const { data, error } = await supabase
    .from("user_preferences")
    .update({
      ...preferencesData,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
```

### Step 3: Create API Route Handler

**File:** `src/pages/api/preferences/index.ts`

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import { PreferencesInputSchema, PreferencesPartialInputSchema } from "../../../lib/validation/preferences.schemas";
import {
  getUserPreferences,
  updateUserPreferences,
  patchUserPreferences,
} from "../../../lib/services/preferences.service";
import type { ApiError } from "../../../types";

export const prerender = false;

/**
 * GET /api/preferences
 * Get current user's dietary preferences
 */
export const GET: APIRoute = async ({ locals }) => {
  // Authentication check (handled by middleware)
  const {
    data: { user },
    error: authError,
  } = await locals.supabase.auth.getUser();

  if (authError || !user) {
    const errorResponse: ApiError = {
      error: "Unauthorized",
      message: "Authentication required",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const preferences = await getUserPreferences(user.id, locals.supabase);

    if (!preferences) {
      const errorResponse: ApiError = {
        error: "Preferences not found",
        message: "User has not completed onboarding",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(preferences), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    const errorResponse: ApiError = {
      error: "Internal server error",
      message: "Failed to fetch preferences. Please try again later.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * PUT /api/preferences
 * Replace all user preferences (full update)
 */
export const PUT: APIRoute = async ({ request, locals }) => {
  // Authentication check
  const {
    data: { user },
    error: authError,
  } = await locals.supabase.auth.getUser();

  if (authError || !user) {
    const errorResponse: ApiError = {
      error: "Unauthorized",
      message: "Authentication required",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Parse and validate request body
  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch (error) {
    const errorResponse: ApiError = {
      error: "Invalid JSON",
      message: "Request body must be valid JSON",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate input
  let validatedData;
  try {
    validatedData = PreferencesInputSchema.parse(requestBody);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorResponse: ApiError = {
        error: "Validation failed",
        message: error.errors[0].message,
        details: { fields: error.errors },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    throw error;
  }

  // Update preferences
  try {
    const updatedPreferences = await updateUserPreferences(user.id, validatedData, locals.supabase);

    return new Response(JSON.stringify(updatedPreferences), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating preferences:", error);
    const errorResponse: ApiError = {
      error: "Internal server error",
      message: "Failed to update preferences. Please try again later.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * PATCH /api/preferences
 * Partially update user preferences
 */
export const PATCH: APIRoute = async ({ request, locals }) => {
  // Authentication check
  const {
    data: { user },
    error: authError,
  } = await locals.supabase.auth.getUser();

  if (authError || !user) {
    const errorResponse: ApiError = {
      error: "Unauthorized",
      message: "Authentication required",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Parse and validate request body
  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch (error) {
    const errorResponse: ApiError = {
      error: "Invalid JSON",
      message: "Request body must be valid JSON",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate input
  let validatedData;
  try {
    validatedData = PreferencesPartialInputSchema.parse(requestBody);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorResponse: ApiError = {
        error: "Validation failed",
        message: error.errors[0].message,
        details: { fields: error.errors },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    throw error;
  }

  // Partially update preferences
  try {
    const updatedPreferences = await patchUserPreferences(user.id, validatedData, locals.supabase);

    if (!updatedPreferences) {
      const errorResponse: ApiError = {
        error: "Preferences not found",
        message: "Cannot update preferences that don't exist. Complete onboarding first.",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(updatedPreferences), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error patching preferences:", error);
    const errorResponse: ApiError = {
      error: "Internal server error",
      message: "Failed to update preferences. Please try again later.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

### Step 4: Ensure Middleware is Configured

**File:** `src/middleware/index.ts` (should already exist)

Verify middleware properly initializes Supabase client and attaches to `locals`:

```typescript
import { defineMiddleware } from "astro:middleware";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "../db/database.types";

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createServerClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(key) {
          return context.cookies.get(key)?.value;
        },
        set(key, value, options) {
          context.cookies.set(key, value, options);
        },
        remove(key, options) {
          context.cookies.delete(key, options);
        },
      },
    }
  );

  context.locals.supabase = supabase;

  return next();
});
```

### Step 5: Create Directory Structure

```bash
# Create directories if they don't exist
mkdir -p src/pages/api/preferences
mkdir -p src/lib/services
mkdir -p src/lib/validation
```

### Step 6: Testing Strategy

**Unit Tests (optional for MVP, recommended for production):**

- Test validation schemas with valid/invalid inputs
- Test service functions with mocked Supabase client
- Test error handling scenarios

**Manual Testing:**

1. **GET /api/preferences - Success (200)**

   ```bash
   curl -X GET http://localhost:4321/api/preferences \
     -H "Authorization: Bearer <jwt_token>"
   ```

2. **GET /api/preferences - Not Found (404)**
   - Test with user who hasn't completed onboarding

3. **PUT /api/preferences - Success (200)**

   ```bash
   curl -X PUT http://localhost:4321/api/preferences \
     -H "Authorization: Bearer <jwt_token>" \
     -H "Content-Type: application/json" \
     -d '{
       "diet_type": "vegan",
       "preferred_ingredients": "tofu, quinoa",
       "preferred_cuisines": "Asian",
       "allergens": "peanuts",
       "notes": "High protein"
     }'
   ```

4. **PUT /api/preferences - Validation Error (400)**

   ```bash
   curl -X PUT http://localhost:4321/api/preferences \
     -H "Authorization: Bearer <jwt_token>" \
     -H "Content-Type: application/json" \
     -d '{"preferred_ingredients": "tofu"}'
   # Missing required diet_type
   ```

5. **PATCH /api/preferences - Success (200)**

   ```bash
   curl -X PATCH http://localhost:4321/api/preferences \
     -H "Authorization: Bearer <jwt_token>" \
     -H "Content-Type: application/json" \
     -d '{"allergens": "peanuts, tree nuts, soy"}'
   ```

6. **PATCH /api/preferences - No Fields (400)**

   ```bash
   curl -X PATCH http://localhost:4321/api/preferences \
     -H "Authorization: Bearer <jwt_token>" \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

7. **All endpoints - Unauthorized (401)**
   ```bash
   curl -X GET http://localhost:4321/api/preferences
   # No Authorization header
   ```

### Step 7: Documentation Updates

1. **Update API documentation** if separate docs exist
2. **Add JSDoc comments** to all service functions (already included above)
3. **Update types.ts** if any new types needed (already complete)

### Step 8: Environment Variables Check

Ensure `.env` file contains:

```env
PUBLIC_SUPABASE_URL=<your_supabase_project_url>
PUBLIC_SUPABASE_ANON_KEY=<your_supabase_anon_key>
```

### Step 10: Deployment Checklist

- [ ] All files created and placed in correct directories
- [ ] Validation schemas tested with various inputs
- [ ] Service functions handle all error scenarios
- [ ] Route handlers follow error handling guidelines
- [ ] Manual testing completed for all endpoints and scenarios
- [ ] Middleware properly configured
- [ ] Database migration applied
- [ ] Environment variables set
- [ ] Code reviewed and linted
- [ ] Documentation updated

---

## Summary

This implementation plan provides a comprehensive guide for implementing the User Preferences API endpoints. The design follows Astro best practices, leverages Supabase for backend services, and ensures proper validation, authentication, and error handling throughout.

**Key Implementation Files:**

1. `src/lib/validation/preferences.schemas.ts` - Zod validation schemas
2. `src/lib/services/preferences.service.ts` - Business logic layer
3. `src/pages/api/preferences/index.ts` - API route handlers

**Success Criteria:**

- All three endpoints (GET, PUT, PATCH) functional
- Proper authentication and authorization via Supabase RLS
- Input validation with clear error messages
- Consistent error response format
- Performance optimized for MVP scale
- Ready for frontend integration
