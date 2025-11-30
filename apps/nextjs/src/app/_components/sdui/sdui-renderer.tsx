"use client";

import { Fragment, useEffect, useMemo, useRef } from "react";

import { Text } from "@acme/ui";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";

import type { CanvasLayoutProps, SduiScreen } from "~/types/sdui";
import {
  CanvasRenderer,
  renderComponent,
  SectionRenderer,
} from "./components/registry";
import { OverlayProvider, SduiProvider } from "./sdui-context";

// =============================================================================
// Props Types
// =============================================================================

interface OverlayProps {
  readonly inputValue: string;
  readonly isSending: boolean;
  readonly onInputChange: (value: string) => void;
  readonly onSendPrompt: (prompt: string) => Promise<void> | void;
}

interface SduiRendererProps extends OverlayProps {
  readonly screen: SduiScreen;
  readonly onActionError?: (message: string) => void;
  readonly onActionInvoke?: (
    actionId: string,
    elementId: string,
  ) => Promise<void>;
}

// =============================================================================
// Main Renderer
// =============================================================================

export function SduiRenderer({
  screen,
  inputValue,
  onInputChange,
  onSendPrompt,
  isSending,
  onActionError,
  onActionInvoke,
}: SduiRendererProps) {
  const layoutProps = (screen.layoutProps ?? {}) as CanvasLayoutProps;
  const overlay = layoutProps.overlay;

  const overlayNode = useMemo(
    () =>
      overlay ? (
        <CanvasOverlay
          overlay={overlay}
          inputValue={inputValue}
          onInputChange={onInputChange}
          onSendPrompt={onSendPrompt}
          isSending={isSending}
        />
      ) : null,
    [overlay, inputValue, onInputChange, onSendPrompt, isSending],
  );

  return (
    <SduiProvider
      screen={screen}
      onActionError={onActionError}
      onActionInvoke={onActionInvoke}
    >
      <OverlayProvider
        inputValue={inputValue}
        isSending={isSending}
        onInputChange={onInputChange}
        onSendPrompt={onSendPrompt}
      >
        <CanvasRenderer layoutProps={layoutProps} overlay={overlayNode}>
          {screen.sections.map((section) => (
            <Fragment key={section.id}>
              <SectionRenderer section={section} />
            </Fragment>
          ))}
        </CanvasRenderer>
      </OverlayProvider>
    </SduiProvider>
  );
}

// =============================================================================
// Canvas Overlay Component
// =============================================================================

interface CanvasOverlayProps extends OverlayProps {
  readonly overlay: {
    readonly type: "chat-input";
    readonly placeholder?: string;
    readonly helperText?: string;
    readonly quickActions?: readonly {
      readonly id: string;
      readonly label: string;
      readonly prompt: string;
    }[];
  };
}

function CanvasOverlay({
  overlay,
  inputValue,
  onInputChange,
  onSendPrompt,
  isSending,
}: CanvasOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus management: auto-focus input when not sending
  useEffect(() => {
    if (!isSending && inputRef.current) {
      // Small delay to avoid focus race conditions
      const timeoutId = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isSending]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inputValue.trim()) {
      await onSendPrompt(inputValue);
    }
  };

  const handleQuickAction = async (prompt: string) => {
    onInputChange(prompt);
    await onSendPrompt(prompt);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Escape to blur input
    if (event.key === "Escape") {
      inputRef.current?.blur();
    }
  };

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
      <Input
        ref={inputRef}
        placeholder={overlay.placeholder ?? "Describe what you want to see…"}
        value={inputValue}
        onChange={(event) => onInputChange(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isSending}
        className="bg-background/80"
        aria-label="Chat input"
      />
      {overlay.helperText ? (
        <Text tone="muted" size="sm">
          {overlay.helperText}
        </Text>
      ) : null}
      {overlay.quickActions && overlay.quickActions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {overlay.quickActions.map((action) => (
            <Button
              key={action.id}
              type="button"
              variant="ghost"
              size="sm"
              disabled={isSending}
              onClick={() => void handleQuickAction(action.prompt)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSending || !inputValue.trim()}>
          {isSending ? "Thinking…" : "Send"}
        </Button>
      </div>
    </form>
  );
}

// =============================================================================
// Re-export for convenience
// =============================================================================

export { renderComponent };
export type { SduiRendererProps };
