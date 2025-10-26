import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  currentStep: 1 | 2;
}

export function ProgressBar({ currentStep }: Readonly<ProgressBarProps>) {
  const progressValue = currentStep * 50;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Krok {currentStep} z 2</span>
        <span>{progressValue}%</span>
      </div>
      <Progress value={progressValue} className="w-full" />
    </div>
  );
}
