import { useOnboardingForm } from "@/hooks/useOnboardingForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "./ProgressBar";
import { DietTypeStep } from "./DietTypeStep";
import { PreferencesStep } from "./PreferencesStep";

interface OnboardingFormProps {
  accessToken: string;
}

export function OnboardingForm({ accessToken }: Readonly<OnboardingFormProps>) {
  const { form, formState, nextStep, prevStep, submitOnboarding } = useOnboardingForm(accessToken);

  const handleSubmit = form.handleSubmit(async (data) => {
    await submitOnboarding(data);
  });

  const handleNext = () => {
    nextStep();
  };

  const handlePrev = () => {
    prevStep();
  };

  const handleStepSubmit = () => {
    if (formState.step === 1) {
      handleNext();
    } else {
      handleSubmit();
    }
  };

  return (
    <div className="bg-background flex items-center justify-center p-4 mt-25">
      <div className="w-full max-w-2xl space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Skonfiguruj swoje preferencje</CardTitle>
            <CardDescription>
              Pomożemy Ci znaleźć idealne przepisy dostosowane do Twoich potrzeb żywieniowych
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ProgressBar currentStep={formState.step} />
            <form onSubmit={handleSubmit} className="space-y-6">
              {formState.step === 1 && (
                <DietTypeStep form={form} onNext={handleNext} isSubmitting={formState.isSubmitting} />
              )}
              {formState.step === 2 && (
                <PreferencesStep
                  form={form}
                  onPrev={handlePrev}
                  onSubmit={handleStepSubmit}
                  isSubmitting={formState.isSubmitting}
                />
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
