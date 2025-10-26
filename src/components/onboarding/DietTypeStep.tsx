import type { UseFormReturn } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import type { PreferencesInput } from "./types";

interface DietTypeStepProps {
  readonly form: UseFormReturn<PreferencesInput>;
  readonly onNext: () => void;
  readonly isSubmitting: boolean;
}

const DIET_OPTIONS = [
  { value: "omnivore", label: "Wszystkożerne (bez ograniczeń)" },
  { value: "vegetarian", label: "Wegetariańskie" },
  { value: "vegan", label: "Wegańskie" },
  { value: "pescatarian", label: "Pescetariańskie (ryby dozwolone)" },
  { value: "keto", label: "Ketogeniczne (niskowęglowodanowe)" },
  { value: "paleo", label: "Paleo" },
  { value: "mediterranean", label: "Śródziemnomorskie" },
  { value: "low-carb", label: "Niskowęglowodanowe" },
  { value: "gluten-free", label: "Bez glutenu" },
  { value: "dairy-free", label: "Bez produktów mlecznych" },
  { value: "low-sugar", label: "Bezcukrowe (niskocukrowe)" },
  { value: "low-fat", label: "Niskotłuszczowe" },
];

export function DietTypeStep({ form, onNext, isSubmitting }: DietTypeStepProps) {
  const {
    control,
    watch,
    formState: { errors },
  } = form;
  const dietType = watch("diet_type");
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">Wybierz swój typ diety</h2>
        <p className="text-muted-foreground">
          To pomoże nam znaleźć przepisy dopasowane do Twoich preferencji żywieniowych
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="diet_type" className="text-sm font-medium">
          Typ diety *
        </Label>
        <Controller
          name="diet_type"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Wybierz typ diety" />
              </SelectTrigger>
              <SelectContent>
                {DIET_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.diet_type && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {errors.diet_type.message}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={onNext} disabled={isSubmitting || !dietType} className="min-w-[100px]">
          Dalej
        </Button>
      </div>
    </div>
  );
}
