import type { ReactNode } from "react";

import type { AgentBlock } from "~/app/_lib/agent-schema";

type AgentComponentBlock = Extract<AgentBlock, { kind: "component" }>;

type ModuleSlot = "workbench" | "sidebar";

interface DisplayMessage {
  readonly id: string;
  readonly role: "assistant" | "user";
  readonly node: ReactNode;
}

interface ModuleDisplay {
  readonly id: string;
  readonly component: AgentComponentBlock["component"];
  readonly slot: ModuleSlot;
  readonly title: string;
  readonly node: ReactNode;
}

export interface CanvasUIState {
  readonly messages: DisplayMessage[];
  readonly modules: ModuleDisplay[];
}

export type { GenerativeAIType } from "./generative-ai";

