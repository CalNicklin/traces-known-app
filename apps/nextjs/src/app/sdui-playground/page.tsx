"use client";

import { useCallback, useState } from "react";

import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

import type { SduiScreen } from "~/types/sdui";
import { SduiRenderer } from "../_components/sdui/sdui-renderer";

// =============================================================================
// Example Presets
// =============================================================================

const PRESET_CARD_GRID: SduiScreen = {
  id: "preset-card-grid",
  version: "2025-01",
  title: "Card Grid Example",
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
      placeholder: "Modify this layout...",
      quickActions: [],
    },
  },
  sections: [
    {
      id: "hero",
      tone: "default",
      background: "transparent",
      padding: "lg",
      gap: "md",
      width: "default",
      border: "none",
      header: {
        kicker: "Card Grid Preset",
        title: "Product Categories",
        description: "Browse allergen-safe products by category",
        align: "start",
      },
      components: [
        {
          id: "grid-1",
          type: "grid",
          props: {
            columns: 1,
            smColumns: 2,
            lgColumns: 3,
            gap: "lg",
            equalHeight: true,
          },
          children: [
            {
              id: "card-1",
              type: "card",
              props: { tone: "plain", padding: "lg", interactive: true },
              children: [
                {
                  id: "card-1-stack",
                  type: "stack",
                  props: { gap: "sm" },
                  children: [
                    {
                      id: "card-1-heading",
                      type: "heading",
                      props: { text: "Dairy-Free", level: "4" },
                    },
                    {
                      id: "card-1-text",
                      type: "text",
                      props: {
                        text: "Plant-based milks, cheeses, and yogurts",
                        tone: "muted",
                        size: "sm",
                      },
                    },
                    {
                      id: "card-1-badge",
                      type: "badge",
                      props: { text: "142 products", tone: "accent" },
                    },
                  ],
                },
              ],
            },
            {
              id: "card-2",
              type: "card",
              props: { tone: "plain", padding: "lg", interactive: true },
              children: [
                {
                  id: "card-2-stack",
                  type: "stack",
                  props: { gap: "sm" },
                  children: [
                    {
                      id: "card-2-heading",
                      type: "heading",
                      props: { text: "Gluten-Free", level: "4" },
                    },
                    {
                      id: "card-2-text",
                      type: "text",
                      props: {
                        text: "Breads, pastas, and baked goods",
                        tone: "muted",
                        size: "sm",
                      },
                    },
                    {
                      id: "card-2-badge",
                      type: "badge",
                      props: { text: "89 products", tone: "accent" },
                    },
                  ],
                },
              ],
            },
            {
              id: "card-3",
              type: "card",
              props: { tone: "plain", padding: "lg", interactive: true },
              children: [
                {
                  id: "card-3-stack",
                  type: "stack",
                  props: { gap: "sm" },
                  children: [
                    {
                      id: "card-3-heading",
                      type: "heading",
                      props: { text: "Nut-Free", level: "4" },
                    },
                    {
                      id: "card-3-text",
                      type: "text",
                      props: {
                        text: "Snacks and spreads without tree nuts",
                        tone: "muted",
                        size: "sm",
                      },
                    },
                    {
                      id: "card-3-badge",
                      type: "badge",
                      props: { text: "67 products", tone: "accent" },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  actions: [],
  dataRequirements: [],
};

const PRESET_DATA_LIST: SduiScreen = {
  id: "preset-data-list",
  version: "2025-01",
  title: "Data List Example",
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
      placeholder: "Search for products...",
      quickActions: [
        { id: "qa-1", label: "Show all", prompt: "Show all products" },
      ],
    },
  },
  sections: [
    {
      id: "results-section",
      tone: "default",
      background: "surface",
      padding: "lg",
      gap: "md",
      width: "default",
      border: "soft",
      header: {
        kicker: "Search Results",
        title: "Oat Milk Products",
        description: "5 products found matching your query",
        align: "start",
      },
      components: [
        {
          id: "results-stack",
          type: "stack",
          props: { gap: "md" },
          children: [
            {
              id: "item-1",
              type: "card",
              props: { tone: "subtle", padding: "md", interactive: true },
              children: [
                {
                  id: "item-1-inline",
                  type: "inline",
                  props: { gap: "md", align: "center", justify: "between" },
                  children: [
                    {
                      id: "item-1-info",
                      type: "stack",
                      props: { gap: "xs" },
                      children: [
                        {
                          id: "item-1-name",
                          type: "heading",
                          props: { text: "Oatly Barista Edition", level: "5" },
                        },
                        {
                          id: "item-1-brand",
                          type: "text",
                          props: { text: "Oatly", tone: "muted", size: "sm" },
                        },
                      ],
                    },
                    {
                      id: "item-1-badge",
                      type: "badge",
                      props: { text: "Low Risk", tone: "success" },
                    },
                  ],
                },
              ],
            },
            {
              id: "item-2",
              type: "card",
              props: { tone: "subtle", padding: "md", interactive: true },
              children: [
                {
                  id: "item-2-inline",
                  type: "inline",
                  props: { gap: "md", align: "center", justify: "between" },
                  children: [
                    {
                      id: "item-2-info",
                      type: "stack",
                      props: { gap: "xs" },
                      children: [
                        {
                          id: "item-2-name",
                          type: "heading",
                          props: {
                            text: "Planet Oat Extra Creamy",
                            level: "5",
                          },
                        },
                        {
                          id: "item-2-brand",
                          type: "text",
                          props: {
                            text: "Planet Oat",
                            tone: "muted",
                            size: "sm",
                          },
                        },
                      ],
                    },
                    {
                      id: "item-2-badge",
                      type: "badge",
                      props: { text: "Low Risk", tone: "success" },
                    },
                  ],
                },
              ],
            },
            {
              id: "item-3",
              type: "card",
              props: { tone: "subtle", padding: "md", interactive: true },
              children: [
                {
                  id: "item-3-inline",
                  type: "inline",
                  props: { gap: "md", align: "center", justify: "between" },
                  children: [
                    {
                      id: "item-3-info",
                      type: "stack",
                      props: { gap: "xs" },
                      children: [
                        {
                          id: "item-3-name",
                          type: "heading",
                          props: { text: "Chobani Oat Drink", level: "5" },
                        },
                        {
                          id: "item-3-brand",
                          type: "text",
                          props: { text: "Chobani", tone: "muted", size: "sm" },
                        },
                      ],
                    },
                    {
                      id: "item-3-badge",
                      type: "badge",
                      props: { text: "Medium Risk", tone: "warning" },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      actions: ["refresh-results"],
    },
  ],
  actions: [
    {
      id: "refresh-results",
      label: "Refresh",
      variant: "ghost",
      disabled: false,
      invocation: {
        type: "trpc",
        procedure: "product.search",
        input: { query: "oat milk" },
      },
    },
  ],
  dataRequirements: [],
};

const PRESET_STATS_DASHBOARD: SduiScreen = {
  id: "preset-stats-dashboard",
  version: "2025-01",
  title: "Stats Dashboard Example",
  layout: "canvas",
  layoutProps: {
    tone: "dusk",
    padding: "lg",
    width: "wide",
    fullscreen: true,
    scrollable: true,
    overlayPlacement: "bottom-center",
    overlayWidth: "medium",
    overlay: {
      type: "chat-input",
      placeholder: "Ask about your stats...",
      quickActions: [],
    },
  },
  sections: [
    {
      id: "header-section",
      tone: "default",
      background: "transparent",
      padding: "lg",
      gap: "sm",
      width: "default",
      border: "none",
      header: {
        kicker: "Dashboard",
        title: "Your Allergy Insights",
        description: "Overview of your tracked products and reports",
        align: "start",
      },
      components: [
        {
          id: "spacer-1",
          type: "spacer",
          props: { size: "sm" },
        },
      ],
    },
    {
      id: "stats-section",
      tone: "default",
      background: "glass",
      padding: "lg",
      gap: "lg",
      width: "default",
      border: "none",
      components: [
        {
          id: "stats-grid",
          type: "grid",
          props: { columns: 1, smColumns: 2, lgColumns: 4, gap: "lg" },
          children: [
            {
              id: "stat-1",
              type: "card",
              props: { tone: "elevated", padding: "lg" },
              children: [
                {
                  id: "stat-1-content",
                  type: "stat",
                  props: {
                    label: "Products Tracked",
                    value: "47",
                    trend: "up",
                    trendLabel: "+5 this week",
                    size: "lg",
                  },
                },
              ],
            },
            {
              id: "stat-2",
              type: "card",
              props: { tone: "elevated", padding: "lg" },
              children: [
                {
                  id: "stat-2-content",
                  type: "stat",
                  props: {
                    label: "Reports Filed",
                    value: "12",
                    trend: "neutral",
                    trendLabel: "Same as last month",
                    size: "lg",
                  },
                },
              ],
            },
            {
              id: "stat-3",
              type: "card",
              props: { tone: "elevated", padding: "lg" },
              children: [
                {
                  id: "stat-3-content",
                  type: "stat",
                  props: {
                    label: "Safe Products",
                    value: "89%",
                    trend: "up",
                    trendLabel: "+3% improvement",
                    size: "lg",
                  },
                },
              ],
            },
            {
              id: "stat-4",
              type: "card",
              props: { tone: "elevated", padding: "lg" },
              children: [
                {
                  id: "stat-4-content",
                  type: "stat",
                  props: {
                    label: "Allergens Avoided",
                    value: "6",
                    size: "lg",
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "recent-section",
      tone: "muted",
      background: "surface",
      padding: "lg",
      gap: "md",
      width: "default",
      border: "soft",
      header: {
        kicker: "Recent Activity",
        title: "Your Latest Reports",
        align: "start",
      },
      components: [
        {
          id: "recent-stack",
          type: "stack",
          props: { gap: "sm" },
          children: [
            {
              id: "recent-1",
              type: "inline",
              props: { gap: "md", align: "center", justify: "between" },
              children: [
                {
                  id: "recent-1-text",
                  type: "text",
                  props: { text: "Reported reaction to Brand X Cookies" },
                },
                {
                  id: "recent-1-badge",
                  type: "badge",
                  props: { text: "2 days ago", tone: "muted" },
                },
              ],
            },
            { id: "divider-1", type: "divider", props: { variant: "solid" } },
            {
              id: "recent-2",
              type: "inline",
              props: { gap: "md", align: "center", justify: "between" },
              children: [
                {
                  id: "recent-2-text",
                  type: "text",
                  props: { text: "Added Oatly Barista to safe list" },
                },
                {
                  id: "recent-2-badge",
                  type: "badge",
                  props: { text: "5 days ago", tone: "muted" },
                },
              ],
            },
            { id: "divider-2", type: "divider", props: { variant: "solid" } },
            {
              id: "recent-3",
              type: "inline",
              props: { gap: "md", align: "center", justify: "between" },
              children: [
                {
                  id: "recent-3-text",
                  type: "text",
                  props: { text: "Updated allergen preferences" },
                },
                {
                  id: "recent-3-badge",
                  type: "badge",
                  props: { text: "1 week ago", tone: "muted" },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  actions: [],
  dataRequirements: [],
};

const PRESETS = {
  "card-grid": { label: "Card Grid", screen: PRESET_CARD_GRID },
  "data-list": { label: "Data List", screen: PRESET_DATA_LIST },
  "stats-dashboard": {
    label: "Stats Dashboard",
    screen: PRESET_STATS_DASHBOARD,
  },
} as const;

type PresetKey = keyof typeof PRESETS;

// =============================================================================
// Playground Component
// =============================================================================

export default function SduiPlaygroundPage() {
  const [mode, setMode] = useState<"editor" | "preset">("preset");
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>("card-grid");
  const [jsonInput, setJsonInput] = useState("");
  const [currentScreen, setCurrentScreen] = useState<SduiScreen | null>(
    PRESETS["card-grid"].screen,
  );
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    errors?: unknown;
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handlePresetChange = useCallback((preset: PresetKey) => {
    setSelectedPreset(preset);
    setCurrentScreen(PRESETS[preset].screen);
    setJsonInput(JSON.stringify(PRESETS[preset].screen, null, 2));
    setValidationResult(null);
  }, []);

  const handleValidate = useCallback(async () => {
    if (!jsonInput.trim()) {
      toast.error("Please enter some JSON to validate");
      return;
    }

    setIsValidating(true);
    try {
      const parsed = JSON.parse(jsonInput) as unknown;
      const response = await fetch("/api/sdui/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      const result = (await response.json()) as {
        valid: boolean;
        normalized?: SduiScreen;
        errors?: unknown;
      };

      setValidationResult({ valid: result.valid, errors: result.errors });

      if (result.valid && result.normalized) {
        setCurrentScreen(result.normalized);
        toast.success("Valid SDUI schema!");
      } else {
        toast.error("Invalid schema - check errors below");
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        setValidationResult({ valid: false, errors: "Invalid JSON syntax" });
        toast.error("Invalid JSON syntax");
      } else {
        toast.error("Validation failed");
      }
    } finally {
      setIsValidating(false);
    }
  }, [jsonInput]);

  const handleRenderJson = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonInput) as SduiScreen;
      setCurrentScreen(parsed);
      setValidationResult(null);
      toast.success("Rendering JSON...");
    } catch {
      toast.error("Invalid JSON - cannot render");
    }
  }, [jsonInput]);

  const handleSendPrompt = useCallback(async (prompt: string) => {
    setIsSending(true);
    // Simulate agent response - in real app this would call /api/agent
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.info(`Prompt received: ${prompt}`);
    setInputValue("");
    setIsSending(false);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Server-Driven UI
            </div>
            <h1 className="text-xl font-semibold">Playground</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={mode === "preset" ? "primary" : "outline"}
              size="sm"
              onClick={() => setMode("preset")}
            >
              Presets
            </Button>
            <Button
              variant={mode === "editor" ? "primary" : "outline"}
              size="sm"
              onClick={() => {
                setMode("editor");
                if (!jsonInput && currentScreen) {
                  setJsonInput(JSON.stringify(currentScreen, null, 2));
                }
              }}
            >
              JSON Editor
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 flex-shrink-0 overflow-y-auto border-r border-border bg-card p-4">
          {mode === "preset" ? (
            <div className="space-y-4">
              <div>
                <h2 className="mb-2 text-sm font-medium">Example Presets</h2>
                <p className="mb-4 text-xs text-muted-foreground">
                  Select a preset to see how SDUI screens are structured
                </p>
              </div>
              <div className="space-y-2">
                {(
                  Object.entries(PRESETS) as [
                    PresetKey,
                    (typeof PRESETS)[PresetKey],
                  ][]
                ).map(([key, { label }]) => (
                  <Button
                    key={key}
                    variant={selectedPreset === key ? "primary" : "outline"}
                    className="w-full justify-start"
                    onClick={() => handlePresetChange(key)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <div className="border-t border-border pt-4">
                <h3 className="mb-2 text-sm font-medium">Current Schema</h3>
                <pre className="max-h-96 overflow-auto rounded-lg bg-muted p-3 text-xs">
                  {JSON.stringify(currentScreen, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="mb-2 text-sm font-medium">JSON Editor</h2>
                <p className="mb-4 text-xs text-muted-foreground">
                  Paste or write SDUI JSON to render it live
                </p>
              </div>
              <textarea
                className="h-80 w-full resize-none rounded-lg border border-border bg-background p-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder='{"id": "...", "version": "2025-01", "sections": [...]}'
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleValidate}
                  disabled={isValidating}
                >
                  {isValidating ? "Validating..." : "Validate"}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={handleRenderJson}
                >
                  Render
                </Button>
              </div>
              {validationResult && (
                <div
                  className={`rounded-lg p-3 text-xs ${
                    validationResult.valid
                      ? "bg-green-500/10 text-green-600"
                      : "bg-red-500/10 text-red-600"
                  }`}
                >
                  <div className="font-medium">
                    {validationResult.valid ? "✓ Valid" : "✗ Invalid"}
                  </div>
                  {validationResult.errors !== undefined && (
                    <pre className="mt-2 overflow-auto whitespace-pre-wrap">
                      {typeof validationResult.errors === "string"
                        ? validationResult.errors
                        : JSON.stringify(validationResult.errors, null, 2)}
                    </pre>
                  )}
                </div>
              )}
              <div className="border-t border-border pt-4">
                <h3 className="mb-2 text-sm font-medium">Load Preset</h3>
                <div className="flex flex-wrap gap-2">
                  {(
                    Object.entries(PRESETS) as [
                      PresetKey,
                      (typeof PRESETS)[PresetKey],
                    ][]
                  ).map(([key, { label }]) => (
                    <Button
                      key={key}
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setJsonInput(
                          JSON.stringify(PRESETS[key].screen, null, 2),
                        );
                        setValidationResult(null);
                      }}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Preview Area */}
        <main className="flex-1 overflow-auto bg-muted/20">
          {currentScreen ? (
            <SduiRenderer
              screen={currentScreen}
              inputValue={inputValue}
              onInputChange={setInputValue}
              onSendPrompt={handleSendPrompt}
              isSending={isSending}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="text-lg">No screen to render</p>
                <p className="text-sm">
                  Select a preset or paste valid JSON to get started
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
