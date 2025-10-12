import { StatCard } from "./StatCard";
import { ChefHat, Sparkles } from "lucide-react";
import type { UserStatsProps, UserStats } from "../../types";

export function UserStats({ stats }: Readonly<UserStatsProps>) {
  const recipesCount = stats.recipesCount || 0;
  const generationsCount = stats.generationsCount || 0;

  return (
    <div className="stats-grid grid grid-cols-1 md:grid-cols-2 gap-4">
      <StatCard
        icon={<ChefHat className="h-4 w-4 text-muted-foreground" />}
        value={recipesCount}
        label="Total Recipes"
      />
      <StatCard
        icon={<Sparkles className="h-4 w-4 text-muted-foreground" />}
        value={generationsCount}
        label="AI Generations"
      />
    </div>
  );
}
