import type { UserStats as UserStatsType } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { UserStats } from "./UserStats";

interface WelcomeSectionProps {
  userName: string;
  stats: UserStatsType;
}

export function WelcomeSection({ userName, stats }: Readonly<WelcomeSectionProps>) {
  return (
    <section className="welcome-section mb-8">
      <Card>
        <CardHeader>
          <CardTitle>Welcome back, {userName}!</CardTitle>
          <CardDescription>Here&apos;s your recipe collection overview</CardDescription>
        </CardHeader>
        <CardContent>
          <UserStats stats={stats} />
        </CardContent>
      </Card>
    </section>
  );
}
