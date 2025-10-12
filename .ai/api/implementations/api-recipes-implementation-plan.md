# API Endpoint Implementation Plan: Recipes

## Analysis

### Key Points from API Specification

- **5 endpoints** to implement:
  1. `GET /api/recipes` - List user's recipes with optional filtering
  2. `GET /api/recipes/:id` - Get single recipe by ID
  3. `POST /api/recipes` - Create new recipe
  4. `PUT /api/recipes/:id` - Full recipe update
  5. `PATCH /api/recipes/:id` - Partial recipe update
  6. `DELETE /api/recipes/:id` - Soft delete recipe

- All endpoints require authentication (to be added later, using test user for now)
- Recipes support tags (many-to-many relationship)
- Soft delete using `deleted_at` timestamp
- Maximum 10 tags per recipe
- Returns recipes with expanded tags in response

### Required and Optional Parameters

**GET /api/recipes:**

- No required parameters
- Optional query parameters (for future enhancement): `search`, `tags`

**GET /api/recipes/:id:**

- Required: `id` (UUID in path)

**POST /api/recipes:**

- Required: `title`, `ingredients`, `preparation`
- Optional: `summary`, `tag_names` (array, max 10)

**PUT /api/recipes/:id:**

- Required: `id` (UUID in path), `title`, `ingredients`, `preparation`
- Optional: `summary`, `tag_names` (array, max 10)

**PATCH /api/recipes/:id:**

- Required: `id` (UUID in path), at least one field
- Optional: `title`, `summary`, `ingredients`, `preparation`, `tag_names`

**DELETE /api/recipes/:id:**

- Required: `id` (UUID in path)

### Necessary DTOs and Models

**From types.ts (already defined):**

- `Recipe` - Full recipe with tags
- `RecipeEntity` - Database row
- `RecipeListResponse` - List response wrapper
- `RecipeCreateInput` - Create/update input
- `RecipeUpdateInput` - Full update input
- `RecipePartialUpdateInput` - Partial update input
- `Tag` - Tag entity
- `ApiError` - Error response

**Validation Schemas (to create):**

- `RecipeCreateInputSchema` - For POST validation
- `RecipeUpdateInputSchema` - For PUT validation
- `RecipePartialUpdateInputSchema` - For PATCH validation

### Service Layer Extraction

**New file: `src/lib/services/recipes.service.ts`**

Functions needed:

1. `getUserRecipes(userId, supabase)` - Get all recipes for user
2. `getRecipeById(recipeId, userId, supabase)` - Get single recipe with ownership check
3. `createRecipe(userId, recipeData, supabase)` - Create recipe with tags
4. `updateRecipe(recipeId, userId, recipeData, supabase)` - Full update with tags
5. `patchRecipe(recipeId, userId, recipeData, supabase)` - Partial update
6. `deleteRecipe(recipeId, userId, supabase)` - Soft delete

**Helper functions:**

1. `getOrCreateTags(userId, tagNames, supabase)` - Get existing or create new tags
2. `associateTags(recipeId, tagIds, supabase)` - Link recipe to tags
3. `fetchRecipeWithTags(recipeId, supabase)` - Get recipe with expanded tags

### Input Validation

**Validation rules from API spec:**

- `title`: required, 1-200 characters
- `ingredients`: required, 10-5000 characters
- `preparation`: required, 10-10000 characters
- `summary`: optional, 0-500 characters
- `tag_names`: optional array, max 10 items, each 1-50 characters
- UUID validation for recipe IDs

**Database constraints:**

- `owner_id`: must match authenticated user
- `deleted_at`: NULL for active recipes
- Tags: unique per user (owner_id, name)
- Recipe tags: max 10 per recipe

### Security Considerations

1. **Authentication**: All endpoints require authenticated user (to be implemented)
2. **Authorization**: Users can only access their own recipes (`owner_id = userId`)
3. **Input sanitization**: Zod validation prevents SQL injection
4. **UUID validation**: Prevent invalid ID formats
5. **Tag limit enforcement**: Prevent abuse with max 10 tags per recipe
6. **Soft delete**: Maintain data integrity, allow potential restore

### Error Scenarios

**400 Bad Request:**

- Invalid JSON body
- Missing required fields
- Field validation failures (length, format)
- Empty update in PATCH

**404 Not Found:**

- Recipe doesn't exist
- Recipe was soft deleted
- Recipe belongs to different user

**422 Unprocessable Entity:**

- Too many tags (> 10)

**500 Internal Server Error:**

- Database connection failure
- Unexpected errors during tag creation/association

---

## 1. Endpoint Overview

The Recipes API provides full CRUD operations for user recipes. Each recipe can have multiple tags for organization and filtering. The API uses soft deletes to maintain data integrity and supports both full and partial updates.

**Key Features:**

- Recipe management (create, read, update, delete)
- Tag support (many-to-many relationship)
- Soft delete with `deleted_at` timestamp
- Automatic tag creation and association
- Owner-based access control

---

## 2. Request Details

### 2.1 GET /api/recipes

**Purpose:** List all recipes for authenticated user

- **HTTP Method:** GET
- **URL Structure:** `/api/recipes`
- **Authentication:** Required (test user for now)
- **Query Parameters:** None (search/filter to be added later)
- **Request Body:** None

**Example Request:**

```
GET /api/recipes
```

---

### 2.2 GET /api/recipes/:id

**Purpose:** Retrieve a single recipe by ID

- **HTTP Method:** GET
- **URL Structure:** `/api/recipes/:id`
- **Authentication:** Required
- **Path Parameters:**
  - `id` (string, UUID) - Recipe ID
- **Request Body:** None

**Example Request:**

```
GET /api/recipes/123e4567-e89b-12d3-a456-426614174000
```

---

### 2.3 POST /api/recipes

**Purpose:** Create a new recipe

- **HTTP Method:** POST
- **URL Structure:** `/api/recipes`
- **Authentication:** Required
- **Request Body:**

```typescript
{
  title: string;           // required, 1-200 chars
  summary?: string;        // optional, 0-500 chars
  ingredients: string;     // required, 10-5000 chars
  preparation: string;     // required, 10-10000 chars
  tag_names?: string[];    // optional, max 10 items
}
```

**Example Request:**

```json
{
  "title": "Vegetable Stir Fry",
  "summary": "Healthy and colorful Asian stir fry",
  "ingredients": "Bell peppers, broccoli, carrots, soy sauce, ginger",
  "preparation": "1. Chop vegetables. 2. Heat wok. 3. Stir fry for 5 minutes.",
  "tag_names": ["Asian", "Healthy", "Quick"]
}
```

---

### 2.4 PUT /api/recipes/:id

**Purpose:** Replace entire recipe (full update)

- **HTTP Method:** PUT
- **URL Structure:** `/api/recipes/:id`
- **Authentication:** Required
- **Path Parameters:**
  - `id` (string, UUID) - Recipe ID
- **Request Body:** Same as POST (all required fields must be provided)

**Example Request:**

```json
{
  "title": "Updated Vegetable Stir Fry",
  "summary": "Improved version with extra vegetables",
  "ingredients": "Bell peppers, broccoli, carrots, mushrooms, soy sauce, ginger, garlic",
  "preparation": "1. Prep all vegetables. 2. Heat wok with oil. 3. Stir fry 7 minutes.",
  "tag_names": ["Asian", "Healthy", "Dinner"]
}
```

---

### 2.5 PATCH /api/recipes/:id

**Purpose:** Partially update recipe fields

- **HTTP Method:** PATCH
- **URL Structure:** `/api/recipes/:id`
- **Authentication:** Required
- **Path Parameters:**
  - `id` (string, UUID) - Recipe ID
- **Request Body:** At least one field required

```typescript
{
  title?: string;
  summary?: string;
  ingredients?: string;
  preparation?: string;
  tag_names?: string[];
}
```

**Example Request:**

```json
{
  "summary": "Updated summary only"
}
```

---

### 2.6 DELETE /api/recipes/:id

**Purpose:** Soft delete a recipe

- **HTTP Method:** DELETE
- **URL Structure:** `/api/recipes/:id`
- **Authentication:** Required
- **Path Parameters:**
  - `id` (string, UUID) - Recipe ID
- **Request Body:** None

**Example Request:**

```
DELETE /api/recipes/123e4567-e89b-12d3-a456-426614174000
```

---

## 3. Utilized Types

### 3.1 Existing Types (from `src/types.ts`)

```typescript
// Entity types
export type RecipeEntity = PublicSchema["recipes"]["Row"];
export type TagEntity = PublicSchema["tags"]["Row"];
export type RecipeTagEntity = PublicSchema["recipe_tags"]["Row"];

// Response types
export type Tag = Pick<TagEntity, "id" | "name" | "created_at">;

export type Recipe = Omit<RecipeEntity, "deleted_at"> & {
  tags: Tag[];
};

export interface RecipeListResponse {
  recipes: Recipe[];
}

// Input types
export interface RecipeCreateInput {
  title: string;
  summary?: string;
  ingredients: string;
  preparation: string;
  tag_names?: string[];
}

export type RecipeUpdateInput = RecipeCreateInput;
export type RecipePartialUpdateInput = Partial<RecipeCreateInput>;

// Error types
export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}
```

### 3.2 New Validation Schemas (to create in `src/lib/validation/recipes.schemas.ts`)

```typescript
import { z } from "zod";

// Tag name validation helper
const tagNameSchema = z
  .string()
  .min(1, "Tag name cannot be empty")
  .max(50, "Tag name must be at most 50 characters")
  .transform((s) => s.trim());

// UUID validation helper
export const uuidSchema = z.string().uuid("Invalid recipe ID format");

// Full recipe create/update schema
export const RecipeCreateInputSchema = z.object({
  title: z.string().min(1, "title is required").max(200, "title must be at most 200 characters"),
  summary: z.string().max(500, "summary must be at most 500 characters").optional(),
  ingredients: z
    .string()
    .min(10, "ingredients must be at least 10 characters")
    .max(5000, "ingredients must be at most 5000 characters"),
  preparation: z
    .string()
    .min(10, "preparation must be at least 10 characters")
    .max(10000, "preparation must be at most 10000 characters"),
  tag_names: z.array(tagNameSchema).max(10, "Maximum 10 tags allowed per recipe").optional().default([]),
});

// Full update schema (same as create)
export const RecipeUpdateInputSchema = RecipeCreateInputSchema;

// Partial update schema
export const RecipePartialUpdateInputSchema = z
  .object({
    title: z.string().min(1, "title cannot be empty").max(200, "title must be at most 200 characters").optional(),
    summary: z.string().max(500, "summary must be at most 500 characters").optional(),
    ingredients: z
      .string()
      .min(10, "ingredients must be at least 10 characters")
      .max(5000, "ingredients must be at most 5000 characters")
      .optional(),
    preparation: z
      .string()
      .min(10, "preparation must be at least 10 characters")
      .max(10000, "preparation must be at most 10000 characters")
      .optional(),
    tag_names: z.array(tagNameSchema).max(10, "Maximum 10 tags allowed per recipe").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });
```

---

## 4. Response Details

### 4.1 GET /api/recipes

**Success Response (200 OK):**

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

### 4.2 GET /api/recipes/:id

**Success Response (200 OK):**

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

**Error Response (404 Not Found):**

```json
{
  "error": "Recipe not found",
  "message": "Recipe does not exist or has been deleted"
}
```

**Error Response (403 Forbidden - for future auth):**

```json
{
  "error": "Access denied",
  "message": "You do not have permission to access this recipe"
}
```

---

### 4.3 POST /api/recipes

**Success Response (201 Created):**

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

**Error Response (400 Bad Request):**

```json
{
  "error": "Validation failed",
  "message": "title, ingredients, and preparation are required"
}
```

**Error Response (422 Unprocessable Entity):**

```json
{
  "error": "Too many tags",
  "message": "Maximum 10 tags allowed per recipe"
}
```

---

### 4.4 PUT /api/recipes/:id

**Success Response (200 OK):**
Same structure as POST response.

**Error Responses:**

- 400 Bad Request (validation)
- 404 Not Found (recipe doesn't exist)
- 403 Forbidden (not owner - for future)

---

### 4.5 PATCH /api/recipes/:id

**Success Response (200 OK):**
Same structure as POST response.

**Error Responses:**

- 400 Bad Request (validation or empty update)
- 404 Not Found (recipe doesn't exist)
- 403 Forbidden (not owner - for future)

---

### 4.6 DELETE /api/recipes/:id

**Success Response (204 No Content):**
Empty response body.

**Error Responses:**

- 404 Not Found (recipe doesn't exist or already deleted)
- 403 Forbidden (not owner - for future)

---

## 5. Data Flow

### 5.1 GET /api/recipes

```
1. Request arrives → Extract user ID (test user for now)
2. Call recipesService.getUserRecipes(userId, supabase)
   a. Query recipes table: WHERE owner_id = userId AND deleted_at IS NULL
   b. For each recipe, query tags via recipe_tags join
   c. Map results to Recipe type with expanded tags
3. Return RecipeListResponse with array of recipes
```

### 5.2 GET /api/recipes/:id

```
1. Request arrives → Extract recipe ID from path, validate UUID
2. Call recipesService.getRecipeById(recipeId, userId, supabase)
   a. Query recipe with owner_id check and deleted_at IS NULL
   b. If not found, return null
   c. Query associated tags via recipe_tags join
   d. Return Recipe with expanded tags
3. Handle response:
   - If found: Return 200 with recipe
   - If not found: Return 404 error
```

### 5.3 POST /api/recipes

```
1. Request arrives → Parse and validate JSON body
2. Validate with RecipeCreateInputSchema (Zod)
3. Call recipesService.createRecipe(userId, validatedData, supabase)
   a. Insert recipe into recipes table with owner_id
   b. If tag_names provided:
      - Call getOrCreateTags(userId, tag_names, supabase)
        * Query existing tags by name and owner_id
        * Create missing tags with INSERT
        * Return all tag IDs
      - Call associateTags(recipeId, tagIds, supabase)
        * Insert into recipe_tags table
   c. Fetch complete recipe with tags
4. Return 201 Created with recipe data
```

### 5.4 PUT /api/recipes/:id

```
1. Request arrives → Extract recipe ID, parse body
2. Validate UUID and RecipeUpdateInputSchema
3. Call recipesService.updateRecipe(recipeId, userId, validatedData, supabase)
   a. Check recipe exists and owner_id matches (ownership)
   b. Update recipe fields, set updated_at = now()
   c. Delete existing recipe_tags associations
   d. If tag_names provided:
      - Call getOrCreateTags(userId, tag_names, supabase)
      - Call associateTags(recipeId, tagIds, supabase)
   e. Fetch updated recipe with tags
4. Return 200 OK with updated recipe
```

### 5.5 PATCH /api/recipes/:id

```
1. Request arrives → Extract recipe ID, parse body
2. Validate UUID and RecipePartialUpdateInputSchema
3. Call recipesService.patchRecipe(recipeId, userId, validatedData, supabase)
   a. Check recipe exists and owner_id matches
   b. Build partial update object with only provided fields
   c. Update recipe with provided fields, set updated_at = now()
   d. If tag_names provided:
      - Delete existing recipe_tags associations
      - Call getOrCreateTags(userId, tag_names, supabase)
      - Call associateTags(recipeId, tagIds, supabase)
   e. Fetch updated recipe with tags
4. Return 200 OK with updated recipe
```

### 5.6 DELETE /api/recipes/:id

```
1. Request arrives → Extract recipe ID, validate UUID
2. Call recipesService.deleteRecipe(recipeId, userId, supabase)
   a. Check recipe exists and owner_id matches
   b. UPDATE recipe SET deleted_at = now() WHERE id = recipeId
   c. Recipe_tags remain but recipe won't appear in queries
3. Return 204 No Content
```

---

## 6. Security Considerations

### 6.1 Authentication

- **Current:** Using test user ID (`00000000-0000-0000-0000-000000000000`)
- **Future:** Extract user from JWT token via Supabase Auth
- All endpoints require authenticated user

### 6.2 Authorization (Owner-based Access Control)

- All recipe operations check `owner_id = userId`
- Users can only:
  - View their own recipes
  - Create recipes under their ownership
  - Update their own recipes
  - Delete their own recipes
- Prevent cross-user data access

### 6.3 Input Validation

- **Zod schemas** validate all inputs before processing
- **UUID validation** prevents invalid ID formats
- **String length limits** prevent database overflow
- **Tag limit** (max 10) prevents abuse
- **Trimming** tag names prevents whitespace issues
- **Required field checks** ensure data integrity

### 6.4 SQL Injection Protection

- Using Supabase client with parameterized queries
- No raw SQL concatenation
- Zod validation provides additional safety

### 6.5 Soft Delete

- Using `deleted_at` timestamp instead of hard delete
- Maintains referential integrity
- Allows potential restore feature
- Prevents cascade issues

### 6.6 Tag Management

- Tags are user-scoped (owner_id)
- Unique constraint per user prevents duplicates
- Case-sensitive by default (can be made case-insensitive later)

---

## 7. Error Handling

### 7.1 Validation Errors (400 Bad Request)

**Scenarios:**

- Invalid JSON body
- Missing required fields (title, ingredients, preparation)
- Field length violations
- Empty string for required fields
- Invalid UUID format
- Empty PATCH request (no fields provided)

**Response Format:**

```json
{
  "error": "Validation failed",
  "message": "Specific validation error message",
  "details": {
    "fields": [
      /* Zod error details */
    ]
  }
}
```

**Handling in API Route:**

```typescript
try {
  validatedData = RecipeCreateInputSchema.parse(requestBody);
} catch (error) {
  if (error instanceof z.ZodError) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        message: error.errors[0].message,
        details: { fields: error.errors },
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  throw error;
}
```

---

### 7.2 Not Found Errors (404)

**Scenarios:**

- Recipe ID doesn't exist
- Recipe was soft deleted (`deleted_at IS NOT NULL`)
- Recipe belongs to different user (treated as not found for security)

**Response Format:**

```json
{
  "error": "Recipe not found",
  "message": "Recipe does not exist or has been deleted"
}
```

**Handling in Service:**

```typescript
export async function getRecipeById(recipeId: string, userId: string, supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("recipes")
    .select(
      `
      *,
      recipe_tags!inner(
        tags(id, name, created_at)
      )
    `
    )
    .eq("id", recipeId)
    .eq("owner_id", userId)
    .is("deleted_at", null)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return null;
    }
    throw error;
  }

  return mapToRecipe(data);
}
```

---

### 7.3 Forbidden Errors (403) - For Future Implementation

**Scenarios:**

- User tries to access another user's recipe
- User tries to update/delete recipe they don't own

**Response Format:**

```json
{
  "error": "Access denied",
  "message": "You do not have permission to access this recipe"
}
```

---

### 7.4 Unprocessable Entity (422)

**Scenarios:**

- Tag limit exceeded (> 10 tags)

**Response Format:**

```json
{
  "error": "Too many tags",
  "message": "Maximum 10 tags allowed per recipe"
}
```

**Note:** This is handled by Zod validation in the schema, returning 400 instead of 422. Consider changing to 422 for business rule violations vs validation errors.

---

### 7.5 Internal Server Errors (500)

**Scenarios:**

- Database connection failures
- Unexpected errors during tag creation
- Supabase query errors
- Transaction failures

**Response Format:**

```json
{
  "error": "Internal server error",
  "message": "Failed to [operation]. Please try again later."
}
```

**Handling in API Route:**

```typescript
try {
  const recipe = await createRecipe(testUserId, validatedData, locals.supabase);
  return new Response(JSON.stringify(recipe), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
} catch (error) {
  console.error("Error creating recipe:", error);
  return new Response(
    JSON.stringify({
      error: "Internal server error",
      message: "Failed to create recipe. Please try again later.",
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

---

## 8. Performance Considerations

### 8.1 Database Queries

**Potential Bottlenecks:**

- Fetching recipes with tags requires joins (recipe_tags, tags)
- Multiple queries for tag creation and association
- N+1 query problem when fetching recipes with tags

**Optimization Strategies:**

1. **Use Supabase nested selects** to fetch recipes with tags in single query:

   ```typescript
   .select(`
     *,
     recipe_tags!inner(
       tags(id, name, created_at)
     )
   `)
   ```

2. **Batch tag operations** when possible:
   - Query all existing tags at once
   - Insert new tags in single query using `insertMany`

3. **Index recommendations** (add to migration later):
   - `CREATE INDEX idx_recipes_owner_active ON recipes(owner_id) WHERE deleted_at IS NULL;`
   - `CREATE INDEX idx_recipe_tags_recipe ON recipe_tags(recipe_id);`
   - `CREATE INDEX idx_tags_owner_name ON tags(owner_id, name);`

### 8.2 Tag Management

**Challenge:** Creating/fetching tags for each recipe operation

**Strategy:**

```typescript
async function getOrCreateTags(userId: string, tagNames: string[], supabase: SupabaseClient) {
  if (tagNames.length === 0) return [];

  // 1. Fetch existing tags in one query
  const { data: existingTags } = await supabase
    .from("tags")
    .select("id, name")
    .eq("owner_id", userId)
    .in("name", tagNames);

  // 2. Determine which tags need to be created
  const existingNames = new Set(existingTags?.map((t) => t.name) || []);
  const newTagNames = tagNames.filter((name) => !existingNames.has(name));

  // 3. Create missing tags in single query
  if (newTagNames.length > 0) {
    const { data: newTags } = await supabase
      .from("tags")
      .insert(newTagNames.map((name) => ({ owner_id: userId, name })))
      .select("id, name");

    return [...(existingTags || []), ...(newTags || [])];
  }

  return existingTags || [];
}
```

### 8.3 Response Size

**Consideration:** Recipes with full text fields can be large

**Mitigation:**

- For list endpoint, consider limiting number of results (pagination in future)
- Text fields are necessary for recipe details, no trimming
- Use proper HTTP caching headers in future

### 8.4 Soft Delete Queries

**Impact:** All queries must include `WHERE deleted_at IS NULL`

**Optimization:**

- Create partial index on `deleted_at IS NULL` for better query performance
- Consider database views if query becomes complex

---

## 9. Implementation Steps

### Step 1: Create Validation Schemas

**File:** `src/lib/validation/recipes.schemas.ts`

1. Create `RecipeCreateInputSchema` with all field validations
2. Create `RecipeUpdateInputSchema` (alias to create schema)
3. Create `RecipePartialUpdateInputSchema` with optional fields and refine check
4. Export `uuidSchema` for ID validation

**Validation Rules:**

- title: 1-200 chars
- ingredients: 10-5000 chars
- preparation: 10-10000 chars
- summary: 0-500 chars (optional)
- tag_names: array, max 10, each 1-50 chars (trimmed)

**Reference:** Similar to `src/lib/validation/preferences.schemas.ts`

---

### Step 2: Create Recipes Service

**File:** `src/lib/services/recipes.service.ts`

**2.1 Helper Functions:**

```typescript
// Map database row to Recipe type with tags
function mapToRecipe(row: any): Recipe {
  const tags =
    row.recipe_tags?.map((rt: any) => ({
      id: rt.tags.id,
      name: rt.tags.name,
      created_at: rt.tags.created_at,
    })) || [];

  return {
    id: row.id,
    owner_id: row.owner_id,
    title: row.title,
    summary: row.summary,
    ingredients: row.ingredients,
    preparation: row.preparation,
    created_at: row.created_at,
    updated_at: row.updated_at,
    tags,
  };
}

// Get or create tags (with upsert logic)
async function getOrCreateTags(userId: string, tagNames: string[], supabase: SupabaseClient): Promise<Tag[]> {
  // Implementation as described in Performance section
}

// Associate tags with recipe
async function associateTags(recipeId: string, tags: Tag[], supabase: SupabaseClient): Promise<void> {
  if (tags.length === 0) return;

  const associations = tags.map((tag) => ({
    recipe_id: recipeId,
    tag_id: tag.id,
  }));

  const { error } = await supabase.from("recipe_tags").insert(associations);

  if (error) throw error;
}
```

**2.2 Main Service Functions:**

```typescript
// 1. Get all recipes for user
export async function getUserRecipes(userId: string, supabase: SupabaseClient): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from("recipes")
    .select(
      `
      *,
      recipe_tags(
        tags(id, name, created_at)
      )
    `
    )
    .eq("owner_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map(mapToRecipe);
}

// 2. Get single recipe by ID
export async function getRecipeById(
  recipeId: string,
  userId: string,
  supabase: SupabaseClient
): Promise<Recipe | null> {
  const { data, error } = await supabase
    .from("recipes")
    .select(
      `
      *,
      recipe_tags(
        tags(id, name, created_at)
      )
    `
    )
    .eq("id", recipeId)
    .eq("owner_id", userId)
    .is("deleted_at", null)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return mapToRecipe(data);
}

// 3. Create new recipe
export async function createRecipe(
  userId: string,
  recipeData: RecipeCreateInput,
  supabase: SupabaseClient
): Promise<Recipe> {
  // Insert recipe
  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .insert({
      owner_id: userId,
      title: recipeData.title,
      summary: recipeData.summary || null,
      ingredients: recipeData.ingredients,
      preparation: recipeData.preparation,
    })
    .select()
    .single();

  if (recipeError) throw recipeError;

  // Handle tags if provided
  if (recipeData.tag_names && recipeData.tag_names.length > 0) {
    const tags = await getOrCreateTags(userId, recipeData.tag_names, supabase);
    await associateTags(recipe.id, tags, supabase);
  }

  // Fetch complete recipe with tags
  const completeRecipe = await getRecipeById(recipe.id, userId, supabase);
  if (!completeRecipe) throw new Error("Failed to fetch created recipe");

  return completeRecipe;
}

// 4. Update recipe (full replacement)
export async function updateRecipe(
  recipeId: string,
  userId: string,
  recipeData: RecipeUpdateInput,
  supabase: SupabaseClient
): Promise<Recipe | null> {
  // Check ownership
  const existing = await getRecipeById(recipeId, userId, supabase);
  if (!existing) return null;

  // Update recipe
  const { error: updateError } = await supabase
    .from("recipes")
    .update({
      title: recipeData.title,
      summary: recipeData.summary || null,
      ingredients: recipeData.ingredients,
      preparation: recipeData.preparation,
      updated_at: new Date().toISOString(),
    })
    .eq("id", recipeId)
    .eq("owner_id", userId);

  if (updateError) throw updateError;

  // Handle tags: delete old, create new
  await supabase.from("recipe_tags").delete().eq("recipe_id", recipeId);

  if (recipeData.tag_names && recipeData.tag_names.length > 0) {
    const tags = await getOrCreateTags(userId, recipeData.tag_names, supabase);
    await associateTags(recipeId, tags, supabase);
  }

  return await getRecipeById(recipeId, userId, supabase);
}

// 5. Patch recipe (partial update)
export async function patchRecipe(
  recipeId: string,
  userId: string,
  recipeData: RecipePartialUpdateInput,
  supabase: SupabaseClient
): Promise<Recipe | null> {
  // Check ownership
  const existing = await getRecipeById(recipeId, userId, supabase);
  if (!existing) return null;

  // Build update object
  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (recipeData.title !== undefined) updateData.title = recipeData.title;
  if (recipeData.summary !== undefined) updateData.summary = recipeData.summary || null;
  if (recipeData.ingredients !== undefined) updateData.ingredients = recipeData.ingredients;
  if (recipeData.preparation !== undefined) updateData.preparation = recipeData.preparation;

  // Update recipe
  const { error: updateError } = await supabase
    .from("recipes")
    .update(updateData)
    .eq("id", recipeId)
    .eq("owner_id", userId);

  if (updateError) throw updateError;

  // Handle tags if provided
  if (recipeData.tag_names !== undefined) {
    await supabase.from("recipe_tags").delete().eq("recipe_id", recipeId);

    if (recipeData.tag_names.length > 0) {
      const tags = await getOrCreateTags(userId, recipeData.tag_names, supabase);
      await associateTags(recipeId, tags, supabase);
    }
  }

  return await getRecipeById(recipeId, userId, supabase);
}

// 6. Soft delete recipe
export async function deleteRecipe(recipeId: string, userId: string, supabase: SupabaseClient): Promise<boolean> {
  // Check ownership
  const existing = await getRecipeById(recipeId, userId, supabase);
  if (!existing) return false;

  // Soft delete
  const { error } = await supabase
    .from("recipes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", recipeId)
    .eq("owner_id", userId);

  if (error) throw error;

  return true;
}
```

---

### Step 3: Create API Route for List and Create

**File:** `src/pages/api/recipes/index.ts`

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import { RecipeCreateInputSchema } from "../../../lib/validation/recipes.schemas";
import { getUserRecipes, createRecipe } from "../../../lib/services/recipes.service";
import type { ApiError, RecipeListResponse } from "../../../types";

export const prerender = false;

// GET /api/recipes - List all recipes
export const GET: APIRoute = async ({ locals }) => {
  // TODO: Add authentication when ready
  const testUserId = "00000000-0000-0000-0000-000000000000";

  try {
    const recipes = await getUserRecipes(testUserId, locals.supabase);

    const response: RecipeListResponse = { recipes };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching recipes:", error);
    const errorResponse: ApiError = {
      error: "Internal server error",
      message: "Failed to fetch recipes. Please try again later.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// POST /api/recipes - Create new recipe
export const POST: APIRoute = async ({ request, locals }) => {
  // TODO: Add authentication when ready
  const testUserId = "00000000-0000-0000-0000-000000000000";

  // Parse JSON
  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
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
    validatedData = RecipeCreateInputSchema.parse(requestBody);
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

  // Create recipe
  try {
    const recipe = await createRecipe(testUserId, validatedData, locals.supabase);

    return new Response(JSON.stringify(recipe), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating recipe:", error);
    const errorResponse: ApiError = {
      error: "Internal server error",
      message: "Failed to create recipe. Please try again later.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

---

### Step 4: Create API Route for Single Recipe Operations

**File:** `src/pages/api/recipes/[id].ts`

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import {
  uuidSchema,
  RecipeUpdateInputSchema,
  RecipePartialUpdateInputSchema,
} from "../../../lib/validation/recipes.schemas";
import { getRecipeById, updateRecipe, patchRecipe, deleteRecipe } from "../../../lib/services/recipes.service";
import type { ApiError } from "../../../types";

export const prerender = false;

// GET /api/recipes/:id - Get single recipe
export const GET: APIRoute = async ({ params, locals }) => {
  // TODO: Add authentication when ready
  const testUserId = "00000000-0000-0000-0000-000000000000";

  // Validate recipe ID
  let recipeId: string;
  try {
    recipeId = uuidSchema.parse(params.id);
  } catch {
    const errorResponse: ApiError = {
      error: "Invalid ID",
      message: "Recipe ID must be a valid UUID",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const recipe = await getRecipeById(recipeId, testUserId, locals.supabase);

    if (!recipe) {
      const errorResponse: ApiError = {
        error: "Recipe not found",
        message: "Recipe does not exist or has been deleted",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(recipe), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching recipe:", error);
    const errorResponse: ApiError = {
      error: "Internal server error",
      message: "Failed to fetch recipe. Please try again later.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// PUT /api/recipes/:id - Full update
export const PUT: APIRoute = async ({ params, request, locals }) => {
  // TODO: Add authentication when ready
  const testUserId = "00000000-0000-0000-0000-000000000000";

  // Validate recipe ID
  let recipeId: string;
  try {
    recipeId = uuidSchema.parse(params.id);
  } catch {
    const errorResponse: ApiError = {
      error: "Invalid ID",
      message: "Recipe ID must be a valid UUID",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Parse JSON
  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
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
    validatedData = RecipeUpdateInputSchema.parse(requestBody);
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

  // Update recipe
  try {
    const recipe = await updateRecipe(recipeId, testUserId, validatedData, locals.supabase);

    if (!recipe) {
      const errorResponse: ApiError = {
        error: "Recipe not found",
        message: "Recipe does not exist or has been deleted",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(recipe), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating recipe:", error);
    const errorResponse: ApiError = {
      error: "Internal server error",
      message: "Failed to update recipe. Please try again later.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// PATCH /api/recipes/:id - Partial update
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  // TODO: Add authentication when ready
  const testUserId = "00000000-0000-0000-0000-000000000000";

  // Validate recipe ID
  let recipeId: string;
  try {
    recipeId = uuidSchema.parse(params.id);
  } catch {
    const errorResponse: ApiError = {
      error: "Invalid ID",
      message: "Recipe ID must be a valid UUID",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Parse JSON
  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
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
    validatedData = RecipePartialUpdateInputSchema.parse(requestBody);
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

  // Patch recipe
  try {
    const recipe = await patchRecipe(recipeId, testUserId, validatedData, locals.supabase);

    if (!recipe) {
      const errorResponse: ApiError = {
        error: "Recipe not found",
        message: "Recipe does not exist or has been deleted",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(recipe), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error patching recipe:", error);
    const errorResponse: ApiError = {
      error: "Internal server error",
      message: "Failed to update recipe. Please try again later.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// DELETE /api/recipes/:id - Soft delete
export const DELETE: APIRoute = async ({ params, locals }) => {
  // TODO: Add authentication when ready
  const testUserId = "00000000-0000-0000-0000-000000000000";

  // Validate recipe ID
  let recipeId: string;
  try {
    recipeId = uuidSchema.parse(params.id);
  } catch {
    const errorResponse: ApiError = {
      error: "Invalid ID",
      message: "Recipe ID must be a valid UUID",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Delete recipe
  try {
    const deleted = await deleteRecipe(recipeId, testUserId, locals.supabase);

    if (!deleted) {
      const errorResponse: ApiError = {
        error: "Recipe not found",
        message: "Recipe does not exist or has already been deleted",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    console.error("Error deleting recipe:", error);
    const errorResponse: ApiError = {
      error: "Internal server error",
      message: "Failed to delete recipe. Please try again later.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

---

### Step 5: Testing

**5.1 Manual Testing with curl/Postman**

Test each endpoint:

```bash
# 1. Create recipe
curl -X POST http://localhost:4321/api/recipes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Recipe",
    "ingredients": "ingredient 1, ingredient 2, ingredient 3",
    "preparation": "Step 1. Do this. Step 2. Do that.",
    "tag_names": ["Test", "Quick"]
  }'

# 2. List recipes
curl http://localhost:4321/api/recipes

# 3. Get single recipe
curl http://localhost:4321/api/recipes/{recipe-id}

# 4. Update recipe (PUT)
curl -X PUT http://localhost:4321/api/recipes/{recipe-id} \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Recipe",
    "ingredients": "new ingredients list here",
    "preparation": "Updated steps here",
    "tag_names": ["Updated"]
  }'

# 5. Patch recipe
curl -X PATCH http://localhost:4321/api/recipes/{recipe-id} \
  -H "Content-Type: application/json" \
  -d '{"summary": "New summary only"}'

# 6. Delete recipe
curl -X DELETE http://localhost:4321/api/recipes/{recipe-id}
```

**5.2 Test Cases**

For each endpoint, test:

- ✅ Happy path (valid input)
- ❌ Invalid JSON
- ❌ Missing required fields
- ❌ Field length violations
- ❌ Invalid UUID format
- ❌ Non-existent recipe ID
- ❌ Empty tag names
- ❌ Too many tags (> 10)
- ✅ Recipe with no tags
- ✅ Recipe with existing tags (reuse)
- ✅ Verify soft delete (recipe not in list after delete)

**5.3 Database Verification**

After operations, verify in database:

```sql
-- Check recipes table
SELECT * FROM recipes WHERE owner_id = '00000000-0000-0000-0000-000000000000';

-- Check tags were created
SELECT * FROM tags WHERE owner_id = '00000000-0000-0000-0000-000000000000';

-- Check recipe-tag associations
SELECT * FROM recipe_tags WHERE recipe_id = '{recipe-id}';

-- Verify soft delete
SELECT deleted_at FROM recipes WHERE id = '{recipe-id}';
```

---

### Step 6: Error Handling Improvements (Optional)

**6.1 Create Error Response Helper**

**File:** `src/lib/utils/api-response.ts`

```typescript
import type { ApiError } from "../../types";

export function jsonResponse(data: unknown, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function errorResponse(error: string, message: string, status: number, details?: Record<string, unknown>) {
  const errorData: ApiError = { error, message, details };
  return jsonResponse(errorData, status);
}

export function validationError(message: string, details?: Record<string, unknown>) {
  return errorResponse("Validation failed", message, 400, details);
}

export function notFoundError(message: string = "Resource not found") {
  return errorResponse("Not found", message, 404);
}

export function serverError(message: string = "Internal server error") {
  return errorResponse("Internal server error", message, 500);
}
```

**Usage in routes:**

```typescript
return jsonResponse(recipe, 201); // Success
return notFoundError("Recipe does not exist"); // 404
return serverError("Failed to create recipe"); // 500
```

---

### Step 7: Documentation Updates

**7.1 Update Project Structure in `.cursor/rules`**

Add new files to project structure:

- `./src/lib/validation/recipes.schemas.ts` - Recipe validation schemas
- `./src/lib/services/recipes.service.ts` - Recipe business logic
- `./src/pages/api/recipes/index.ts` - List and create endpoints
- `./src/pages/api/recipes/[id].ts` - Single recipe operations

**7.2 Create API Usage Examples** (Optional)

Document common API usage patterns for frontend developers.

---

## 10. Future Enhancements

### 10.1 Authentication

- Replace `testUserId` with real user from JWT token
- Extract user from `context.locals.supabase.auth.getUser()`
- Return 401 for unauthenticated requests

### 10.2 Search and Filtering

- Add query parameters to `GET /api/recipes`:
  - `search` - Full-text search in title, ingredients, preparation
  - `tags` - Filter by tag names (AND logic)
  - `limit` and `offset` for pagination

### 10.3 Pagination

- Add pagination support to prevent large response sizes
- Return metadata: `total_count`, `page`, `per_page`

### 10.4 Rate Limiting

- Implement rate limiting to prevent abuse
- Especially important for create/update operations

### 10.5 Tag Autocomplete Endpoint

- Separate endpoint: `GET /api/tags?search=...`
- Return user's tags with recipe counts for autocomplete

### 10.6 Recipe Restore

- Add endpoint to restore soft-deleted recipes
- `POST /api/recipes/:id/restore`

### 10.7 Batch Operations

- Delete multiple recipes at once
- Update tags for multiple recipes

### 10.8 Database Indexes

- Add performance indexes as mentioned in Performance section
- Monitor slow queries and optimize

---

## Summary

This implementation plan provides a complete blueprint for implementing the Recipes API endpoints. The plan follows the existing patterns from the Preferences endpoint, uses the same tech stack (Astro, TypeScript, Supabase, Zod), and adheres to clean code principles with proper separation of concerns.

**Key Implementation Files:**

1. `src/lib/validation/recipes.schemas.ts` - Input validation
2. `src/lib/services/recipes.service.ts` - Business logic
3. `src/pages/api/recipes/index.ts` - List and create endpoints
4. `src/pages/api/recipes/[id].ts` - Single recipe operations

**Critical Features:**

- ✅ Full CRUD operations
- ✅ Tag management with many-to-many relationship
- ✅ Soft delete support
- ✅ Owner-based access control
- ✅ Comprehensive validation
- ✅ Error handling
- ✅ Type safety

Follow the implementation steps sequentially, test thoroughly at each stage, and the Recipes API will be production-ready.
