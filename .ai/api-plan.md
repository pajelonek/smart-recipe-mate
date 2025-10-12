# REST API Plan

## Overview

This document defines the REST API for Smart Recipe Mate MVP. The API follows RESTful principles and leverages Supabase Auth for authentication. All endpoints require authenticated requests unless explicitly marked as public.

**Base URL:** `/api`

**Authentication:** JWT tokens via Supabase Auth (passed in `Authorization: Bearer <token>` header)

**Content Type:** `application/json`

---

## 1. Resources

| Resource | Database Table | Description |
|----------|---------------|-------------|
| Onboarding | `smart_recipe_mate.user_onboarding` | User onboarding wizard progress |
| Preferences | `smart_recipe_mate.user_preferences` | User dietary preferences and restrictions |
| Recipes | `smart_recipe_mate.recipes` | User recipe repository |
| Tags | `smart_recipe_mate.tags` | User-defined recipe tags |
| Recipe Tags | `smart_recipe_mate.recipe_tags` | Recipe-tag associations |
| AI Generations | `smart_recipe_mate.ai_generations` | AI recipe generation history |

**Note:** Authentication resources (registration, login, logout, password reset) are handled directly by Supabase Auth SDK and are not exposed as custom API endpoints.

---

## 2. API Endpoints

### 2.1 Onboarding

#### GET /api/onboarding

Get current user's onboarding status.

**Authentication:** Required

**Query Parameters:** None

**Response 200 OK:**
```json
{
  "user_id": "uuid",
  "current_step": 3,
  "completed_at": null,
  "created_at": "2025-10-12T10:00:00Z"
}
```

**Response 404 Not Found:**
```json
{
  "error": "Onboarding not started",
  "message": "No onboarding record found for user"
}
```

---

#### PATCH /api/onboarding

Update onboarding progress. This endpoint saves progress for the current step and optionally advances to the next step.

**Authentication:** Required

**Request Body:**
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

**Validation:**
- `current_step` must be between 1 and 5
- When advancing to step 5, all preference fields must be complete
- Cannot skip steps (must progress sequentially)

**Response 200 OK:**
```json
{
  "user_id": "uuid",
  "current_step": 2,
  "completed_at": null,
  "created_at": "2025-10-12T10:00:00Z",
  "updated_at": "2025-10-12T10:05:00Z"
}
```

**Response 400 Bad Request:**
```json
{
  "error": "Invalid step",
  "message": "current_step must be between 1 and 5"
}
```

---

#### POST /api/onboarding/complete

Complete the onboarding wizard. Sets `completed_at` and `current_step = 5`.

**Authentication:** Required

**Request Body:**
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

**Validation:**
- All required preference fields must be provided
- Can only complete if `current_step = 5`

**Response 200 OK:**
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

**Response 400 Bad Request:**
```json
{
  "error": "Cannot complete",
  "message": "Must be on step 5 to complete onboarding"
}
```

---

### 2.2 User Preferences

#### GET /api/preferences

Get current user's dietary preferences.

**Authentication:** Required

**Query Parameters:** None

**Response 200 OK:**
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

**Response 404 Not Found:**
```json
{
  "error": "Preferences not found",
  "message": "User has not completed onboarding"
}
```

---

#### PUT /api/preferences

Replace all user preferences (full update).

**Authentication:** Required

**Request Body:**
```json
{
  "diet_type": "vegan",
  "preferred_ingredients": "tofu, quinoa, kale",
  "preferred_cuisines": "Asian, Middle Eastern",
  "allergens": "peanuts, tree nuts",
  "notes": "High protein meals preferred"
}
```

**Validation:**
- `diet_type` is required
- `preferred_ingredients`, `preferred_cuisines`, `allergens` default to empty string if not provided

**Response 200 OK:**
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

**Response 400 Bad Request:**
```json
{
  "error": "Validation failed",
  "message": "diet_type is required"
}
```

---

#### PATCH /api/preferences

Partially update user preferences.

**Authentication:** Required

**Request Body:**
```json
{
  "allergens": "peanuts, tree nuts, soy"
}
```

**Validation:**
- At least one field must be provided
- Only provided fields are updated

**Response 200 OK:**
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

---

### 2.3 Recipes

#### GET /api/recipes

List user's recipes with optional search and filtering.

**Authentication:** Required

**Response 200 OK:**
```json
{
  "recipes": [
    {
      "id": "uuid",
      "owner_id": "uuid",
      "title": "Tomato Basil Pasta",
      "summary": "Quick and delicious Italian pasta",
      "ingredients": "200g pasta, 4 tomatoes, fresh basil, olive oil",
      "preparation": "1. Boil pasta. 2. Sauté tomatoes. 3. Mix and serve.",
      "created_at": "2025-10-12T10:00:00Z",
      "updated_at": "2025-10-12T10:00:00Z",
      "tags": [
        {
          "id": "uuid",
          "name": "Italian",
          "created_at": "2025-10-12T09:00:00Z"
        },
        {
          "id": "uuid",
          "name": "Quick",
          "created_at": "2025-10-12T09:00:00Z"
        }
      ]
    }
  ]
}
```

---

#### GET /api/recipes/:id

Get a single recipe by ID.

**Authentication:** Required

**Path Parameters:**
- `id` (uuid) - Recipe ID

**Response 200 OK:**
```json
{
  "id": "uuid",
  "owner_id": "uuid",
  "title": "Tomato Basil Pasta",
  "summary": "Quick and delicious Italian pasta",
  "ingredients": "200g pasta, 4 tomatoes, fresh basil, olive oil",
  "preparation": "1. Boil pasta. 2. Sauté tomatoes. 3. Mix and serve.",
  "created_at": "2025-10-12T10:00:00Z",
  "updated_at": "2025-10-12T10:00:00Z",
  "tags": [
    {
      "id": "uuid",
      "name": "Italian",
      "created_at": "2025-10-12T09:00:00Z"
    }
  ]
}
```

**Response 404 Not Found:**
```json
{
  "error": "Recipe not found",
  "message": "Recipe does not exist or has been deleted"
}
```

**Response 403 Forbidden:**
```json
{
  "error": "Access denied",
  "message": "You do not have permission to access this recipe"
}
```

---

#### POST /api/recipes

Create a new recipe.

**Authentication:** Required

**Request Body:**
```json
{
  "title": "Vegetable Stir Fry",
  "summary": "Healthy and colorful Asian stir fry",
  "ingredients": "Bell peppers, broccoli, carrots, soy sauce, ginger",
  "preparation": "1. Chop vegetables. 2. Heat wok. 3. Stir fry for 5 minutes.",
  "tag_names": ["Asian", "Healthy", "Quick"]
}
```

**Validation:**
- `title` is required (not empty)
- `ingredients` is required (not empty)
- `preparation` is required (not empty)
- `tag_names` is optional, max 10 tags

**Response 201 Created:**
```json
{
  "id": "uuid",
  "owner_id": "uuid",
  "title": "Vegetable Stir Fry",
  "summary": "Healthy and colorful Asian stir fry",
  "ingredients": "Bell peppers, broccoli, carrots, soy sauce, ginger",
  "preparation": "1. Chop vegetables. 2. Heat wok. 3. Stir fry for 5 minutes.",
  "created_at": "2025-10-12T12:00:00Z",
  "updated_at": "2025-10-12T12:00:00Z",
  "tags": [
    {
      "id": "uuid",
      "name": "Asian",
      "created_at": "2025-10-12T12:00:00Z"
    },
    {
      "id": "uuid",
      "name": "Healthy",
      "created_at": "2025-10-12T12:00:00Z"
    },
    {
      "id": "uuid",
      "name": "Quick",
      "created_at": "2025-10-12T12:00:00Z"
    }
  ]
}
```

**Response 400 Bad Request:**
```json
{
  "error": "Validation failed",
  "message": "title, ingredients, and preparation are required"
}
```

**Response 422 Unprocessable Entity:**
```json
{
  "error": "Too many tags",
  "message": "Maximum 10 tags allowed per recipe"
}
```

---

#### PUT /api/recipes/:id

Replace entire recipe (full update).

**Authentication:** Required

**Path Parameters:**
- `id` (uuid) - Recipe ID

**Request Body:**
```json
{
  "title": "Updated Vegetable Stir Fry",
  "summary": "Improved version with extra vegetables",
  "ingredients": "Bell peppers, broccoli, carrots, mushrooms, soy sauce, ginger, garlic",
  "preparation": "1. Prep all vegetables. 2. Heat wok with oil. 3. Stir fry 7 minutes.",
  "tag_names": ["Asian", "Healthy", "Dinner"]
}
```

**Validation:**
- Same as POST /api/recipes

**Response 200 OK:**
```json
{
  "id": "uuid",
  "owner_id": "uuid",
  "title": "Updated Vegetable Stir Fry",
  "summary": "Improved version with extra vegetables",
  "ingredients": "Bell peppers, broccoli, carrots, mushrooms, soy sauce, ginger, garlic",
  "preparation": "1. Prep all vegetables. 2. Heat wok with oil. 3. Stir fry 7 minutes.",
  "created_at": "2025-10-12T12:00:00Z",
  "updated_at": "2025-10-12T13:00:00Z",
  "tags": [
    {
      "id": "uuid",
      "name": "Asian",
      "created_at": "2025-10-12T12:00:00Z"
    },
    {
      "id": "uuid",
      "name": "Healthy",
      "created_at": "2025-10-12T12:00:00Z"
    },
    {
      "id": "uuid",
      "name": "Dinner",
      "created_at": "2025-10-12T13:00:00Z"
    }
  ]
}
```

**Response 404 Not Found:**
```json
{
  "error": "Recipe not found",
  "message": "Recipe does not exist or has been deleted"
}
```

**Response 403 Forbidden:**
```json
{
  "error": "Access denied",
  "message": "You can only update your own recipes"
}
```

---

#### PATCH /api/recipes/:id

Partially update recipe.

**Authentication:** Required

**Path Parameters:**
- `id` (uuid) - Recipe ID

**Request Body:**
```json
{
  "summary": "Updated summary only"
}
```

**Validation:**
- At least one field must be provided
- If updating required fields (title, ingredients, preparation), they must not be empty

**Response 200 OK:**
```json
{
  "id": "uuid",
  "owner_id": "uuid",
  "title": "Updated Vegetable Stir Fry",
  "summary": "Updated summary only",
  "ingredients": "Bell peppers, broccoli, carrots, mushrooms, soy sauce, ginger, garlic",
  "preparation": "1. Prep all vegetables. 2. Heat wok with oil. 3. Stir fry 7 minutes.",
  "created_at": "2025-10-12T12:00:00Z",
  "updated_at": "2025-10-12T13:30:00Z",
  "tags": [
    {
      "id": "uuid",
      "name": "Asian",
      "created_at": "2025-10-12T12:00:00Z"
    }
  ]
}
```

---

#### DELETE /api/recipes/:id

Soft delete a recipe (sets `deleted_at` timestamp).

**Authentication:** Required

**Path Parameters:**
- `id` (uuid) - Recipe ID

**Response 204 No Content**

(Empty response body)

**Response 404 Not Found:**
```json
{
  "error": "Recipe not found",
  "message": "Recipe does not exist or has already been deleted"
}
```

**Response 403 Forbidden:**
```json
{
  "error": "Access denied",
  "message": "You can only delete your own recipes"
}
```
---

### 2.4 Tags

#### GET /api/tags

Get all tags for the current user (for autocomplete).

**Authentication:** Required

**Query Parameters:**
- `search` (string, optional) - Filter tags by name (partial match)

**Response 200 OK:**
```json
{
  "tags": [
    {
      "id": "uuid",
      "owner_id": "uuid",
      "name": "Italian",
      "created_at": "2025-10-12T09:00:00Z",
      "recipe_count": 12
    },
    {
      "id": "uuid",
      "owner_id": "uuid",
      "name": "Quick",
      "created_at": "2025-10-12T09:00:00Z",
      "recipe_count": 25
    },
    {
      "id": "uuid",
      "owner_id": "uuid",
      "name": "Healthy",
      "created_at": "2025-10-12T09:00:00Z",
      "recipe_count": 18
    }
  ]
}
```

---

#### POST /api/recipes/:recipeId/tags

Add tags to a recipe. Creates new tags if they don't exist.

**Authentication:** Required

**Path Parameters:**
- `recipeId` (uuid) - Recipe ID

**Request Body:**
```json
{
  "tag_names": ["Vegan", "High Protein", "Dinner"]
}
```

**Validation:**
- Recipe must not exceed 10 total tags after adding
- Tag names are trimmed and validated (non-empty, max length 50)
- Duplicate tag names for same user are handled (reuse existing tag)

**Response 200 OK:**
```json
{
  "recipe_id": "uuid",
  "tags": [
    {
      "id": "uuid",
      "name": "Vegan",
      "created_at": "2025-10-12T14:00:00Z"
    },
    {
      "id": "uuid",
      "name": "High Protein",
      "created_at": "2025-10-12T14:00:00Z"
    },
    {
      "id": "uuid",
      "name": "Dinner",
      "created_at": "2025-10-12T14:00:00Z"
    }
  ],
  "message": "Tags added successfully"
}
```

**Response 422 Unprocessable Entity:**
```json
{
  "error": "Tag limit exceeded",
  "message": "Recipe already has 10 tags. Remove some tags before adding new ones."
}
```

**Response 404 Not Found:**
```json
{
  "error": "Recipe not found",
  "message": "Recipe does not exist or has been deleted"
}
```

---

#### DELETE /api/recipes/:recipeId/tags/:tagId

Remove a tag from a recipe.

**Authentication:** Required

**Path Parameters:**
- `recipeId` (uuid) - Recipe ID
- `tagId` (uuid) - Tag ID

**Response 204 No Content**

(Empty response body)

**Response 404 Not Found:**
```json
{
  "error": "Association not found",
  "message": "Tag is not associated with this recipe"
}
```

---

### 2.5 AI Recipe Generation

#### POST /api/ai/generate-recipe

Generate a new recipe using AI based on available ingredients and user preferences.

**Authentication:** Required

**Request Body:**
```json
{
  "available_ingredients": ["chicken breast", "broccoli", "garlic", "olive oil"],
  "dietary_goals": "high protein, low carb",
  "additional_context": "Quick weeknight dinner under 30 minutes"
}
```

**Validation:**
- `available_ingredients` is required (array, min 1 item)
- User preferences are automatically included from user profile
- System creates `ai_generations` record before calling AI

**Response 200 OK:**
```json
{
  "generation_id": "uuid",
  "recipe": {
    "title": "Garlic Chicken with Broccoli",
    "summary": "A quick and healthy high-protein dinner ready in 25 minutes",
    "ingredients": "2 chicken breasts, 2 cups broccoli florets, 3 cloves garlic minced, 2 tbsp olive oil, salt and pepper to taste",
    "preparation": "1. Season chicken with salt and pepper. 2. Heat olive oil in a pan over medium-high heat. 3. Cook chicken 6-7 minutes per side until golden and cooked through. 4. Remove chicken and set aside. 5. In the same pan, sauté garlic for 30 seconds. 6. Add broccoli and cook 5-6 minutes until tender-crisp. 7. Slice chicken and serve with broccoli."
  },
  "input_payload": {
    "available_ingredients": ["chicken breast", "broccoli", "garlic", "olive oil"],
    "dietary_goals": "high protein, low carb",
    "additional_context": "Quick weeknight dinner under 30 minutes",
    "user_preferences": {
      "diet_type": "omnivore",
      "preferred_ingredients": "chicken, vegetables",
      "preferred_cuisines": "American, Asian",
      "allergens": "peanuts, shellfish"
    }
  },
  "created_at": "2025-10-12T15:00:00Z"
}
```

**Response 422 Unprocessable Entity (No suggestions):**
```json
{
  "error": "No recipe generated",
  "message": "Unable to generate a recipe with the provided ingredients and preferences. Try adding more ingredients or adjusting dietary requirements.",
  "generation_id": "uuid",
  "suggestions": [
    "Add a protein source (meat, tofu, eggs)",
    "Include a carbohydrate (rice, pasta, potatoes)",
    "Relax dietary restrictions"
  ]
}
```

**Response 429 Too Many Requests:**
```json
{
  "error": "Rate limit exceeded",
  "message": "You have exceeded the AI generation limit. Please try again in 45 minutes.",
  "retry_after": 2700
}
```

**Response 500 Internal Server Error:**
```json
{
  "error": "AI service error",
  "message": "Failed to generate recipe. The error has been logged.",
  "generation_id": "uuid"
}
```

**Note:** All generation attempts (successful or failed) are logged to `ai_generations` table with full context for diagnostics.

---

#### GET /api/ai/generations

Get AI generation history for current user.

**Authentication:** Required

**Query Parameters:**
- `status` (string, optional) - Filter by status: "success", "error", "all" (default: "all")

**Response 200 OK:**
```json
{
  "generations": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "input_payload": {
        "available_ingredients": ["chicken breast", "broccoli", "garlic", "olive oil"],
        "dietary_goals": "high protein, low carb"
      },
      "output_payload": {
        "title": "Garlic Chicken with Broccoli",
        "summary": "A quick and healthy high-protein dinner",
        "ingredients": "...",
        "preparation": "..."
      },
      "error_message": null,
      "created_at": "2025-10-12T15:00:00Z"
    },
    {
      "id": "uuid",
      "user_id": "uuid",
      "input_payload": {
        "available_ingredients": ["tomato", "cheese"]
      },
      "output_payload": null,
      "error_message": "Insufficient ingredients to create a complete meal",
      "created_at": "2025-10-12T14:00:00Z"
    }
  ]
}
```

---

#### GET /api/ai/generations/:id

Get details of a specific AI generation.

**Authentication:** Required

**Path Parameters:**
- `id` (uuid) - Generation ID

**Response 200 OK:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "input_payload": {
    "available_ingredients": ["chicken breast", "broccoli", "garlic", "olive oil"],
    "dietary_goals": "high protein, low carb",
    "additional_context": "Quick weeknight dinner under 30 minutes",
    "user_preferences": {
      "diet_type": "omnivore",
      "preferred_ingredients": "chicken, vegetables",
      "preferred_cuisines": "American, Asian",
      "allergens": "peanuts, shellfish"
    }
  },
  "output_payload": {
    "title": "Garlic Chicken with Broccoli",
    "summary": "A quick and healthy high-protein dinner ready in 25 minutes",
    "ingredients": "2 chicken breasts, 2 cups broccoli florets, 3 cloves garlic minced, 2 tbsp olive oil, salt and pepper to taste",
    "preparation": "1. Season chicken with salt and pepper. 2. Heat olive oil in a pan..."
  },
  "error_message": null,
  "created_at": "2025-10-12T15:00:00Z"
}
```

**Response 404 Not Found:**
```json
{
  "error": "Generation not found",
  "message": "AI generation record does not exist"
}
```

**Response 403 Forbidden:**
```json
{
  "error": "Access denied",
  "message": "You can only access your own AI generations"
}
```

---

## 4. Validation and Business Logic

### 4.1 Validation Rules

#### Onboarding
- `current_step` must be between 1 and 5
- Cannot complete onboarding (set `completed_at`) unless `current_step = 5`
- All preference fields must be filled before completing onboarding
- Steps must be completed sequentially (no skipping)

#### User Preferences
- `diet_type` is required (cannot be empty)
- `preferred_ingredients`, `preferred_cuisines`, `allergens` default to empty string
- Maximum field lengths:
  - `diet_type`: 50 characters
  - `preferred_ingredients`: 1000 characters
  - `preferred_cuisines`: 500 characters
  - `allergens`: 500 characters
  - `notes`: 2000 characters

#### Recipes
- `title` is required (1-200 characters)
- `ingredients` is required (10-5000 characters)
- `preparation` is required (10-10000 characters)
- `summary` is optional (0-500 characters)
- Maximum 10 tags per recipe
- `deleted_at` timestamp used for soft deletes (null = active)

#### Tags
- `name` is required (1-50 characters)
- Tag names are trimmed of whitespace
- Tag names must be unique per user (case-insensitive)
- Empty or whitespace-only names are rejected

#### AI Generations
- `available_ingredients` array must have at least 1 item
- Each ingredient string: 1-100 characters
- `dietary_goals` optional (0-500 characters)
- `additional_context` optional (0-1000 characters)

### 4.2 Business Logic Implementation

#### Onboarding Flow
1. **User Registration:**
   - User registers via Supabase Auth
   - System creates `user_onboarding` record with `current_step = 1`
   - Email verification sent

2. **First Login:**
   - After email verification, user logs in
   - Frontend checks `GET /api/onboarding`
   - If `completed_at IS NULL`, redirect to onboarding wizard
   - Otherwise, redirect to recipe list

3. **Wizard Progress:**
   - Each step calls `PATCH /api/onboarding` with current step data
   - System validates step data and updates `current_step`
   - Frontend cannot skip steps (enforced by API)

4. **Wizard Completion:**
   - Step 5 calls `POST /api/onboarding/complete`
   - System creates/updates `user_preferences` record
   - Sets `onboarding.completed_at = now()` and `current_step = 5`
   - User can now access full application

#### Recipe Management
1. **Adding Recipe:**
   - `POST /api/recipes` with title, ingredients, preparation, optional tags
   - System validates required fields
   - If `tag_names` provided:
     - Look up existing tags by name (case-insensitive)
     - Create new tags if they don't exist
     - Create `recipe_tags` associations
   - Return created recipe

2. **Editing Recipe:**
   - `PUT` or `PATCH /api/recipes/:id`
   - System validates ownership (owner_id = auth.uid())
   - Updates `updated_at` timestamp
   - If tags modified, update `recipe_tags` associations

3. **Deleting Recipe:**
   - `DELETE /api/recipes/:id`
   - System validates ownership
   - Sets `deleted_at = now()` (soft delete)
   - Recipe no longer appears in listings
   - Related `recipe_tags` cascade delete via database FK

4. **Searching/Filtering:**
   - Title search: case-insensitive ILIKE match
   - Tag filter: recipe must have ALL specified tags (AND logic)
   - Always filter `WHERE deleted_at IS NULL`
   - Always filter `WHERE owner_id = auth.uid()`

#### Tag Management
1. **Tag Creation:**
   - Tags created implicitly when adding/updating recipes with `tag_names`
   - Or explicitly via recipe tag addition
   - System checks UNIQUE constraint (owner_id, name)
   - If tag exists, reuse existing; otherwise create new

2. **Tag Assignment:**
   - `POST /api/recipes/:recipeId/tags` with `tag_names` array
   - System validates recipe doesn't exceed 10 tags after addition
   - Creates new tags if needed (unique per user)
   - Creates `recipe_tags` associations
   - Duplicate assignments are ignored (idempotent)

3. **Tag Removal:**
   - `DELETE /api/recipes/:recipeId/tags/:tagId`
   - Deletes `recipe_tags` association
   - Tag itself remains in `tags` table for other recipes

4. **Tag Cleanup:**
   - Tags are NOT automatically deleted when last recipe association removed
   - Tags persist for user's future use
   - Users can see all their tags via `GET /api/tags`

#### AI Recipe Generation
1. **Generation Request:**
   - `POST /api/ai/generate-recipe` with ingredients and optional goals
   - Fetches user preferences from `user_preferences`
   - Creates `ai_generations` record with status pending
   - Combines user input + preferences into AI prompt
   - Calls external AI service (OpenRouter)

2. **AI Response Handling:**
   - **Success:** Updates `ai_generations.output_payload` with response
   - **Failure:** Updates `ai_generations.error_message`
   - Returns result to frontend

3. **Recipe Acceptance:**
   - User reviews AI-generated recipe in frontend
   - If accepted: `POST /api/recipes` with recipe data
   - If rejected: Nothing saved, but generation record persists

4. **Generation History:**
   - All generations saved in `ai_generations` (success or failure)
   - Users can view history via `GET /api/ai/generations`


#### Error Handling
1. **Validation Errors (400):**
   - Missing required fields
   - Invalid field formats
   - Out-of-range values
   - Return descriptive error message

2. **Authentication Errors (401):**
   - Missing or invalid JWT token
   - Expired session
   - Return generic "Unauthorized" message

3. **Authorization Errors (403):**
   - Attempting to access another user's resources
   - Return "Access denied" message

4. **Not Found Errors (404):**
   - Resource doesn't exist
   - Resource was soft-deleted
   - Return "Not found" message

5. **Unprocessable Entity (422):**
   - Business rule violations (e.g., tag limit exceeded)
   - AI unable to generate recipe
   - Return specific business rule error

6. **Server Errors (500):**
   - Unexpected errors logged to system
   - AI service failures logged to `ai_generations.error_message`
   - Return generic "Internal server error" to user

### 4.3 Data Integrity

1. **Foreign Key Constraints:**
   - All user data cascades on user deletion (ON DELETE CASCADE)
   - Recipe deletion cascades to recipe_tags

2. **Soft Delete:**
   - Recipes use `deleted_at` timestamp
   - Maintains referential integrity
   - Allows potential "restore" feature in future

3. **Unique Constraints:**
   - Tags: UNIQUE(owner_id, name) prevents duplicate tag names per user
   - Recipe Tags: PRIMARY KEY(recipe_id, tag_id) prevents duplicate associations

4. **Timestamps:**
   - All entities have `created_at` (immutable)
   - Mutable entities have `updated_at` (auto-updated)
   - Onboarding has `completed_at` (set once)
   - Recipes have `deleted_at` (soft delete marker)

---


## 6. Error Response Format

All error responses follow consistent format:

```json
{
  "error": "Short error identifier",
  "message": "Human-readable error description",
  "details": {
    "field": "Additional context (optional)"
  }
}
```

**HTTP Status Codes Used:**
- `200 OK` - Successful GET/PUT/PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Authentication required/failed
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Business rule violation
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## 7. API Versioning

**Current Version:** v1 (implicit)

All endpoints are under `/api` without explicit version prefix. Future versions will use:
- `/api/v2/...` for breaking changes
- v1 endpoints remain at `/api/...` for backward compatibility

---

## 9. Logging and Monitoring

**Request Logging:**
- All API requests logged with: timestamp, user_id, method, path, status, duration
- PII (personally identifiable information) excluded from logs

**Error Logging:**
- All 5xx errors logged with stack traces
- All AI service errors logged to `ai_generations.error_message`

**Metrics:**
- API endpoint response times
- AI generation success/failure rates
- Rate limit violations
- Authentication failures

---

## 11. Implementation Notes for Astro/Supabase

**Tech Stack Integration:**

1. **Astro API Routes:**
   - API endpoints implemented as Astro API routes in `src/pages/api/`
   - Example: `src/pages/api/recipes/index.ts` for GET/POST `/api/recipes`
   - Example: `src/pages/api/recipes/[id].ts` for GET/PUT/PATCH/DELETE `/api/recipes/:id`

2. **Supabase Client:**
   - Server-side Supabase client in `src/db/supabase.client.ts`
   - JWT verification via Supabase `getUser()` method
   - RLS policies automatically enforce authorization

3. **Middleware:**
   - Authentication middleware in `src/middleware/index.ts`
   - Verifies JWT token and attaches user to request context
   - Checks onboarding completion for protected routes

4. **Type Safety:**
   - Database types from `src/db/database.types.ts` (generated by Supabase CLI)
   - Shared DTOs in `src/types.ts`
   - TypeScript validation for request/response payloads

5. **AI Integration:**
   - OpenRouter API client in `src/lib/ai-service.ts`
   - API key stored in environment variables
   - Retry logic with exponential backoff

6. **Error Handling:**
   - Centralized error handler in `src/lib/error-handler.ts`
   - Consistent error response format
   - Automatic error logging

---

## Appendix: Example API Flows

### Flow 1: New User Registration to First Recipe

1. **Register:** User calls Supabase Auth `signUp()`
2. **Verify Email:** User clicks verification link
3. **Login:** User calls Supabase Auth `signInWithPassword()`
4. **Check Onboarding:** Frontend calls `GET /api/onboarding` → returns `current_step: 1, completed_at: null`
5. **Complete Wizard:**
   - Step 1: `PATCH /api/onboarding` with step 1 data
   - Step 2: `PATCH /api/onboarding` with step 2 data
   - ...
   - Step 5: `POST /api/onboarding/complete` with all preferences
6. **Redirect to Recipes:** Frontend navigates to recipe list
7. **Add Recipe:** User calls `POST /api/recipes` with recipe data
8. **View Recipe:** Recipe appears in `GET /api/recipes` list

### Flow 2: AI Recipe Generation

1. **Generate:** User calls `POST /api/ai/generate-recipe` with ingredients
2. **Review:** Frontend displays AI-generated recipe from response
3. **Accept:** User clicks "Save" → `POST /api/recipes` with recipe data (title, ingredients, preparation)
4. **View History:** User can see generation in `GET /api/ai/generations`

### Flow 3: Recipe Search and Tag Filter

1. **List All:** `GET /api/recipes` → returns all user recipes
2. **Search:** `GET /api/recipes?search=pasta` → returns matching recipes
3. **Filter Tags:** `GET /api/recipes?tags=Italian,Quick` → returns recipes with both tags
4. **View Recipe:** Click recipe → `GET /api/recipes/:id` → full details with tags

---

**End of API Plan**

