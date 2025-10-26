import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PreferenceCardProps {
  readonly label: string;
  readonly value: string | null | undefined;
  readonly icon?: React.ReactNode;
}

export function PreferenceCard({ label, value, icon }: Readonly<PreferenceCardProps>) {
  const displayValue = value || "Nie podano";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground whitespace-pre-wrap">{displayValue}</p>
      </CardContent>
    </Card>
  );
}
