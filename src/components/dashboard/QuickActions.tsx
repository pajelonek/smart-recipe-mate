import { Button } from "../ui/button";
import { PlusCircle, Sparkles } from "lucide-react";
import type { QuickActionsProps } from "../../types";

export function QuickActions({ onAddRecipe, onGenerateAI }: Readonly<QuickActionsProps>) {
  const handleAddRecipe = () => {
    onAddRecipe?.();
    window.location.href = "/recipes/new";
  };

  const handleGenerateAI = () => {
    onGenerateAI?.();
    window.location.href = "/ai/generate";
  };

  return (
    <div className="quick-actions flex flex-col sm:flex-row gap-4 mb-8">
      <Button onClick={handleAddRecipe} size="lg" variant="default" className="flex items-center gap-2">
        <PlusCircle className="h-4 w-4" />
        Add Recipe
      </Button>
      <Button onClick={handleGenerateAI} size="lg" variant="secondary" className="flex items-center gap-2">
        <Sparkles className="h-4 w-4" />
        Generate with AI
      </Button>
    </div>
  );
}
