"use client";

import type { QueryClient } from "@tanstack/react-query";
import { ImageIcon } from "@radix-ui/react-icons";

import {
  cn,
  Field,
  FieldDescription,
  FieldLabel,
  Text,
} from "@acme/ui";
import { Button } from "@acme/ui/button";

import { ImageUpload } from "../../image-upload";
import type { Allergen, ProductSearchResult } from "../types";

interface ReportFormValues {
  productSearch: string;
  productId: string;
  reportType: "" | "safe" | "reaction";
  allergenIds: string[];
  comment: string;
}

interface DetailsStepProps {
  form: {
    Field: React.ComponentType<{
      name: keyof ReportFormValues;
      children: (field: {
        name: string;
        state: { value: string };
        handleBlur: () => void;
        handleChange: (value: string) => void;
      }) => React.ReactNode;
    }>;
    Subscribe: React.ComponentType<{
      selector: (state: { canSubmit: boolean; isSubmitting: boolean }) => [boolean, boolean];
      children: (values: [boolean, boolean]) => React.ReactNode;
    }>;
  };
  reportType: "safe" | "reaction" | undefined;
  allergenIds: string[];
  selectedProduct: ProductSearchResult | null;
  allAllergens: Allergen[];
  isSubmitting: boolean;
  createdReportId: string | null;
  queryClient: QueryClient;
  onComplete: () => void;
}

function ReportSummary({
  selectedProduct,
  reportType,
  allergenIds,
  allAllergens,
}: {
  selectedProduct: ProductSearchResult | null;
  reportType: "safe" | "reaction" | undefined;
  allergenIds: string[];
  allAllergens: Allergen[];
}) {
  const allergenNames = allergenIds
    .map((id) => allAllergens.find((a) => a.id === id)?.name)
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-2 rounded-lg border bg-muted/50 p-3">
      <div>
        <Text variant="small">Product:</Text>
        <Text variant="muted">
          {selectedProduct?.name}
          {selectedProduct?.brand && ` - ${selectedProduct.brand}`}
        </Text>
      </div>
      <div>
        <Text variant="small">Experience Type:</Text>
        <Text
          variant="muted"
          className={cn(
            reportType === "safe"
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400",
          )}
        >
          {reportType === "safe" ? "Safe Experience" : "Allergic Reaction"}
        </Text>
      </div>
      {allergenNames && (
        <div>
          <Text variant="small">
            {reportType === "safe"
              ? "Allergens (safe for):"
              : "Allergens (reacted to):"}
          </Text>
          <Text variant="muted">{allergenNames}</Text>
        </div>
      )}
    </div>
  );
}

export function DetailsStep({
  form,
  reportType,
  allergenIds,
  selectedProduct,
  allAllergens,
  isSubmitting,
  createdReportId,
  queryClient,
  onComplete,
}: DetailsStepProps) {
  return (
    <>
      {/* Summary of previous selections */}
      <ReportSummary
        selectedProduct={selectedProduct}
        reportType={reportType}
        allergenIds={allergenIds}
        allAllergens={allAllergens}
      />

      {/* Comment */}
      <form.Field name="comment">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Additional Comments</FieldLabel>
            <textarea
              id={field.name}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder={
                reportType === "safe"
                  ? "Share any details about your experience with this product..."
                  : "Describe your reaction, symptoms, or any other relevant information..."
              }
              className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <FieldDescription>
              Help others by sharing details about your experience
            </FieldDescription>
          </Field>
        )}
      </form.Field>

      {/* Image Upload Section */}
      {createdReportId ? (
        <div className="space-y-2">
          <span className="text-sm font-medium leading-none">Add Photos</span>
          <ImageUpload
            entityType="report"
            entityId={createdReportId}
            maxImages={5}
            onImagesChange={(images) => {
              const allComplete = images.every(
                (img) => img.status === "complete",
              );
              if (allComplete && images.length > 0) {
                void queryClient.invalidateQueries({
                  queryKey: ["image"],
                });
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="mt-4 w-full"
            onClick={onComplete}
          >
            Done
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ImageIcon className="h-5 w-5" />
            <Text variant="muted">
              You can add photos after submitting your report
            </Text>
          </div>
        </div>
      )}

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
      >
        {([canSubmit, formIsSubmitting]) => (
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || formIsSubmitting || Boolean(createdReportId)}
          >
            {isSubmitting || formIsSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
        )}
      </form.Subscribe>
    </>
  );
}
