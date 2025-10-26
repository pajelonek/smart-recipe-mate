import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

interface ProfileHeaderProps {
  readonly onEdit: () => void;
}

export function ProfileHeader({ onEdit }: Readonly<ProfileHeaderProps>) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profil użytkownika</h1>
        <p className="text-muted-foreground mt-1">Zarządzaj swoimi preferencjami żywieniowymi</p>
      </div>
      <Button onClick={onEdit} className="gap-2">
        <Edit className="h-4 w-4" />
        Edytuj
      </Button>
    </div>
  );
}
