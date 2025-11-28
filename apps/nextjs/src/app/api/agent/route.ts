import { NextResponse } from "next/server";
import { Experimental_Agent as Agent, stepCountIs, tool } from "ai";
import { z } from "zod";

import type { AgentBlock, AgentRequest } from "~/app/_lib/agent-schema";
import {
  AgentRequestSchema,
  AgentResponseSchema,
} from "~/app/_lib/agent-schema";
import { getModel } from "~/server/ai/openai-client";
import { ensureProductSummary } from "~/server/ai/risk-summary";
import { getServerCaller } from "~/server/trpc-caller";

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = AgentRequestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request payload",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const response = await runAgent(parsed.data, request);
    return NextResponse.json(response);
  } catch (error) {
    console.error("agent error", error);
    const fallback = AgentResponseSchema.parse({
      blocks: [
        {
          id: crypto.randomUUID(),
          kind: "text",
          role: "assistant",
          text: "I encountered an issue. Let me search for what you mentioned instead.",
        },
        {
          id: crypto.randomUUID(),
          kind: "component",
          component: "lookupResults",
          props: { query: parsed.data.prompt },
        },
      ],
      meta: { source: "stub" },
    });
    return NextResponse.json(fallback, { status: 200 });
  }
}

async function runAgent(payload: AgentRequest, request: Request) {
  const caller = await getServerCaller(request.headers);
  const session = await caller.auth.getSession();
  const userName = session?.user?.name ?? "friend";

  // Collect UI blocks from tool calls
  const uiBlocks: AgentBlock[] = [];

  // Build conversation context from history
  const conversationHistory = (payload.blocks ?? [])
    .slice(-6)
    .map((block) =>
      block.kind === "text"
        ? `${block.role}: ${block.text}`
        : `[showed ${block.component} component]`,
    )
    .join("\n");

  // Create the agent with tools
  const allergyAgent = new Agent({
    model: getModel(),
    system: `You are the Traces Known allergy assistant, helping users find safe food products and manage their allergies.

The user's name is ${userName}.

You have tools to:
- Search for products (searchProducts)
- Get product details and allergen info (getProductDetails)  
- Check user's allergen preferences (getUserAllergens)
- Show a report form for reactions (showReportForm)
- Show recent reports (showRecentReports)

Guidelines:
- If the user mentions a food product, search for it
- If they want details on a specific product from search results, get its details
- Be concise and helpful
- Don't make up information - use the tools to get real data
- If unsure what the user wants, ask for clarification

${conversationHistory ? `Recent conversation:\n${conversationHistory}` : ""}`,

    tools: {
      searchProducts: tool({
        description:
          "Search for food products by name, brand, or barcode. Use this when the user mentions a specific product or wants to find something.",
        inputSchema: z.object({
          query: z
            .string()
            .describe("Product name, brand, or barcode to search"),
        }),
        execute: async ({ query }) => {
          const results = await caller.product.search({
            query,
            page: 1,
            limit: 6,
          });

          // Add search results UI block
          uiBlocks.push({
            id: crypto.randomUUID(),
            kind: "component",
            component: "lookupResults",
            props: { query },
          });

          return {
            found: results.length,
            products: results.map((p) => ({
              id: p.id,
              name: p.name,
              barcode: p.barcode,
            })),
          };
        },
      }),

      getProductDetails: tool({
        description:
          "Get detailed allergen and risk information for a specific product by ID. Use after searching to show details.",
        inputSchema: z.object({
          productId: z
            .string()
            .uuid()
            .describe("The product ID to get details for"),
        }),
        execute: async ({ productId }) => {
          const detail = await caller.product.detail({ id: productId });

          if (!detail) {
            return { error: "Product not found" };
          }

          // Ensure AI summary is generated
          await ensureProductSummary(productId).catch(() => null);

          // Add product summary UI block
          uiBlocks.push({
            id: crypto.randomUUID(),
            kind: "component",
            component: "productSummary",
            props: { productId },
          });

          return {
            name: detail.product.name,
            brand: detail.product.brand,
            allergenWarning: detail.product.allergenWarning,
            riskLevel: detail.product.riskLevel,
            totalReports: detail.stats.totalReports,
          };
        },
      }),

      getUserAllergens: tool({
        description:
          "Get the current user's allergen preferences and sensitivities. Use when discussing their allergies or preferences.",
        inputSchema: z.object({}),
        execute: async () => {
          if (!session?.user?.id) {
            return { error: "User not logged in", allergens: [] };
          }

          const allergens = await caller.allergen.mine();

          // Add allergen preferences UI block
          uiBlocks.push({
            id: crypto.randomUUID(),
            kind: "component",
            component: "allergenPreferences",
            props: {},
          });

          return {
            allergens: allergens.map((a) => a.name),
          };
        },
      }),

      showReportForm: tool({
        description:
          "Show a form to submit an allergy reaction report. Use when the user wants to report a reaction or experience.",
        inputSchema: z.object({
          productId: z
            .string()
            .uuid()
            .nullable()
            .describe("Optional product ID to pre-fill the form"),
        }),
        execute: async ({ productId }) => {
          uiBlocks.push({
            id: crypto.randomUUID(),
            kind: "component",
            component: "reportForm",
            props: { productId: productId ?? undefined },
          });

          return { shown: true, productId };
        },
      }),

      showRecentReports: tool({
        description:
          "Show recent allergy reports. Use 'mine' scope for user's own reports, 'latest' for community reports.",
        inputSchema: z.object({
          scope: z
            .enum(["latest", "mine"])
            .describe("'mine' for user's reports, 'latest' for all recent"),
        }),
        execute: async ({ scope }) => {
          uiBlocks.push({
            id: crypto.randomUUID(),
            kind: "component",
            component: "recentReports",
            props: { scope },
          });

          return { shown: true, scope };
        },
      }),
    },

    stopWhen: stepCountIs(10),
  });

  // Run the agent
  const result = await allergyAgent.generate({
    prompt: payload.prompt,
  });

  // Add the assistant's text response as a block
  if (result.text) {
    uiBlocks.unshift({
      id: crypto.randomUUID(),
      kind: "text",
      role: "assistant",
      text: result.text,
    });
  }

  // If no blocks were created, add a default response
  if (uiBlocks.length === 0) {
    uiBlocks.push({
      id: crypto.randomUUID(),
      kind: "text",
      role: "assistant",
      text: "I'm here to help you find allergy-safe foods. Try asking about a specific product or say 'show my allergens' to see your preferences.",
    });
  }

  return AgentResponseSchema.parse({
    blocks: uiBlocks,
    meta: { source: "openai" },
  });
}
