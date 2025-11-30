"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { toast } from "@acme/ui/toast";

import type { AgentBlock } from "~/app/_lib/agent-schema";
import type { SduiScreen, SduiSection } from "~/types/sdui";
import { AgentResponseSchema } from "~/app/_lib/agent-schema";
import { SduiRenderer } from "./sdui/sdui-renderer";

// Runtime imports for schema builders (values, not types)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { buildScreen, buildSection } = require("@acme/api/sdui-schema") as {
  buildScreen: (input: unknown) => SduiScreen;
  buildSection: (input: unknown) => SduiSection;
};

// =============================================================================
// Props
// =============================================================================

interface GenerativeCanvasProps {
  readonly userName: string;
}

// =============================================================================
// Component
// =============================================================================

export function GenerativeCanvas({ userName }: GenerativeCanvasProps) {
  const [screen, setScreen] = useState<SduiScreen | null>(null);
  const [_blocks, setBlocks] = useState<AgentBlock[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [hasBootstrapped, setHasBootstrapped] = useState(false);

  // ==========================================================================
  // Bootstrap Screen
  // ==========================================================================

  const bootstrapScreen = useMemo<SduiScreen>(() => {
    const firstName = userName.split(" ")[0] ?? "friend";

    return buildScreen({
      id: crypto.randomUUID(),
      version: "2025-01",
      title: "Immersive workspace",
      description: "Agent-driven canvas for allergy-safe product discovery",
      layout: "canvas",
      layoutProps: {
        tone: "neutral",
        padding: "lg",
        width: "wide",
        fullscreen: true,
        scrollable: true,
        overlayPlacement: "bottom-center",
        overlayWidth: "medium",
        overlay: {
          type: "chat-input",
          placeholder: "Describe what should appear on the canvas…",
          helperText: "Shift + Enter for a newline",
          quickActions: [
            {
              id: "qa-default-search",
              label: "Find safe snacks",
              prompt: "Search for gluten-free snacks and show the top results.",
            },
            {
              id: "qa-default-allergens",
              label: "My allergens",
              prompt: "Show my allergen preferences.",
            },
          ],
        },
      },
      sections: [
        buildSection({
          id: crypto.randomUUID(),
          tone: "default",
          background: "surface",
          padding: "lg",
          gap: "md",
          width: "default",
          border: "soft",
          header: {
            kicker: "Immersive workspace",
            title: `Hi ${firstName}, let's explore`,
            description:
              "Ask for product searches, allergen insights, or reports and I'll compose the layout for you.",
            align: "start",
          },
          components: [
            {
              id: crypto.randomUUID(),
              type: "text",
              props: {
                text: "Use the floating input to tell me what to pin on the canvas.",
                tone: "muted",
                size: "md",
              },
            },
          ],
        }),
      ],
      actions: [],
      dataRequirements: [],
    });
  }, [userName]);

  // ==========================================================================
  // Send Prompt
  // ==========================================================================

  const sendPrompt = useCallback(
    async (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed || isSending) {
        return;
      }

      setIsSending(true);
      setInput("");

      // Build blocks synchronously to avoid React state closure issues
      const userBlock: AgentBlock = {
        id: crypto.randomUUID(),
        kind: "text",
        role: "user",
        text: trimmed,
      };

      // Get current blocks and compute next state
      let blocksToSend: AgentBlock[] = [];
      setBlocks((prev) => {
        blocksToSend = [...prev, userBlock].slice(-20);
        return blocksToSend;
      });

      // Wait for state to settle (React 18 automatic batching)
      await new Promise((resolve) => setTimeout(resolve, 0));

      try {
        const response = await fetch("/api/agent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: trimmed,
            blocks: blocksToSend,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to reach agent endpoint");
        }

        const json: unknown = await response.json();
        const parsed = AgentResponseSchema.parse(json);

        setBlocks((prev) => [...prev, ...parsed.blocks].slice(-20));

        if (parsed.view) {
          setScreen(parsed.view);
        }
      } catch (error) {
        console.error(error);
        toast.error(
          "Unable to shape the canvas right now. Please try again shortly.",
        );
      } finally {
        setIsSending(false);
      }
    },
    [isSending],
  );

  // ==========================================================================
  // Bootstrap on Mount
  // ==========================================================================

  useEffect(() => {
    if (hasBootstrapped) {
      return;
    }
    setHasBootstrapped(true);
    void sendPrompt(
      "Introduce yourself and compose a helpful workspace for allergy-safe product discovery.",
    );
  }, [hasBootstrapped, sendPrompt]);

  // ==========================================================================
  // Section Update Handler
  // ==========================================================================

  const handleSectionUpdate = useCallback(
    (sectionId: string, updatedSection: SduiSection) => {
      setScreen((prev) => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          sections: prev.sections.map((section) =>
            section.id === sectionId ? updatedSection : section,
          ),
        };
      });
    },
    [],
  );

  // ==========================================================================
  // Action Handler
  // ==========================================================================

  const handleActionInvoke = useCallback(
    async (actionId: string, elementId: string) => {
      try {
        const response = await fetch("/api/sdui/action", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            actionId,
            elementId,
          }),
        });

        if (!response.ok) {
          throw new Error(`Action failed: ${response.statusText}`);
        }

        const payload = (await response.json()) as {
          readonly section?: SduiSection;
        };

        if (payload.section) {
          handleSectionUpdate(elementId, payload.section);
        }
      } catch (error) {
        console.error("Action error:", error);
        throw error;
      }
    },
    [handleSectionUpdate],
  );

  // ==========================================================================
  // Render
  // ==========================================================================

  const activeScreen = screen ?? bootstrapScreen;

  return (
    <SduiRenderer
      screen={activeScreen}
      inputValue={input}
      onInputChange={setInput}
      onSendPrompt={sendPrompt}
      isSending={isSending}
      onActionInvoke={handleActionInvoke}
      onActionError={(message) => toast.error(message)}
    />
  );
}
