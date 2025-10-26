import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import type { PreferencesPartialUpdateInput } from "@/types";
import { PreferencesPartialInputSchema } from "@/lib/validation/preferences.schemas";

interface EditPreferencesFormProps {
  readonly initialValues: PreferencesPartialUpdateInput;
  readonly onSubmit: (data: PreferencesPartialUpdateInput) => Promise<void>;
  readonly onCancel: () => void;
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

export function EditPreferencesForm({ initialValues, onSubmit, onCancel }: Readonly<EditPreferencesFormProps>) {
  const form = useForm<PreferencesPartialUpdateInput>({
    resolver: zodResolver(PreferencesPartialInputSchema),
    defaultValues: initialValues,
    mode: "onChange",
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = form;

  const dietType = watch("diet_type");

  const handleFormSubmit = async (data: PreferencesPartialUpdateInput) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="diet_type" className="text-sm font-medium">
          Typ diety
        </Label>
        <Select
          value={dietType || ""}
          onValueChange={(value) => setValue("diet_type", value, { shouldValidate: true })}
          disabled={isSubmitting}
        >
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
        {errors.diet_type && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {errors.diet_type.message}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="preferred_ingredients" className="text-sm font-medium">
          Ulubione składniki
        </Label>
        <Textarea
          id="preferred_ingredients"
          placeholder="np. brokuły, kurczak, pomidory..."
          rows={3}
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
        <Textarea
          id="preferred_cuisines"
          placeholder="np. włoska, azjatycka, meksykańska..."
          rows={3}
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
        <Textarea
          id="allergens"
          placeholder="np. orzechy, laktoza, gluten..."
          rows={3}
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

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Anuluj
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Zapisywanie..." : "Zapisz"}
        </Button>
      </div>
    </form>
  );
}
