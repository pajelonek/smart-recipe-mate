import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { UserStats } from "./UserStats";
import type { WelcomeSectionProps } from "../../types";

export function WelcomeSection({ userName, stats }: Readonly<WelcomeSectionProps>) {
  return (
    <section className="welcome-section mb-8">
      <Card>
        <CardHeader>
          <CardTitle>Welcome back, {userName}!</CardTitle>
          <CardDescription>Here's your recipe collection overview</CardDescription>
        </CardHeader>
        <CardContent>
          <UserStats stats={stats} />
        </CardContent>
      </Card>
    </section>
  );
}
