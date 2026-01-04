"use client";

import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";

import { Field, FieldDescription, FieldLabel, Text } from "@acme/ui";
import { Button } from "@acme/ui/button";

import type { Allergen } from "../types";

interface AllergenSelectionStepProps {
  reportType: "safe" | "reaction" | undefined;
  allergenIds: string[];
  toggleAllergen: (allergenId: string) => void;
  allAllergens: Allergen[];
  allAllergensEmptyMessage?: string;
  myAllergens: Allergen[];
  myAllergensEmptyMessage?: string;
  otherAllergens: Allergen[];
  hasUserAllergens: boolean;
  showAllAllergens: boolean;
  setShowAllAllergens: (value: boolean) => void;
  onContinue: () => void;
}

function AllergenCheckbox({
  allergen,
  checked,
  onChange,
}: {
  allergen: Allergen;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center space-x-2 rounded-md border p-2 hover:bg-muted">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-gray-300"
      />
      <Text variant="muted">{allergen.name}</Text>
    </label>
  );
}

export function AllergenSelectionStep({
  reportType,
  allergenIds,
  toggleAllergen,
  allAllergens,
  allAllergensEmptyMessage,
  myAllergens,
  myAllergensEmptyMessage,
  otherAllergens,
  hasUserAllergens,
  showAllAllergens,
  setShowAllAllergens,
  onContinue,
}: AllergenSelectionStepProps) {
  const label =
    reportType === "safe"
      ? "Which allergens were you concerned about?"
      : "Which allergens caused your reaction?";

  const description =
    reportType === "safe"
      ? "Select the allergens you have that this product was safe for"
      : "Select all allergens that caused a reaction";

  // Handle empty states
  if (allAllergensEmptyMessage) {
    return (
      <Field>
        <FieldLabel>{label}</FieldLabel>
        <div className="rounded-lg border border-dashed p-4 text-center">
          <Text variant="muted">{allAllergensEmptyMessage}</Text>
        </div>
        <Button type="button" className="mt-4 w-full" onClick={onContinue}>
          Continue
        </Button>
      </Field>
    );
  }

  const handleAllergenChange = (allergenId: string, checked: boolean) => {
    if (checked !== allergenIds.includes(allergenId)) {
      toggleAllergen(allergenId);
    }
  };

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <FieldDescription>{description}</FieldDescription>
      <div className="space-y-4">
        {/* User's allergens (shown first if they have any) */}
        {hasUserAllergens ? (
          <div className="space-y-2">
            <Text variant="muted" className="font-medium">
              Your Allergens
            </Text>
            <div className="grid grid-cols-2 gap-2">
              {myAllergens.map((allergen) => (
                <AllergenCheckbox
                  key={allergen.id}
                  allergen={allergen}
                  checked={allergenIds.includes(allergen.id)}
                  onChange={(checked) =>
                    handleAllergenChange(allergen.id, checked)
                  }
                />
              ))}
            </div>
          </div>
        ) : myAllergensEmptyMessage ? (
          <div className="rounded-lg border border-dashed bg-muted/50 p-3 text-center">
            <Text variant="muted">{myAllergensEmptyMessage}</Text>
          </div>
        ) : null}

        {/* Show all / Other allergens */}
        {hasUserAllergens ? (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowAllAllergens(!showAllAllergens)}
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {showAllAllergens ? (
                <>
                  <ChevronUpIcon className="size-4" />
                  Hide other allergens
                </>
              ) : (
                <>
                  <ChevronDownIcon className="size-4" />
                  Show all allergens
                </>
              )}
            </button>
            {showAllAllergens && (
              <div className="grid grid-cols-2 gap-2">
                {otherAllergens.map((allergen) => (
                  <AllergenCheckbox
                    key={allergen.id}
                    allergen={allergen}
                    checked={allergenIds.includes(allergen.id)}
                    onChange={(checked) =>
                      handleAllergenChange(allergen.id, checked)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* No user allergens - show all */
          <div className="grid grid-cols-2 gap-2">
            {allAllergens.map((allergen) => (
              <AllergenCheckbox
                key={allergen.id}
                allergen={allergen}
                checked={allergenIds.includes(allergen.id)}
                onChange={(checked) =>
                  handleAllergenChange(allergen.id, checked)
                }
              />
            ))}
          </div>
        )}
      </div>
      <Button type="button" className="mt-4 w-full" onClick={onContinue}>
        Continue
      </Button>
    </Field>
  );
}
