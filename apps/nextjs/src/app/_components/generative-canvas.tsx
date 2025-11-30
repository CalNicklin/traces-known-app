"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useActions, useUIState } from "@ai-sdk/rsc";

import { Card, CardContent, CardHeader, CardTitle, cn } from "@acme/ui";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { ThemeToggle } from "@acme/ui/theme";
import { toast } from "@acme/ui/toast";

import type {
  CanvasUIState,
  GenerativeAIType,
} from "../_lib/generative-ai-types";
import { AgentQuickActions } from "./agent/agent-quick-actions";

interface GenerativeCanvasProps {
  readonly userName: string;
}

export function GenerativeCanvas({ userName }: GenerativeCanvasProps) {
  const [uiState, setUIState] = useUIState<GenerativeAIType>();
  const actions = useActions<GenerativeAIType>();
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  const workbenchModules = useMemo(
    () => uiState.modules.filter((module) => module.slot === "workbench"),
    [uiState.modules],
  );
  const sidebarModules = useMemo(
    () => uiState.modules.filter((module) => module.slot === "sidebar"),
    [uiState.modules],
  );

  useEffect(() => {
    viewportRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [uiState.messages]);

  const sendPrompt = async (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      return;
    }

    setIsSending(true);
    try {
      const nextState = await actions.continueConversation({ prompt: trimmed });
      setUIState(nextState);
      setInput("");
    } catch (error) {
      console.error(error);
      toast.error("Unable to reach the agent. Try again in a moment.");
    } finally {
      setIsSending(false);
    }
  };

  const dismissModule = async (moduleId: string) => {
    try {
      const nextState = await actions.dismissModule({ moduleId });
      setUIState(nextState);
    } catch (error) {
      console.error(error);
      toast.error("Failed to dismiss module.");
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    void sendPrompt(prompt);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Generative workspace
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome back, {userName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Tell the agent what to surface and it will materialize the right
            panels—no navigation required.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <section className="flex flex-col gap-4">
          <Card className="flex flex-col gap-4 p-6">
            <div className="flex flex-col gap-3">
              {uiState.messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  {message.node}
                </div>
              ))}
            </div>
            <div ref={viewportRef} />
          </Card>

          <form
            className="flex flex-col gap-3 rounded-3xl border bg-background p-4 shadow-sm lg:flex-row lg:items-center"
            onSubmit={(event) => {
              event.preventDefault();
              void sendPrompt(input);
            }}
          >
            <Input
              placeholder="Describe what you want to appear on the canvas…"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={isSending}
              className="flex-1 bg-transparent"
            />
            <Button type="submit" disabled={isSending}>
              {isSending ? "Thinking…" : "Send"}
            </Button>
          </form>

          <AgentQuickActions
            disabled={isSending}
            onPrompt={(prompt) => handleQuickPrompt(prompt)}
          />

          <ModuleSection
            emptyLabel="Modules that need more room will appear here."
            modules={workbenchModules}
            onDismiss={dismissModule}
          />
        </section>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pinned surfaces</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ModuleSection
                modules={sidebarModules}
                onDismiss={dismissModule}
                emptyLabel="Ask for recent reports, allergen preferences, or anything else to fill this column."
                condensed
              />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

interface ModuleSectionProps {
  readonly modules: CanvasUIState["modules"];
  readonly onDismiss: (moduleId: string) => void;
  readonly emptyLabel: string;
  readonly condensed?: boolean;
}

function ModuleSection({
  modules,
  onDismiss,
  emptyLabel,
  condensed = false,
}: ModuleSectionProps) {
  if (modules.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {modules.map((module) => (
        <ModuleCard
          key={module.id}
          module={module}
          onDismiss={() => onDismiss(module.id)}
          condensed={condensed}
        />
      ))}
    </div>
  );
}

interface ModuleCardProps {
  readonly module: CanvasUIState["modules"][number];
  readonly onDismiss: () => void;
  readonly condensed: boolean;
}

function ModuleCard({ module, onDismiss, condensed }: ModuleCardProps) {
  return (
    <div className="rounded-3xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">{module.title}</p>
          <Badge variant="outline" className="mt-1 text-[10px] uppercase">
            {module.component}
          </Badge>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 rounded-full"
          onClick={onDismiss}
        >
          ×
        </Button>
      </div>
      <div className={condensed ? "text-sm" : "space-y-3"}>{module.node}</div>
    </div>
  );
}
