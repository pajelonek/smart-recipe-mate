-- Migration to remove tags functionality from Smart Recipe Mate
-- This removes the tags and recipe_tags tables

-- Drop foreign key constraints first
ALTER TABLE IF EXISTS public.recipe_tags 
DROP CONSTRAINT IF EXISTS recipe_tags_recipe_id_fkey;

ALTER TABLE IF EXISTS public.recipe_tags 
DROP CONSTRAINT IF EXISTS recipe_tags_tag_id_fkey;

-- Drop the tables (CASCADE will handle any remaining dependencies)
DROP TABLE IF EXISTS public.recipe_tags;
DROP TABLE IF EXISTS public.tags;

