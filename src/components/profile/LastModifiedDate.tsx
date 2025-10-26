import { Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils/date-formatter";

interface LastModifiedDateProps {
  readonly updatedAt: string;
}

export function LastModifiedDate({ updatedAt }: Readonly<LastModifiedDateProps>) {
  const formattedDate = formatDate(updatedAt, { format: "absolute" });

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-6 pt-6 border-t">
      <Calendar className="h-4 w-4" />
      <span>Ostatnia modyfikacja: {formattedDate}</span>
    </div>
  );
}
