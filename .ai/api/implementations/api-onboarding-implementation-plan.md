# API Endpoint Implementation Plan: User Onboarding

## 1. Endpoint Overview

The User Onboarding endpoints manage the user onboarding wizard flow, tracking progress through a 5-step wizard and collecting dietary preferences. These endpoints enable:

- Retrieving current onboarding status
- Updating wizard progress step-by-step
- Completing the onboarding process and saving preferences

**Endpoints:**

- `GET /api/onboarding` - Get current user's onboarding status
- `PATCH /api/onboarding` - Update onboarding progress
- `POST /api/onboarding/complete` - Complete onboarding wizard

**Key Business Rules:**

- Onboarding has 5 steps (current_step: 1-5)
- Steps must be completed sequentially (no skipping)
- Completion requires current_step = 5 and all preference fields
- completed_at is set only when wizard is finished

---

## 2. Request Details

### 2.1 GET /api/onboarding

- **HTTP Method:** GET
- **URL Structure:** `/api/onboarding`
- **Parameters:** None
- **Request Body:** None

### 2.2 PATCH /api/onboarding

- **HTTP Method:** PATCH
- **URL Structure:** `/api/onboarding`
- **Parameters:** None
- **Request Body:**

```json
{
  "current_step": 2,
  "preferences": {
    "diet_type": "vegetarian",
    "preferred_ingredients": "tomatoes, basil, cheese",
    "preferred_cuisines": "Italian, Mediterranean",
    "allergens": "peanuts, shellfish"
  }
}
```

**Field Requirements:**

- `current_step` (required): number, 1-5
- `preferences` (optional): PreferencesInput object
  - `diet_type` (optional): string, max 50 chars
  - `preferred_ingredients` (optional): string, max 1000 chars
  - `preferred_cuisines` (optional): string, max 500 chars
  - `allergens` (optional): string, max 500 chars
  - `notes` (optional): string, max 2000 chars

### 2.3 POST /api/onboarding/complete

- **HTTP Method:** POST
- **URL Structure:** `/api/onboarding/complete`
- **Parameters:** None
- **Request Body:**

```json
{
  "preferences": {
    "diet_type": "vegetarian",
    "preferred_ingredients": "tomatoes, basil, cheese",
    "preferred_cuisines": "Italian, Mediterranean",
    "allergens": "peanuts, shellfish",
    "notes": "I prefer quick recipes under 30 minutes"
  }
}
```

**Field Requirements:**

- `preferences` (required): PreferencesInput object
  - `diet_type` (required): string, min 1 char, max 50 chars
  - `preferred_ingredients` (optional): string, max 1000 chars, defaults to ""
  - `preferred_cuisines` (optional): string, max 500 chars, defaults to ""
  - `allergens` (optional): string, max 500 chars, defaults to ""
  - `notes` (optional): string, max 2000 chars

---

## 3. Utilized Types

### 3.1 DTOs (from src/types.ts)

**Existing types to use:**

- `OnboardingStatus` - Response type for GET
- `OnboardingUpdateInput` - Request body type for PATCH
- `OnboardingCompleteInput` - Request body type for POST
- `OnboardingCompleteResponse` - Response type for POST complete
- `PreferencesInput` - Nested preferences object
- `UserPreferences` - Created preferences in complete response
- `ApiError` - Error response format

### 3.2 Validation Schemas (to create)

**New file:** `src/lib/validation/onboarding.schemas.ts`

```typescript
import { z } from "zod";
import { PreferencesInputSchema } from "./preferences.schemas";

// Schema for PATCH /api/onboarding
export const OnboardingUpdateInputSchema = z.object({
  current_step: z
    .number()
    .int("current_step must be an integer")
    .min(1, "current_step must be at least 1")
    .max(5, "current_step must be at most 5"),
  preferences: z
    .object({
      diet_type: z.string().max(50).optional(),
      preferred_ingredients: z.string().max(1000).optional(),
      preferred_cuisines: z.string().max(500).optional(),
      allergens: z.string().max(500).optional(),
      notes: z.string().max(2000).optional(),
    })
    .optional(),
});

// Schema for POST /api/onboarding/complete
export const OnboardingCompleteInputSchema = z.object({
  preferences: PreferencesInputSchema,
});
```

### 3.3 Service Functions (to create)

**New file:** `src/lib/services/onboarding.service.ts`

```typescript
import type { SupabaseClient } from "../../db/supabase.client";
import type { UserOnboardingEntity, PreferencesInput, UserPreferences } from "../../types";

export async function getOnboardingStatus(
  userId: string,
  supabase: SupabaseClient
): Promise<UserOnboardingEntity | null>;

export async function updateOnboardingProgress(
  userId: string,
  currentStep: number,
  supabase: SupabaseClient
): Promise<UserOnboardingEntity>;

export async function completeOnboarding(
  userId: string,
  preferences: PreferencesInput,
  supabase: SupabaseClient
): Promise<{ onboarding: UserOnboardingEntity; preferences: UserPreferences }>;
```

---

## 4. Response Details

### 4.1 GET /api/onboarding

**Success Response (200 OK):**

```json
{
  "user_id": "uuid",
  "current_step": 3,
  "completed_at": null,
  "created_at": "2025-10-12T10:00:00Z"
}
```

**Not Found Response (404):**

```json
{
  "error": "Onboarding not started",
  "message": "No onboarding record found for user"
}
```

### 4.2 PATCH /api/onboarding

**Success Response (200 OK):**

```json
{
  "user_id": "uuid",
  "current_step": 2,
  "completed_at": null,
  "created_at": "2025-10-12T10:00:00Z"
}
```

**Validation Error (400):**

```json
{
  "error": "Validation failed",
  "message": "current_step must be between 1 and 5",
  "details": { "fields": [...] }
}
```

### 4.3 POST /api/onboarding/complete

**Success Response (200 OK):**

```json
{
  "user_id": "uuid",
  "current_step": 5,
  "completed_at": "2025-10-12T10:10:00Z",
  "created_at": "2025-10-12T10:00:00Z",
  "preferences": {
    "user_id": "uuid",
    "diet_type": "vegetarian",
    "preferred_ingredients": "tomatoes, basil, cheese",
    "preferred_cuisines": "Italian, Mediterranean",
    "allergens": "peanuts, shellfish",
    "notes": "I prefer quick recipes under 30 minutes",
    "created_at": "2025-10-12T10:10:00Z",
    "updated_at": "2025-10-12T10:10:00Z"
  }
}
```

**Business Rule Violation (400):**

```json
{
  "error": "Cannot complete",
  "message": "Must be on step 5 to complete onboarding"
}
```

---

## 5. Data Flow

### 5.1 GET /api/onboarding Flow

```
Client Request
    ↓
API Route Handler (GET)
    ↓
getOnboardingStatus(testUserId, supabase)
    ↓
Query: SELECT * FROM user_onboarding WHERE user_id = ?
    ↓
Return onboarding record or null
    ↓
If null → 404 error
If found → 200 with onboarding data
```

### 5.2 PATCH /api/onboarding Flow

```
Client Request
    ↓
Parse JSON body
    ↓
Validate with OnboardingUpdateInputSchema
    ↓
updateOnboardingProgress(testUserId, current_step, supabase)
    ↓
Check if onboarding exists (or create if missing)
    ↓
UPDATE user_onboarding SET current_step = ?, updated_at = NOW()
    ↓
Return updated record → 200 OK
```

### 5.3 POST /api/onboarding/complete Flow

```
Client Request
    ↓
Parse JSON body
    ↓
Validate with OnboardingCompleteInputSchema
    ↓
completeOnboarding(testUserId, preferences, supabase)
    ↓
Check onboarding status
    ↓
Verify current_step = 5 (business rule check)
    ↓
Transaction:
  1. UPDATE user_onboarding SET completed_at = NOW(), current_step = 5
  2. INSERT/UPDATE user_preferences (upsert)
    ↓
Return onboarding + preferences → 200 OK
```

**Database Interactions:**

- Table: `user_onboarding` (read/write)
- Table: `user_preferences` (write on completion)
- No foreign service calls
- No file system operations

---

## 6. Security Considerations

### 6.1 Authentication

**Current Implementation (MVP):**

- No authentication required at this stage
- Use test user ID: `00000000-0000-0000-0000-000000000000`
- Follow same pattern as preferences endpoint

**Future Enhancement:**

- Extract user ID from JWT token via Supabase Auth
- Middleware will verify `Authorization: Bearer <token>`
- Replace test user ID with `auth.uid()`

### 6.2 Authorization

- Not applicable in current MVP phase
- Users can only access their own onboarding data (enforced by user_id)

### 6.3 Input Validation

**Validation layers:**

1. **JSON parsing**: Catch malformed JSON → 400 error
2. **Zod schema validation**: Type checking, format validation, length limits
3. **Business rule validation**:
   - current_step range (1-5)
   - Cannot complete unless on step 5
   - Sequential step progression (optional future enhancement)

### 6.4 Data Integrity

**Database constraints:**

- PRIMARY KEY on user_id (prevents duplicates)
- CHECK constraint: `completed_at IS NULL OR current_step = 5`
- FOREIGN KEY: user_id references auth.users ON DELETE CASCADE

**Application-level checks:**

- Verify onboarding exists before completion
- Verify current_step = 5 before allowing completion
- Use transactions for atomic operations

---

## 7. Error Handling

### 7.1 Error Scenarios and Responses

| Scenario                          | HTTP Status | Error Code             | Message                                     |
| --------------------------------- | ----------- | ---------------------- | ------------------------------------------- |
| Malformed JSON                    | 400         | Invalid JSON           | Request body must be valid JSON             |
| Invalid current_step (< 1 or > 5) | 400         | Validation failed      | current_step must be between 1 and 5        |
| Missing required field            | 400         | Validation failed      | [field name] is required                    |
| Field too long                    | 400         | Validation failed      | [field] must be at most [N] characters      |
| Onboarding not found (GET)        | 404         | Onboarding not started | No onboarding record found for user         |
| Try to complete before step 5     | 400         | Cannot complete        | Must be on step 5 to complete onboarding    |
| Database connection error         | 500         | Internal server error  | Failed to [action]. Please try again later. |
| Unexpected exception              | 500         | Internal server error  | An unexpected error occurred                |

### 7.2 Error Response Format

All errors follow consistent ApiError format:

```json
{
  "error": "Short error identifier",
  "message": "Human-readable error description",
  "details": {
    "fields": [...]  // Optional, for validation errors
  }
}
```

### 7.3 Error Handling Pattern

```typescript
try {
  // Parse JSON
  requestBody = await request.json();
} catch {
  return new Response(JSON.stringify({
    error: "Invalid JSON",
    message: "Request body must be valid JSON"
  }), { status: 400, headers: { "Content-Type": "application/json" } });
}

try {
  // Validate with Zod
  validatedData = Schema.parse(requestBody);
} catch (error) {
  if (error instanceof z.ZodError) {
    return new Response(JSON.stringify({
      error: "Validation failed",
      message: error.errors[0].message,
      details: { fields: error.errors }
    }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  throw error;
}

try {
  // Service layer call
  const result = await serviceFunction(...);
  return new Response(JSON.stringify(result), { status: 200, ... });
} catch (error) {
  console.error("Error in operation:", error);
  return new Response(JSON.stringify({
    error: "Internal server error",
    message: "Failed to perform operation"
  }), { status: 500, headers: { "Content-Type": "application/json" } });
}
```

---

## 8. Performance Considerations

### 8.1 Database Query Optimization

**Current queries:**

- `SELECT * FROM user_onboarding WHERE user_id = ?` → Single row lookup by PRIMARY KEY (fast)
- `UPDATE user_onboarding WHERE user_id = ?` → Single row update by PRIMARY KEY (fast)
- `INSERT INTO user_preferences` → Single row insert/upsert

**Indexes:**

- `user_onboarding.user_id` is PRIMARY KEY (automatic index)
- `user_preferences.user_id` is PRIMARY KEY (automatic index)
- No additional indexes needed for MVP

### 8.2 Potential Bottlenecks

**Low risk areas:**

- Simple CRUD operations on single rows
- No complex joins or aggregations
- No large data transfers

**Future optimization opportunities:**

- Add caching for frequently accessed onboarding status
- Consider connection pooling for Supabase client
- Monitor query execution times in production

### 8.3 Response Time Targets

- GET /api/onboarding: < 100ms
- PATCH /api/onboarding: < 150ms
- POST /api/onboarding/complete: < 200ms (two DB writes)

---

## 9. Implementation Steps

### Step 1: Create Validation Schemas

**File:** `src/lib/validation/onboarding.schemas.ts`

1. Import Zod and existing PreferencesInputSchema
2. Create `OnboardingUpdateInputSchema`:
   - current_step: number, integer, 1-5
   - preferences: optional object with optional fields
3. Create `OnboardingCompleteInputSchema`:
   - preferences: required, reuse PreferencesInputSchema
4. Export both schemas

**Acceptance Criteria:**

- Schemas properly validate step range
- Schemas validate field length constraints
- Schemas provide clear error messages

---

### Step 2: Create Onboarding Service

**File:** `src/lib/services/onboarding.service.ts`

1. Import SupabaseClient type and relevant DTOs from types.ts
2. Implement `getOnboardingStatus(userId, supabase)`:
   - Query user_onboarding by user_id
   - Return null if not found (handle PGRST116 error code)
   - Throw error for other database errors
3. Implement `updateOnboardingProgress(userId, currentStep, supabase)`:
   - Upsert user_onboarding record
   - Set current_step, update created_at if new
   - Return updated record
4. Implement `completeOnboarding(userId, preferences, supabase)`:
   - Get current onboarding status
   - Validate current_step = 5 (business rule)
   - Update user_onboarding: set completed_at = NOW(), current_step = 5
   - Upsert user_preferences using preferences.service.updateUserPreferences
   - Return both onboarding and preferences objects

**Acceptance Criteria:**

- Service functions handle null/not found cases
- Business rules are enforced (step 5 for completion)
- Database errors are propagated correctly
- Service is type-safe with proper TypeScript types

---

### Step 3: Create API Route File

**File:** `src/pages/api/onboarding/index.ts`

1. Set `export const prerender = false`
2. Import APIRoute type from Astro
3. Import validation schemas, service functions, and types
4. Define test user ID constant
5. Implement `GET` handler:
   - Call getOnboardingStatus with test user ID
   - Return 404 if null, 200 with data if found
   - Handle exceptions with 500 error
6. Implement `PATCH` handler:
   - Parse JSON body (handle invalid JSON)
   - Validate with OnboardingUpdateInputSchema
   - Call updateOnboardingProgress
   - Return 200 with updated onboarding
   - Handle validation errors (400) and exceptions (500)

**Acceptance Criteria:**

- All HTTP methods return proper status codes
- Error responses follow ApiError format
- Content-Type headers set to application/json
- Follows pattern from preferences endpoint

---

### Step 4: Create Onboarding Complete Route

**File:** `src/pages/api/onboarding/complete.ts`

1. Set `export const prerender = false`
2. Import APIRoute, schemas, service, types
3. Define test user ID constant
4. Implement `POST` handler:
   - Parse JSON body (handle invalid JSON)
   - Validate with OnboardingCompleteInputSchema
   - Call completeOnboarding service
   - Check if current_step = 5 (in service or here)
   - Return 200 with OnboardingCompleteResponse format
   - Handle business rule violations (400)
   - Handle exceptions (500)

**Acceptance Criteria:**

- POST returns proper OnboardingCompleteResponse structure
- Business rule "must be on step 5" is enforced
- Error responses follow ApiError format
- Includes both onboarding and preferences in success response

---

### Step 5: Update Database Migration (if needed)

**File:** `supabase/migrations/20251012000000_initial_schema.sql`

1. Verify user_onboarding table exists with correct schema:
   - user_id uuid PRIMARY KEY
   - current_step smallint NOT NULL DEFAULT 1
   - completed_at timestamptz NULL
   - created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
   - CHECK (current_step BETWEEN 1 AND 5)
   - CHECK (completed_at IS NULL OR current_step = 5)
2. Add updated_at column if missing:
   - updated_at timestamptz DEFAULT timezone('utc', now())

**Acceptance Criteria:**

- Table schema matches requirements
- Constraints are enforced at database level
- Migration runs without errors

---

### Step 6: Manual Testing

**Test Cases:**

1. **GET /api/onboarding (not found scenario)**
   - Expected: 404 with "Onboarding not started" message

2. **PATCH /api/onboarding (create new record)**
   - Body: `{ "current_step": 1 }`
   - Expected: 200 with onboarding record, current_step = 1

3. **PATCH /api/onboarding (update to step 2)**
   - Body: `{ "current_step": 2, "preferences": { "diet_type": "vegan" } }`
   - Expected: 200 with current_step = 2

4. **PATCH with invalid step**
   - Body: `{ "current_step": 10 }`
   - Expected: 400 validation error

5. **POST /api/onboarding/complete (before step 5)**
   - Body: `{ "preferences": { "diet_type": "vegetarian", ... } }`
   - Expected: 400 "Must be on step 5"

6. **PATCH to step 5, then POST complete**
   - PATCH body: `{ "current_step": 5 }`
   - POST body: `{ "preferences": { "diet_type": "vegetarian", ... } }`
   - Expected: 200 with completed_at set and preferences created

7. **GET /api/onboarding (completed)**
   - Expected: 200 with current_step = 5, completed_at not null

8. **Invalid JSON**
   - Body: `{ invalid json`
   - Expected: 400 "Invalid JSON"

**Acceptance Criteria:**

- All test cases pass
- Status codes match specification
- Response formats match API plan
- Business rules are enforced

---

### Step 7: Code Review and Cleanup

1. Review code for consistency with preferences endpoint pattern
2. Check TypeScript types are properly used
3. Verify error messages are clear and helpful
4. Ensure all console.error statements include context
5. Remove any debug logging
6. Add inline comments for complex business logic
7. Verify imports are organized

**Acceptance Criteria:**

- Code follows project conventions
- No TypeScript errors
- No linter warnings
- Code is readable and maintainable

---

## 10. Future Enhancements

### Authentication Integration

- Replace test user ID with `locals.supabase.auth.getUser()`
- Extract user ID from JWT token
- Add authentication middleware check

### Sequential Step Validation

- Track which steps were previously completed
- Prevent skipping steps (e.g., can't go from step 2 to step 5)
- Add step history tracking

### Row Level Security (RLS)

- Enable RLS on user_onboarding table
- Add policy: `user_id = auth.uid()`
- Test with authenticated requests

### Automated Tests

- Unit tests for service functions
- Integration tests for API endpoints
- Test edge cases and error scenarios

---

## 11. References

**Related Files:**

- Database schema: `supabase/migrations/20251012000000_initial_schema.sql`
- Database types: `src/db/database.types.ts`
- Shared types: `src/types.ts`
- Preferences endpoint (reference): `src/pages/api/preferences/index.ts`
- Preferences service (reference): `src/lib/services/preferences.service.ts`
- Preferences schemas (reference): `src/lib/validation/preferences.schemas.ts`

**API Documentation:**

- Full API specification: `.ai/api-plan.md` (section 2.1)
- Database plan: `.ai/db-plan.md`
- Tech stack: `.ai/tech-stack.md`

---

**End of Implementation Plan**
