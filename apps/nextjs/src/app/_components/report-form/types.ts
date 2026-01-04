import { z } from "zod/v4";

// Form schema for report submission
export const ReportFormSchema = z.object({
  productSearch: z.string().min(1, "Please search for a product"),
  productId: z.string().uuid("Please select a valid product"),
  reportType: z.enum(["safe", "reaction"]),
  allergenIds: z.array(z.string().uuid()).optional(),
  comment: z.string().optional(),
});

export type ReportFormData = z.infer<typeof ReportFormSchema>;

export interface ProductSearchResult {
  id: string;
  name: string;
  brand?: string | null;
  barcode?: string | null;
}

export interface Allergen {
  id: string;
  name: string;
}

export type WizardStep = "product" | "type" | "allergens" | "details";

export const STEP_NUMBERS: Record<WizardStep, number> = {
  product: 1,
  type: 2,
  allergens: 3,
  details: 4,
};

export const WIZARD_STEPS: readonly WizardStep[] = [
  "product",
  "type",
  "allergens",
  "details",
] as const;
