"use server";

import type { ReactNode } from "react";
import { cache } from "react";
import { headers } from "next/headers";
import { getMutableAIState, streamUI } from "@ai-sdk/rsc";
import { z } from "zod/v4";

import type { AgentBlock } from "~/app/_lib/agent-schema";
import type { CanvasUIState } from "~/app/_lib/generative-ai-types";
import { getModel } from "~/server/ai/openai-client";
import { ensureProductSummary } from "~/server/ai/risk-summary";
import { getServerCaller } from "~/server/trpc-caller";
import { AgentBlockRenderer } from "../_components/agent/agent-block-renderer";
import { ChatBubble } from "../_components/generative/chat-bubble";

type ConversationMessage = {
  readonly id: string;
  readonly role: "assistant" | "user";
  readonly content: string;
};

type AgentComponentBlock = Extract<AgentBlock, { kind: "component" }>;

type ModuleSlot = "workbench" | "sidebar";
type ModulePolicy = "replace" | "singleton" | "stack" | "scoped";

interface ModuleState {
  readonly id: string;
  readonly block: AgentComponentBlock;
}

interface ModuleDisplay {
  readonly id: string;
  readonly component: AgentComponentBlock["component"];
  readonly slot: ModuleSlot;
  readonly title: string;
  readonly node: ReactNode;
}

interface DisplayMessage {
  readonly id: string;
  readonly role: ConversationMessage["role"];
  readonly node: ReactNode;
}

export interface CanvasAIState {
  readonly transcript: ConversationMessage[];
  readonly modules: ModuleState[];
  readonly log: Array<{
    readonly id: string;
    readonly prompt: string;
    readonly modules: string[];
    readonly timestamp: number;
  }>;
}

type ModuleRegistryEntry = {
  readonly title: string;
  readonly slot: ModuleSlot;
  readonly policy: ModulePolicy;
  readonly scopeKey?: (block: AgentComponentBlock) => string;
};

const MODULE_REGISTRY: Record<
  AgentComponentBlock["component"],
  ModuleRegistryEntry
> = {
  lookupResults: {
    title: "Lookup results",
    slot: "workbench",
    policy: "replace",
  },
  productSummary: {
    title: "Product insight",
    slot: "workbench",
    policy: "replace",
  },
  reportForm: {
    title: "Report reaction",
    slot: "workbench",
    policy: "singleton",
  },
  allergenPreferences: {
    title: "My allergens",
    slot: "sidebar",
    policy: "singleton",
  },
  recentReports: {
    title: "Recent reports",
    slot: "sidebar",
    policy: "scoped",
    scopeKey: (block) => {
      if (block.component !== "recentReports") {
        return block.id;
      }
      return block.props.scope ?? "latest";
    },
  },
};

const getCaller = cache(async () => {
  const callerHeaders = await headers();
  return getServerCaller(callerHeaders);
});

function deriveUIState(state: CanvasAIState): CanvasUIState {
  return {
    messages: state.transcript.map(renderMessageFromData),
    modules: state.modules.map(renderModuleDisplay),
  };
}

function renderMessageFromData(message: ConversationMessage): DisplayMessage {
  return {
    id: message.id,
    role: message.role,
    node: (
      <ChatBubble
        role={message.role}
        content={message.content}
        isStreaming={false}
      />
    ),
  };
}

function renderModuleDisplay(module: ModuleState): ModuleDisplay {
  const meta = MODULE_REGISTRY[module.block.component];
  return {
    id: module.id,
    component: module.block.component,
    slot: meta.slot,
    title: meta.title,
    node: <AgentBlockRenderer block={module.block} />,
  };
}

function createModuleState<T extends AgentComponentBlock["component"]>(
  component: T,
  props: Extract<AgentComponentBlock, { component: T }>["props"],
): ModuleState;
function createModuleState<T extends AgentComponentBlock["component"]>(
  component: T,
): ModuleState;
function createModuleState<T extends AgentComponentBlock["component"]>(
  component: T,
  props?: Extract<AgentComponentBlock, { component: T }>["props"],
): ModuleState {
  const block: AgentComponentBlock = {
    id: crypto.randomUUID(),
    kind: "component",
    component,
    props: (props ?? {}) as Extract<
      AgentComponentBlock,
      { component: T }
    >["props"],
  } as AgentComponentBlock;
  return {
    id: block.id,
    block,
  };
}

function applyModuleMutations(
  current: ModuleState[],
  incoming: ModuleState[],
): ModuleState[] {
  if (incoming.length === 0) {
    return current;
  }
  let next = [...current];
  for (const module of incoming) {
    const registry = MODULE_REGISTRY[module.block.component];
    switch (registry.policy) {
      case "stack":
        next.push(module);
        break;
      case "singleton":
        next = next.filter(
          (existing) => existing.block.component !== module.block.component,
        );
        next.push(module);
        break;
      case "replace":
        next = next.filter(
          (existing) => existing.block.component !== module.block.component,
        );
        next.push(module);
        break;
      case "scoped": {
        const scopeKey = registry.scopeKey?.(module.block) ?? module.block.id;
        next = next.filter((existing) => {
          if (existing.block.component !== module.block.component) {
            return true;
          }
          const existingKey =
            registry.scopeKey?.(existing.block) ?? existing.block.id;
          return existingKey !== scopeKey;
        });
        next.push(module);
        break;
      }
    }
  }
  const seen = new Set<string>();
  const deduped: ModuleState[] = [];
  for (const module of next) {
    if (seen.has(module.id)) {
      continue;
    }
    seen.add(module.id);
    deduped.push(module);
  }
  return deduped;
}

function buildSystemPrompt(userName: string) {
  return `You are the Traces Known allergy concierge helping ${userName} compose a task-focused canvas.

You control UI modules via the available tools. The user can request multiple modules at once, so call every tool needed in a single reply (for example, search + product summary + report form).

Guidelines:
- Be concise in natural language responses (1–2 sentences max) and rely on modules for depth.
- Use searchProducts when products are mentioned, then getProductDetails with the matching productId.
- Show report forms when the user wants to log a reaction. Pass the productId if known.
- Show recent reports (scope 'latest' or 'mine') whenever the user asks for community or personal history.
- Surface allergen preferences when users mention their sensitivities.
- If the user asks to pin multiple modules, call each tool so they appear side by side.
- Never invent data; always lean on tool outputs.
- If an operation fails, acknowledge it briefly and offer another path.`;
}

function buildModelMessages(history: ConversationMessage[]) {
  const tail = history.slice(-8);
  return tail.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

export async function continueConversation({
  prompt,
}: {
  readonly prompt: string;
}): Promise<CanvasUIState> {
  const trimmed = prompt.trim();
  const aiState = getMutableAIState();
  const state = aiState.get() as CanvasAIState;
  if (!trimmed) {
    return deriveUIState(state);
  }

  const caller = await getCaller();
  const session = await caller.auth.getSession();
  const userName = session?.user.name ?? "friend";

  const userMessage: ConversationMessage = {
    id: crypto.randomUUID(),
    role: "user",
    content: trimmed,
  };

  const collectedModules: ModuleState[] = [];
  const registerModule = (module: ModuleState) => {
    collectedModules.push(module);
    return renderModuleDisplay(module).node;
  };

  let assistantText = "";
  let assistantNode: ReactNode = (
    <ChatBubble
      role="assistant"
      content="Hang tight, gathering what you asked for…"
      isStreaming
    />
  );

  try {
    const response = await streamUI({
      model: getModel(),
      system: buildSystemPrompt(userName),
      messages: buildModelMessages([...state.transcript, userMessage]),
      text: ({ content, done }) => {
        assistantText = content;
        return (
          <ChatBubble
            role="assistant"
            content={content || "Working on it…"}
            isStreaming={!done}
          />
        );
      },
      tools: {
        searchProducts: {
          description: "Search for food products by name, brand, or barcode.",
          inputSchema: z.object({
            query: z.string().min(2, "Provide at least two characters"),
          }),
          generate: async ({ query }) => {
            const module = createModuleState("lookupResults", { query });
            return registerModule(module);
          },
        },
        getProductDetails: {
          description:
            "Fetch detailed allergen and report info for a product.",
          inputSchema: z.object({
            productId: z.string().uuid(),
          }),
          generate: async ({ productId }) => {
            const detail = await caller.product.detail({ id: productId });
            if (!detail) {
              return (
                <ChatBubble
                  role="assistant"
                  content="I couldn't find that product in the database."
                />
              );
            }
            await ensureProductSummary(productId).catch(() => null);
            const module = createModuleState("productSummary", {
              productId,
            });
            return registerModule(module);
          },
        },
        getUserAllergens: {
          description: "Show or edit the current user's allergen preferences.",
          inputSchema: z.object({}),
          generate: async () => {
            if (!session?.user.id) {
              return (
                <ChatBubble
                  role="assistant"
                  content="Sign in to edit your allergen profile."
                />
              );
            }
            const module = createModuleState("allergenPreferences");
            return registerModule(module);
          },
        },
        showReportForm: {
          description:
            "Open the allergy reaction report form, optionally scoped to a product.",
          inputSchema: z.object({
            productId: z.string().uuid().optional(),
          }),
          generate: async ({ productId }) => {
            const module = createModuleState("reportForm", {
              productId,
            });
            return registerModule(module);
          },
        },
        showRecentReports: {
          description:
            "Surface recent allergy reports. Use 'latest' for community, 'mine' for the user.",
          inputSchema: z.object({
            scope: z.enum(["latest", "mine"]).default("latest"),
          }),
          generate: async ({ scope }) => {
            const module = createModuleState("recentReports", { scope });
            return registerModule(module);
          },
        },
      },
    });
    assistantNode = response.value;
  } catch (error) {
    console.error("continueConversation error", error);
    assistantText =
      assistantText ||
      "I ran into a snag reaching the AI service. Try again in a few seconds.";
    assistantNode = <ChatBubble role="assistant" content={assistantText} />;
  }

  const assistantMessage: ConversationMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    content:
      assistantText ||
      "I pinned those tools for you—let me know what else you need.",
  };

  const nextModules = applyModuleMutations(state.modules, collectedModules);
  const nextTranscript = [...state.transcript, userMessage, assistantMessage];

  aiState.done({
    transcript: nextTranscript,
    modules: nextModules,
    log: [
      ...state.log,
      {
        id: assistantMessage.id,
        prompt: trimmed,
        modules: nextModules.map((module) => module.block.component),
        timestamp: Date.now(),
      },
    ].slice(-30),
  });

  const historicalMessages = state.transcript.map(renderMessageFromData);

  return {
    messages: [
      ...historicalMessages,
      renderMessageFromData(userMessage),
      {
        id: assistantMessage.id,
        role: "assistant",
        node: assistantNode,
      },
    ],
    modules: nextModules.map(renderModuleDisplay),
  };
}

export async function dismissModule({
  moduleId,
}: {
  readonly moduleId: string;
}): Promise<CanvasUIState> {
  const aiState = getMutableAIState();
  const state = aiState.get() as CanvasAIState;
  if (!state.modules.some((module) => module.id === moduleId)) {
    return deriveUIState(state);
  }
  const filtered = state.modules.filter((module) => module.id !== moduleId);
  aiState.done({
    ...state,
    modules: filtered,
  });
  return {
    messages: state.transcript.map(renderMessageFromData),
    modules: filtered.map(renderModuleDisplay),
  };
}

