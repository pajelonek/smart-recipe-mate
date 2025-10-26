import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";
import type { PreferencesInput } from "./types";

interface PreferencesStepProps {
  readonly form: UseFormReturn<PreferencesInput>;
  readonly onPrev: () => void;
  readonly onSubmit: (data: PreferencesInput) => void;
  readonly isSubmitting: boolean;
}

export function PreferencesStep({ form, onPrev, onSubmit, isSubmitting }: Readonly<PreferencesStepProps>) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">Dodatkowe preferencje</h2>
        <p className="text-muted-foreground">Podziel się swoimi ulubionymi składnikami, kuchnią i alergenami</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="preferred_ingredients" className="text-sm font-medium">
          Ulubione składniki
        </Label>
        <Input
          id="preferred_ingredients"
          placeholder="np. brokuły, kurczak, pomidory..."
          {...register("preferred_ingredients")}
          disabled={isSubmitting}
        />
        {errors.preferred_ingredients && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {errors.preferred_ingredients.message}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="preferred_cuisines" className="text-sm font-medium">
          Preferowane kuchnie
        </Label>
        <Input
          id="preferred_cuisines"
          placeholder="np. włoska, azjatycka, meksykańska..."
          {...register("preferred_cuisines")}
          disabled={isSubmitting}
        />
        {errors.preferred_cuisines && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {errors.preferred_cuisines.message}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="allergens" className="text-sm font-medium">
          Alergeny / nietolerancje
        </Label>
        <Input
          id="allergens"
          placeholder="np. orzechy, laktoza, gluten..."
          {...register("allergens")}
          disabled={isSubmitting}
        />
        {errors.allergens && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {errors.allergens.message}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-sm font-medium">
          Dodatkowe uwagi
        </Label>
        <Textarea
          id="notes"
          placeholder="Opisz swoje preferencje żywieniowe, ograniczenia kaloryczne lub inne ważne informacje..."
          rows={4}
          {...register("notes")}
          disabled={isSubmitting}
        />
        {errors.notes && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {errors.notes.message}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onPrev} disabled={isSubmitting} className="min-w-[100px]">
          Wstecz
        </Button>
        <Button
          type="button"
          onClick={() => handleSubmit(onSubmit)()}
          disabled={isSubmitting}
          className="min-w-[100px]"
        >
          {isSubmitting ? "Zapisywanie..." : "Zakończ"}
        </Button>
      </div>
    </div>
  );
}
