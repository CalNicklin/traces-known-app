import { generateObject } from "ai";
import { z } from "zod";

import type { ProductAISummary } from "@acme/db/schema";

import { getServerCaller } from "../trpc-caller";
import { getModel } from "./openai-client";

// Using standard zod (not v4) for AI SDK compatibility with JSON schema conversion
const RiskSummaryResponseSchema = z.object({
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
  summary: z.string(),
  highlights: z.array(z.string()),
  recommendations: z.array(z.string()),
  sampleSize: z.number().int().nonnegative().nullable(),
});

export async function ensureProductSummary(productId: string) {
  const caller = await getServerCaller();
  const detail = await caller.product.detail({ id: productId });

  if (!detail) {
    return null;
  }

  const summary = detail.product.aiSummary;
  const updatedAt = detail.product.aiSummaryUpdatedAt
    ? new Date(detail.product.aiSummaryUpdatedAt)
    : null;

  const stale =
    !summary ||
    !updatedAt ||
    Date.now() - updatedAt.getTime() > 1000 * 60 * 60 * 12;

  if (!stale) {
    return summary;
  }

  return generateRiskSummary(productId);
}

export async function generateRiskSummary(
  productId: string,
): Promise<ProductAISummary> {
  const caller = await getServerCaller();
  const detail = await caller.product.detail({ id: productId });

  if (!detail) {
    throw new Error("Product not found for summary generation");
  }

  const reports = await caller.report.byProductId({ productId });

  const payload = {
    product: {
      name: detail.product.name,
      brand: detail.product.brand,
      allergenWarning: detail.product.allergenWarning,
      riskLevel: detail.product.riskLevel,
    },
    stats: detail.stats,
    recentReports: reports.slice(0, 5).map((report) => ({
      severity: report.severity,
      comment: report.comment,
      allergenIds: report.allergenIds,
    })),
  };

  const { object: parsed } = await generateObject({
    model: getModel(),
    schema: RiskSummaryResponseSchema,
    system: `You are the Traces Known allergy analyst. Summarize the allergy risk for the product described below.
Be concise (2-3 sentences max for the summary) and avoid medical advice.`,
    prompt: JSON.stringify(payload),
  });

  await caller.product.upsertSummary({
    productId,
    summary: parsed,
  });

  return parsed;
}
