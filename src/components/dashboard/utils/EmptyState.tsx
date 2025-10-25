import React from "react";
import { ChefHat } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: Readonly<EmptyStateProps>) {
  return (
    <div className="empty-state flex flex-col items-center justify-center py-12 text-center">
      <div className="empty-state-icon mb-4">
        <ChefHat size={64} className="text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
