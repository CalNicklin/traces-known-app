"use client";

import { useEffect, useRef, useState } from "react";

import { Card, CardContent } from "@acme/ui";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { toast } from "@acme/ui/toast";

import type { AgentBlock } from "~/app/_lib/agent-schema";
import { AgentResponseSchema } from "~/app/_lib/agent-schema";

import { AgentBlockRenderer } from "./agent-block-renderer";
import { AgentQuickActions } from "./agent-quick-actions";

interface AgentShellProps {
  userName: string;
}

export function AgentShell({ userName }: AgentShellProps) {
  const initialGreeting: AgentBlock = {
    id: crypto.randomUUID(),
    kind: "text",
    role: "assistant",
    text: `Hey ${userName.split(" ")[0] ?? "there"}! I can look up products, log reactions, and keep your allergen profile in sync. What do you need?`,
  };

  const [blocks, setBlocks] = useState<AgentBlock[]>([initialGreeting]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [blocks]);

  const sendPrompt = async (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      return;
    }

    const userBlock: AgentBlock = {
      id: crypto.randomUUID(),
      kind: "text",
      role: "user",
      text: trimmed,
    };

    const nextBlocks = [...blocks, userBlock];
    setBlocks(nextBlocks);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: trimmed,
          blocks: nextBlocks,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reach the agent");
      }

      const json = await response.json();
      const parsed = AgentResponseSchema.parse(json);
      setBlocks((prev) => [...prev, ...parsed.blocks]);
    } catch (error) {
      console.error(error);
      toast.error("Unable to reach the agent right now. Try again soon.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,280px]">
      <Card className="col-span-1">
        <CardContent className="space-y-6 p-6">
          <div className="flex flex-col gap-4">
            {blocks.map((block) => (
              <AgentBlockRenderer key={block.id} block={block} />
            ))}
            <div ref={bottomRef} />
          </div>

          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void sendPrompt(input);
            }}
          >
            <Input
              placeholder="Ask anything…"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={isSending}
            />
            <Button type="submit" disabled={isSending}>
              {isSending ? "Thinking…" : "Send"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <AgentQuickActions
          onPrompt={(prompt) => void sendPrompt(prompt)}
          disabled={isSending}
        />
      </div>
    </div>
  );
}

