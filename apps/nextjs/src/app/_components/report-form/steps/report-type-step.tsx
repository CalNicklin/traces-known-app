"use client";

import {
  CheckCircledIcon,
  ExclamationTriangleIcon,
} from "@radix-ui/react-icons";

import { cn, Text } from "@acme/ui";

import { ProductSummary } from "../product-summary";
import type { ProductSearchResult } from "../types";

interface ReportTypeStepProps {
  selectedProduct: ProductSearchResult | null;
  reportType: "safe" | "reaction" | undefined;
  onSelect: (type: "safe" | "reaction") => void;
}

export function ReportTypeStep({
  selectedProduct,
  reportType,
  onSelect,
}: ReportTypeStepProps) {
  return (
    <div className="space-y-4">
      <ProductSummary product={selectedProduct} />

      <Text variant="h4" className="text-center">
        What kind of experience are you reporting?
      </Text>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Safe Experience Card */}
        <button
          type="button"
          onClick={() => onSelect("safe")}
          className={cn(
            "flex flex-col items-center gap-3 rounded-lg border-2 p-6 transition-all hover:border-primary",
            reportType === "safe"
              ? "border-primary bg-primary/5"
              : "border-border",
          )}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircledIcon className="h-8 w-8" />
          </div>
          <div className="text-center">
            <Text variant="h4">Safe Experience</Text>
            <Text variant="muted" className="mt-1">
              I consumed this product without any allergic reaction
            </Text>
          </div>
        </button>

        {/* Allergic Reaction Card */}
        <button
          type="button"
          onClick={() => onSelect("reaction")}
          className={cn(
            "flex flex-col items-center gap-3 rounded-lg border-2 p-6 transition-all hover:border-primary",
            reportType === "reaction"
              ? "border-primary bg-primary/5"
              : "border-border",
          )}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            <ExclamationTriangleIcon className="h-8 w-8" />
          </div>
          <div className="text-center">
            <Text variant="h4">Allergic Reaction</Text>
            <Text variant="muted" className="mt-1">
              I had an allergic reaction to this product
            </Text>
          </div>
        </button>
      </div>
    </div>
  );
}
