import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecipeActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export function RecipeActions({ onEdit, onDelete }: Readonly<RecipeActionsProps>) {
  return (
    <div className="flex gap-4 pt-6 border-t">
      <Button onClick={onEdit} variant="outline" className="flex-1">
        <Edit className="mr-2 h-4 w-4" />
        Edytuj
      </Button>
      <Button onClick={onDelete} variant="destructive" className="flex-1">
        <Trash2 className="mr-2 h-4 w-4" />
        Usuń
      </Button>
    </div>
  );
}
