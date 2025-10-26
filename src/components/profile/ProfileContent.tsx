import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileInfo } from "./ProfileInfo";
import { LastModifiedDate } from "./LastModifiedDate";
import { EditPreferencesDialog } from "./EditPreferencesDialog";
import type { UserPreferences, ApiError } from "@/types";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

interface ProfileContentProps {
  readonly initialPreferences: UserPreferences | null;
}

export function ProfileContent({ initialPreferences }: Readonly<ProfileContentProps>) {
  const [preferences, setPreferences] = useState<UserPreferences | null>(initialPreferences);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const refreshPreferences = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/preferences", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.message || "Nie można pobrać preferencji");
      }

      const data: UserPreferences = await response.json();
      setPreferences(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nieznany błąd";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    refreshPreferences();
  };

  // Loading state
  if (isLoading && !preferences) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Empty state (no preferences)
  if (!preferences && !error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <h2 className="text-2xl font-semibold">Brak preferencji</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Nie skonfigurowałeś jeszcze swoich preferencji żywieniowych. Uzupełnij je, aby aplikacja mogła proponować
          dopasowane przepisy.
        </p>
        <div className="flex gap-4 mt-6">
          <Button asChild variant="outline">
            <a href="/onboarding">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Uzupełnij preferencje
            </a>
          </Button>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <h2 className="text-2xl font-semibold">Błąd</h2>
        <p className="text-muted-foreground text-center max-w-md">{error}</p>
        <Button onClick={refreshPreferences} disabled={isLoading}>
          Spróbuj ponownie
        </Button>
      </div>
    );
  }

  // Normal state
  if (!preferences) return null;

  return (
    <div className="space-y-6">
      <ProfileHeader onEdit={handleEdit} />
      <ProfileInfo preferences={preferences} />
      <LastModifiedDate updatedAt={preferences.updated_at} />
      <EditPreferencesDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        preferences={preferences}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
