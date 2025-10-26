import type { UserPreferences } from "@/types";
import { PreferenceCard } from "./PreferenceCard";
import { Apple, Globe, ChefHat, AlertTriangle, FileText } from "lucide-react";

interface ProfileInfoProps {
  readonly preferences: UserPreferences;
}

const DIET_TYPE_MAP: Record<string, string> = {
  omnivore: "Wszystkożerne (bez ograniczeń)",
  vegetarian: "Wegetariańskie",
  vegan: "Wegańskie",
  pescatarian: "Pescetariańskie (ryby dozwolone)",
  keto: "Ketogeniczne (niskowęglowodanowe)",
  paleo: "Paleo",
  mediterranean: "Śródziemnomorskie",
  "low-carb": "Niskowęglowodanowe",
  "gluten-free": "Bez glutenu",
  "dairy-free": "Bez produktów mlecznych",
  "low-sugar": "Bezcukrowe (niskocukrowe)",
  "low-fat": "Niskotłuszczowe",
};

export function ProfileInfo({ preferences }: Readonly<ProfileInfoProps>) {
  const dietTypeLabel = DIET_TYPE_MAP[preferences.diet_type] || preferences.diet_type;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <PreferenceCard label="Typ diety" value={dietTypeLabel} icon={<Apple className="h-5 w-5" />} />
      <PreferenceCard
        label="Ulubione składniki"
        value={preferences.preferred_ingredients || undefined}
        icon={<ChefHat className="h-5 w-5" />}
      />
      <PreferenceCard
        label="Preferowane kuchnie"
        value={preferences.preferred_cuisines || undefined}
        icon={<Globe className="h-5 w-5" />}
      />
      <PreferenceCard
        label="Alergeny"
        value={preferences.allergens || undefined}
        icon={<AlertTriangle className="h-5 w-5" />}
      />
      <PreferenceCard
        label="Dodatkowe uwagi"
        value={preferences.notes || undefined}
        icon={<FileText className="h-5 w-5" />}
      />
    </div>
  );
}
