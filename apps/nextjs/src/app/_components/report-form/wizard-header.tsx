"use client";

import { ChevronLeftIcon } from "@radix-ui/react-icons";

import { CardHeader, CardTitle, cn, Text } from "@acme/ui";
import { Button } from "@acme/ui/button";

import { STEP_NUMBERS, WIZARD_STEPS, type WizardStep } from "./types";

interface WizardHeaderProps {
  currentStep: WizardStep;
  onBack: () => void;
}

export function WizardHeader({ currentStep, onBack }: WizardHeaderProps) {
  const currentStepNumber = STEP_NUMBERS[currentStep];
  // Don't count success step in total
  const totalSteps = WIZARD_STEPS.length - 1;
  const isSuccessStep = currentStep === "success";

  // Show simplified header for success step
  if (isSuccessStep) {
    return (
      <CardHeader>
        <CardTitle className="text-center">Report Complete</CardTitle>
      </CardHeader>
    );
  }

  return (
    <CardHeader>
      <div className="flex items-center gap-2">
        {currentStep !== "product" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-8 w-8 p-0"
            type="button"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
        )}
        <div className="flex-1">
          <CardTitle>Report Your Experience</CardTitle>
          <Text variant="muted" className="mt-1">
            Step {currentStepNumber} of {totalSteps}
          </Text>
        </div>
      </div>
      {/* Progress bar */}
      <div className="mt-4 flex gap-1">
        {WIZARD_STEPS.filter((s) => s !== "success").map((step) => (
          <div
            key={step}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              STEP_NUMBERS[step] <= currentStepNumber
                ? "bg-primary"
                : "bg-muted",
            )}
          />
        ))}
      </div>
    </CardHeader>
  );
}
