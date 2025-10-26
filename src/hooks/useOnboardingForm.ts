import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { OnboardingCompleteInputSchema } from "../lib/validation/onboarding.schemas";
import type { PreferencesInput } from "../components/onboarding/types";

type OnboardingStep = 1 | 2;

interface OnboardingFormState {
  step: OnboardingStep;
  isSubmitting: boolean;
}

export function useOnboardingForm(accessToken: string) {
  const [formState, setFormState] = useState<OnboardingFormState>({
    step: 1,
    isSubmitting: false,
  });

  const form = useForm<PreferencesInput>({
    resolver: zodResolver(OnboardingCompleteInputSchema.shape.preferences),
    defaultValues: {
      diet_type: "",
      preferred_ingredients: "",
      preferred_cuisines: "",
      allergens: "",
      notes: "",
    },
  });

  const nextStep = async () => {
    const currentStep = formState.step;

    if (currentStep === 1) {
      // Validate diet_type before proceeding
      const isValid = await form.trigger("diet_type");
      if (isValid) {
        setFormState((prev) => ({ ...prev, step: 2 }));
      }
    }
  };

  const prevStep = () => {
    if (formState.step === 2) {
      setFormState((prev) => ({ ...prev, step: 1 }));
    }
  };

  const submitOnboarding = async (data: PreferencesInput) => {
    setFormState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      const payload = { preferences: data };
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle case where user is already onboarded
        if (response.status === 409) {
          toast.success("Preferencje zostały już zapisane!");
          globalThis.location.href = "/";
          return;
        }

        throw new Error(errorData.message || "Failed to complete onboarding");
      }

      toast.success("Preferencje zostały zapisane!");
      // Redirect will be handled by the component
      globalThis.location.href = "/";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Wystąpił błąd podczas zapisywania preferencji";
      toast.error(message);
      throw error;
    } finally {
      setFormState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  return {
    form,
    formState,
    nextStep,
    prevStep,
    submitOnboarding,
  };
}
