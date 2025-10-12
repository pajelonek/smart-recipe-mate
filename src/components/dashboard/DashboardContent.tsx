import { useEffect } from "react";
import { WelcomeSection } from "./WelcomeSection";
import { QuickActions } from "./QuickActions";
import { RecentRecipesList } from "./RecentRecipesList";
import { useDashboard } from "../../hooks/useDashboard";
import type { DashboardContentProps } from "../../types";

export function DashboardContent({
  initialRecipes,
  initialStats,
  userName,
  sessionToken,
}: Readonly<DashboardContentProps>) {
  // TODO why is it here?
  useEffect(() => {
    globalThis.supabaseSession = { access_token: sessionToken };
  }, [sessionToken]);

  const { recipes, stats, isLoading, error, deleteRecipe } = useDashboard(initialRecipes, initialStats);

  if (error) {
    return (
      <div className="dashboard-content p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-content max-w-7xl mx-auto p-6 space-y-8">
      <WelcomeSection userName={userName} stats={stats} />
      <QuickActions />
      <RecentRecipesList recipes={recipes} isLoading={isLoading} onDelete={deleteRecipe} />
    </div>
  );
}
