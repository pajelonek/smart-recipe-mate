/**
 * Onboarding-specific types for user preferences
 * These types are used for the initial onboarding flow and preferences updates
 */

export interface PreferencesInput {
  diet_type: string;
  preferred_ingredients?: string;
  preferred_cuisines?: string;
  allergens?: string;
  notes?: string;
}

export type PreferencesUpdateInput = PreferencesInput;

export type PreferencesPartialUpdateInput = Partial<PreferencesInput>;
