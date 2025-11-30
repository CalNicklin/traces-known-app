import { createAI } from "@ai-sdk/rsc";

import type { CanvasAIState } from "./generative-ai-actions";
import type { CanvasUIState } from "~/app/_lib/generative-ai-types";
import { ChatBubble } from "../_components/generative/chat-bubble";
import { continueConversation, dismissModule } from "./generative-ai-actions";

type ContinueConversationInput = {
  readonly prompt: string;
};

type DismissModuleInput = {
  readonly moduleId: string;
};

type GenerativeActions = {
  continueConversation: (
    input: ContinueConversationInput,
  ) => Promise<CanvasUIState>;
  dismissModule: (input: DismissModuleInput) => Promise<CanvasUIState>;
};

const initialGreeting = {
  id: crypto.randomUUID(),
  role: "assistant" as const,
  content:
    "Hey there! I can look up products, surface risk summaries, and pin tools you need. Tell me what to show and I'll compose the workspace for you.",
};

const initialAIState: CanvasAIState = {
  transcript: [initialGreeting],
  modules: [],
  log: [],
};

const initialUIState: CanvasUIState = {
  messages: [
    {
      id: initialGreeting.id,
      role: initialGreeting.role,
      node: (
        <ChatBubble
          role={initialGreeting.role}
          content={initialGreeting.content}
          isStreaming={false}
        />
      ),
    },
  ],
  modules: [],
};

export const GenerativeAI = createAI<
  CanvasAIState,
  CanvasUIState,
  GenerativeActions
>({
  actions: {
    continueConversation,
    dismissModule,
  },
  initialAIState,
  initialUIState,
});

export type GenerativeAIType = typeof GenerativeAI;
