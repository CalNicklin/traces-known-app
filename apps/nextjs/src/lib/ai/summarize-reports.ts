import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";

// Schema with descriptions to guide the model (per AI SDK best practices)
const SummaryResponseSchema = z.object({
  summary: z
    .string()
    .describe("A concise summary of community experiences, maximum 50 words"),
  riskLevel: z
    .enum(["low", "moderate", "high", "unknown"])
    .describe("Risk level based on proportion of reported reactions"),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence score from 0 to 1 based on report consistency"),
});

export type SummaryResponse = z.infer<typeof SummaryResponseSchema>;

interface ReportInput {
  comment: string | null;
  reportDate: Date;
}

export async function summarizeReports(
  reports: ReportInput[],
  productName: string,
  allergenWarning: string | null,
): Promise<SummaryResponse> {
  const reportsWithComments = reports.filter((r) => r.comment);

  if (reportsWithComments.length === 0) {
    return {
      summary: "No detailed community reports available yet.",
      riskLevel: "unknown",
      confidence: 0,
    };
  }

  const { output } = await generateText({
    model: openai("gpt-5"),
    output: Output.object({ schema: SummaryResponseSchema }),
    system: `You summarise community allergy reports for food products to help people with allergies understand real-world experiences.

Your role:
- Summarise what the community has experienced (reactions vs. no reactions)
- Focus on "may contain" warnings and whether products actually caused reactions
- Keep summary under 50 words
- Be objective and factual about what was reported

Risk level guidelines (be decisive, avoid "unknown" when possible):
- low: Reports indicate no reactions, or product is generally well-tolerated
- moderate: At least one reaction reported, but some safe experiences too, OR only 1-2 reports total
- high: Multiple reaction reports, clear pattern of issues, or severe reactions reported
- unknown: ONLY use when reports are truly contradictory or completely uninformative (e.g., all reports say "test" or contain no useful information)

When in doubt between levels, err on the side of caution (choose the higher risk level).

IMPORTANT: This is NOT medical advice. You are summarising community experiences only.`,
    prompt: `Product: ${productName}
Allergen Warning: ${allergenWarning ?? "None specified"}

Analyze these ${reportsWithComments.length} community reports:

${reportsWithComments
  .map((r, i) => `Report ${i + 1}: ${r.comment}`)
  .join("\n\n")}

Provide a summary of community experiences with this product.`,
  });

  if (!output) {
    throw new Error("Failed to generate summary - no output returned");
  }

  return output;
}
