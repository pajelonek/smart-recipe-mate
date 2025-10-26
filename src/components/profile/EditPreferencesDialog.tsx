import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EditPreferencesForm } from "./EditPreferencesForm";
import type { UserPreferences, PreferencesPartialUpdateInput, ApiError } from "@/types";
import { toast } from "sonner";

interface EditPreferencesDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly preferences: UserPreferences | null;
  readonly onSuccess: () => void;
}

export function EditPreferencesDialog({
  open,
  onOpenChange,
  preferences,
  onSuccess,
}: Readonly<EditPreferencesDialogProps>) {
  const handleSubmit = async (data: PreferencesPartialUpdateInput) => {
    if (!preferences) return;

    try {
      const response = await fetch("/api/preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        toast.error(errorData.message || "Błąd podczas aktualizacji preferencji");
        return;
      }

      toast.success("Preferencje zostały zaktualizowane");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast.error("Nie można zaktualizować preferencji. Spróbuj ponownie później.");
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!preferences) return null;

  const initialValues: PreferencesPartialUpdateInput = {
    diet_type: preferences.diet_type,
    preferred_ingredients: preferences.preferred_ingredients || "",
    preferred_cuisines: preferences.preferred_cuisines || "",
    allergens: preferences.allergens || "",
    notes: preferences.notes || "",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edytuj preferencje</DialogTitle>
          <DialogDescription>
            Zaktualizuj swoje preferencje żywieniowe. Zmiany będą wykorzystane do proponowania przepisów.
          </DialogDescription>
        </DialogHeader>
        <EditPreferencesForm initialValues={initialValues} onSubmit={handleSubmit} onCancel={handleCancel} />
      </DialogContent>
    </Dialog>
  );
}
