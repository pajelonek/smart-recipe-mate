import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import type { StatCardProps } from "../../../types";

export function StatCard({ icon, value, label, onClick }: Readonly<StatCardProps>) {
  return (
    <Card className="stat-card cursor-pointer hover:bg-accent" onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
