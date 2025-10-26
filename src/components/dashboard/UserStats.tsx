import { StatCard } from "./card/StatCard";
import { ChefHat, Sparkles } from "lucide-react";
import type { UserStats } from "../../types";

interface UserStatsProps {
  stats: UserStats;
}

export function UserStats({ stats }: Readonly<UserStatsProps>) {
  const recipesCount = stats.recipesCount || 0;
  const generationsCount = stats.generationsCount || 0;

  const onStatsClick = () => {
    globalThis.location.href = "/recipes";
  };

  const onGenerationsClick = () => {
    globalThis.location.href = "/ai/generate";
  };

  return (
    <div className="stats-grid grid grid-cols-1 md:grid-cols-2 gap-4">
      <StatCard
        icon={<ChefHat className="h-4 w-4 text-muted-foreground" />}
        value={recipesCount}
        label="Total Recipes"
        onClick={onStatsClick}
      />
      <StatCard
        icon={<Sparkles className="h-4 w-4 text-muted-foreground" />}
        value={generationsCount}
        label="AI Generations"
        onClick={onGenerationsClick}
      />
    </div>
  );
}
