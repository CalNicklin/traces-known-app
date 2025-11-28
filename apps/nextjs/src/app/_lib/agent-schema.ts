import { z } from "zod/v4";

export const AgentRoleSchema = z.enum(["assistant", "user", "system"]);

export const AgentComponentTypeSchema = z.enum([
  "lookupResults",
  "productSummary",
  "reportForm",
  "allergenPreferences",
  "recentReports",
]);

const LookupResultsBlockSchema = z.object({
  id: z.string().uuid(),
  kind: z.literal("component"),
  component: z.literal("lookupResults"),
  props: z.object({
    query: z.string().min(1),
  }),
});

const ProductSummaryBlockSchema = z.object({
  id: z.string().uuid(),
  kind: z.literal("component"),
  component: z.literal("productSummary"),
  props: z.object({
    productId: z.string().uuid(),
  }),
});

const ReportFormBlockSchema = z.object({
  id: z.string().uuid(),
  kind: z.literal("component"),
  component: z.literal("reportForm"),
  props: z
    .object({
      productId: z.string().uuid().optional(),
    })
    .default({}),
});

const AllergenPreferencesBlockSchema = z.object({
  id: z.string().uuid(),
  kind: z.literal("component"),
  component: z.literal("allergenPreferences"),
  props: z.object({}).optional(),
});

const RecentReportsBlockSchema = z.object({
  id: z.string().uuid(),
  kind: z.literal("component"),
  component: z.literal("recentReports"),
  props: z.object({
    scope: z.enum(["latest", "mine"]).default("latest"),
  }),
});

export const AgentComponentBlockSchema = z.discriminatedUnion("component", [
  LookupResultsBlockSchema,
  ProductSummaryBlockSchema,
  ReportFormBlockSchema,
  AllergenPreferencesBlockSchema,
  RecentReportsBlockSchema,
]);

export const AgentTextBlockSchema = z.object({
  id: z.string().uuid(),
  kind: z.literal("text"),
  role: AgentRoleSchema,
  text: z.string(),
});

export const AgentBlockSchema = z.discriminatedUnion("kind", [
  AgentTextBlockSchema,
  AgentComponentBlockSchema,
]);

export const AgentRequestSchema = z.object({
  prompt: z.string().min(1),
  blocks: z.array(AgentBlockSchema).optional(),
});

export const AgentResponseSchema = z.object({
  blocks: z.array(AgentBlockSchema),
  meta: z
    .object({
      source: z.enum(["stub", "openai"]).default("stub"),
    })
    .optional(),
});

export type AgentRole = z.infer<typeof AgentRoleSchema>;
export type AgentComponentType = z.infer<typeof AgentComponentTypeSchema>;
export type AgentBlock = z.infer<typeof AgentBlockSchema>;
export type AgentResponse = z.infer<typeof AgentResponseSchema>;
export type AgentRequest = z.infer<typeof AgentRequestSchema>;

