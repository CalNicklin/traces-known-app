import { randomUUID } from "crypto";

import type {
  SduiAction,
  SduiComponent,
  SduiScreen,
  SduiSection,
} from "~/types/sdui";

// Runtime imports for schema builders (values, not types)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { buildScreen, buildSection } = require("@acme/api/sdui-schema") as {
  buildScreen: (input: SduiScreenInput) => SduiScreen;
  buildSection: (input: SduiSectionInput) => SduiSection;
};

// Input types for the builder functions (allow mutable for input)
interface SduiScreenInput {
  id: string;
  version: "2025-01";
  title?: string;
  description?: string;
  layout?: "canvas" | "modal" | "drawer";
  layoutProps?: {
    tone?: string;
    padding?: string;
    width?: string;
    fullscreen?: boolean;
    scrollable?: boolean;
    overlayPlacement?: string;
    overlayWidth?: string;
    overlay?: {
      type: "chat-input";
      placeholder?: string;
      helperText?: string;
      quickActions?: { id: string; label: string; prompt: string }[];
    };
  };
  sections: SduiSectionInput[];
  actions?: {
    id: string;
    label: string;
    variant?: string;
    icon?: string;
    hotkey?: string;
    disabled?: boolean;
    invocation:
      | { type: "trpc"; procedure: string; input?: Record<string, unknown> }
      | { type: "navigate"; path: string; params?: Record<string, string> }
      | { type: "prompt"; text: string }
      | {
          type: "url";
          url: string;
          method?: string;
          headers?: Record<string, string>;
          body?: Record<string, unknown>;
        };
    analytics?: { surface?: string; feature?: string };
  }[];
  dataRequirements?: {
    id: string;
    procedure: string;
    input?: Record<string, unknown>;
    staleTime?: number;
    refetchOnWindowFocus?: boolean;
  }[];
  metadata?: Record<string, unknown>;
}

interface SduiSectionInput {
  id: string;
  tone?: "default" | "muted" | "contrast" | "accent";
  background?: "transparent" | "surface" | "panel" | "glass";
  padding?: string;
  gap?: string;
  width?: string;
  border?: string;
  header?: {
    kicker?: string;
    title?: string;
    description?: string;
    align?: "start" | "center" | "end";
  };
  components: SduiComponent[];
  actions?: string[];
  dataSource?: string;
  analyticsId?: string;
}

// =============================================================================
// Helpers
// =============================================================================

const id = () => randomUUID();

interface QuickAction {
  readonly id: string;
  readonly label: string;
  readonly prompt: string;
}

const defaultQuickActions: readonly QuickAction[] = [
  {
    id: "qa-search",
    label: "Find a product",
    prompt: "Search for gluten-free oat milk products",
  },
  {
    id: "qa-allergens",
    label: "Show my allergens",
    prompt: "Display my allergen preferences on the canvas",
  },
  {
    id: "qa-report",
    label: "Report a reaction",
    prompt: "Open the reaction report form",
  },
];

// =============================================================================
// Component Builders
// =============================================================================

const makeStack = (
  children: SduiComponent[],
  props: Partial<{ gap: string; padding: string; align: string }> = {},
): SduiComponent => ({
  id: id(),
  type: "stack",
  props: {
    gap: props.gap ?? "md",
    padding: props.padding ?? "none",
    align: props.align ?? "stretch",
  },
  children,
});

const makeCard = (
  children: SduiComponent[],
  props: Partial<{ tone: string; padding: string; interactive: boolean }> = {},
): SduiComponent => ({
  id: id(),
  type: "card",
  props: {
    tone: props.tone ?? "plain",
    padding: props.padding ?? "md",
    interactive: props.interactive ?? false,
  },
  children,
});

const makeInline = (
  children: SduiComponent[],
  props: Partial<{ gap: string; align: string; wrap: boolean }> = {},
): SduiComponent => ({
  id: id(),
  type: "inline",
  props: {
    gap: props.gap ?? "sm",
    align: props.align ?? "center",
    wrap: props.wrap ?? false,
  },
  children,
});

const makeGrid = (
  children: SduiComponent[],
  props: Partial<{ columns: number; mdColumns: number; gap: string }> = {},
): SduiComponent => ({
  id: id(),
  type: "grid",
  props: {
    columns: props.columns ?? 1,
    mdColumns: props.mdColumns,
    gap: props.gap ?? "md",
  },
  children,
});

const makeHeading = (
  text: string,
  props: Partial<{ level: string; tone: string }> = {},
): SduiComponent => ({
  id: id(),
  type: "heading",
  props: {
    text,
    level: props.level ?? "3",
    tone: props.tone ?? "default",
  },
});

const makeText = (
  text: string,
  props: Partial<{ size: string; tone: string; emphasis: string }> = {},
): SduiComponent => ({
  id: id(),
  type: "text",
  props: {
    text,
    size: props.size ?? "md",
    tone: props.tone ?? "default",
    emphasis: props.emphasis ?? "none",
  },
});

const _makeKicker = (text: string): SduiComponent => ({
  id: id(),
  type: "kicker",
  props: { text },
});

const makeStat = (
  label: string,
  value: string,
  props: Partial<{ trend: string; trendLabel: string; size: string }> = {},
): SduiComponent => ({
  id: id(),
  type: "stat",
  props: {
    label,
    value,
    trend: props.trend,
    trendLabel: props.trendLabel,
    size: props.size ?? "md",
  },
});

const makeBadge = (
  text: string,
  props: Partial<{ tone: string }> = {},
): SduiComponent => ({
  id: id(),
  type: "badge",
  props: {
    text,
    tone: props.tone ?? "default",
  },
});

const _makeButton = (
  label: string,
  actionId: string,
  props: Partial<{ variant: string; size: string }> = {},
): SduiComponent => ({
  id: id(),
  type: "button",
  props: {
    label,
    actionId,
    variant: props.variant ?? "secondary",
    size: props.size ?? "md",
  },
});

const _makeDivider = (): SduiComponent => ({
  id: id(),
  type: "divider",
  props: { variant: "solid" },
});

const _makeRichText = (
  nodes: {
    type: string;
    text?: string;
    spans?: { text: string; marks?: string[] }[];
  }[],
): SduiComponent => ({
  id: id(),
  type: "richText",
  props: { nodes, spacing: "normal" },
});

// =============================================================================
// Section Builders
// =============================================================================

export interface ComposeScreenArgs {
  readonly userName: string;
  readonly prompt: string;
  readonly assistantText?: string | null;
  readonly sections?: readonly SduiSection[];
  readonly quickActions?: readonly QuickAction[];
  readonly actions?: readonly SduiAction[];
}

export const composeSduiScreen = ({
  userName,
  prompt,
  assistantText,
  sections = [],
  quickActions,
  actions,
}: ComposeScreenArgs): SduiScreen => {
  const hero = buildNarrativeSection({
    userName,
    prompt,
    assistantText: assistantText ?? undefined,
  });

  const bodySections =
    sections.length > 0 ? [...sections] : [buildEmptyStateSection({ prompt })];

  return buildScreen({
    id: id(),
    version: "2025-01",
    title: "Agent canvas",
    description: assistantText ?? "Immersive agent workspace",
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
        placeholder: "Ask the agent to reshape the canvas…",
        helperText: "Shift + Enter to add a newline",
        quickActions: quickActions?.length
          ? [...quickActions]
          : [...defaultQuickActions],
      },
    },
    sections: [hero, ...bodySections],
    actions: actions ? [...actions] : [],
    dataRequirements: [],
  });
};

export const buildNarrativeSection = ({
  userName,
  prompt: _prompt,
  assistantText,
}: {
  readonly userName: string;
  readonly prompt: string;
  readonly assistantText?: string;
}): SduiSection => {
  const trimmedAssistant = assistantText?.trim();
  const hasResponse = trimmedAssistant && trimmedAssistant.length > 0;

  // Only show the response text once - in the body, not repeated in header
  const title = `Hi ${userName}, let's explore`;

  const bodyText = hasResponse
    ? trimmedAssistant
    : `I'm ready whenever you are, ${userName}. Ask for products, reports, or anything else.`;

  return buildSection({
    id: id(),
    tone: "default",
    background: "transparent",
    padding: "lg",
    gap: "md",
    width: "default",
    border: "none",
    header: {
      kicker: "Traces Known agent",
      title,
      align: "start",
    },
    components: [makeText(bodyText, { size: "md" })],
  });
};

export const buildEmptyStateSection = ({
  prompt,
}: {
  readonly prompt: string;
}): SduiSection =>
  buildSection({
    id: id(),
    tone: "muted",
    background: "surface",
    padding: "lg",
    gap: "md",
    width: "default",
    border: "soft",
    header: {
      kicker: "Waiting for instructions",
      title: "What should we surface next?",
      description:
        "Use the floating input to ask for product searches, allergen summaries, or new reports.",
      align: "start",
    },
    components: [
      makeStack([
        makeText(
          "Nothing has been rendered yet. Ask the agent for search results or insights to populate the canvas.",
          { tone: "muted" },
        ),
        makeText(`Last prompt: ${prompt}`, { tone: "muted", size: "sm" }),
      ]),
    ],
  });

// =============================================================================
// Feature-Specific Section Builders
// =============================================================================

export interface SearchResultCard {
  readonly id: string;
  readonly name: string;
  readonly brand?: string | null;
  readonly barcode?: string | null;
}

export const buildSearchResultsSection = ({
  query,
  results,
}: {
  readonly query: string;
  readonly results: readonly SearchResultCard[];
}): SduiSection => {
  const components: SduiComponent[] =
    results.length === 0
      ? [
          makeText(
            `No matches for "${query}". Try another brand name or barcode.`,
            { tone: "muted" },
          ),
        ]
      : [
          makeGrid(
            results.map((product) =>
              makeCard(
                [
                  makeHeading(product.name, { level: "5" }),
                  makeText(product.brand ?? "Unknown brand", {
                    tone: "muted",
                    size: "sm",
                  }),
                  ...(product.barcode
                    ? [
                        makeText(`Barcode: ${product.barcode}`, {
                          tone: "muted",
                          size: "xs",
                        }),
                      ]
                    : []),
                ],
                { interactive: true },
              ),
            ),
            { columns: 1, mdColumns: 2, gap: "md" },
          ),
        ];

  return buildSection({
    id: id(),
    tone: "default",
    background: "surface",
    padding: "lg",
    gap: "md",
    width: "default",
    border: "soft",
    header: {
      kicker: "Search results",
      title: `Matches for "${query}"`,
      description: `${results.length} product${results.length === 1 ? "" : "s"} found`,
      align: "start",
    },
    components,
  });
};

export interface ProductInsight {
  readonly name: string;
  readonly brand?: string | null;
  readonly allergenWarning?: string | null;
  readonly riskLevel?: string | null;
  readonly totalReports?: number;
  readonly lastReportedAt?: string | null;
}

export const buildProductInsightSection = ({
  product,
}: {
  readonly product: ProductInsight;
}): SduiSection => {
  const stats: SduiComponent[] = [];

  if (product.totalReports !== undefined) {
    stats.push(
      makeStat("Reports", String(product.totalReports), {
        trend: product.totalReports > 10 ? "up" : "neutral",
      }),
    );
  }

  if (product.riskLevel) {
    stats.push(
      makeStat("Risk Level", product.riskLevel, {
        trend:
          product.riskLevel === "HIGH"
            ? "up"
            : product.riskLevel === "LOW"
              ? "down"
              : "neutral",
      }),
    );
  }

  const components: SduiComponent[] = [
    makeStack([
      makeText(product.brand ?? "Brand not specified", {
        tone: "muted",
        size: "sm",
      }),
      ...(product.allergenWarning
        ? [
            makeCard(
              [
                makeText(product.allergenWarning, {
                  tone: "warning",
                  emphasis: "medium",
                }),
              ],
              { tone: "muted", padding: "sm" },
            ),
          ]
        : []),
      ...(stats.length > 0 ? [makeInline(stats, { gap: "lg" })] : []),
      ...(product.lastReportedAt
        ? [
            makeText(`Last reported ${product.lastReportedAt}`, {
              tone: "muted",
              size: "sm",
            }),
          ]
        : []),
    ]),
  ];

  return buildSection({
    id: id(),
    tone: "default",
    background: "surface",
    padding: "lg",
    gap: "md",
    width: "default",
    border: "soft",
    header: {
      kicker: "Product insight",
      title: product.name,
      align: "start",
    },
    components,
  });
};

export const buildAllergenSection = ({
  allergens,
}: {
  readonly allergens: readonly string[];
}): SduiSection => {
  const components: SduiComponent[] =
    allergens.length > 0
      ? [
          makeInline(
            allergens.map((name) => makeBadge(name, { tone: "accent" })),
            { gap: "sm", wrap: true },
          ),
        ]
      : [makeText("No allergen preferences saved yet.", { tone: "muted" })];

  return buildSection({
    id: id(),
    tone: "default",
    background: "surface",
    padding: "lg",
    gap: "md",
    width: "default",
    border: "soft",
    header: {
      kicker: "Allergen profile",
      title: "Your sensitivities",
      description:
        "Update preferences from settings to improve recommendations.",
      align: "start",
    },
    components,
  });
};

export const buildReportPromptSection = ({
  productName,
}: {
  readonly productName?: string;
}): SduiSection =>
  buildSection({
    id: id(),
    tone: "accent",
    background: "surface",
    padding: "lg",
    gap: "md",
    width: "default",
    border: "soft",
    header: {
      kicker: "Report a reaction",
      title: productName
        ? `Tell us what happened with ${productName}`
        : "Share a recent reaction",
      description:
        "Your reports help other allergy-conscious shoppers stay safe.",
      align: "start",
    },
    components: [
      makeStack([
        makeText(
          'Use the overlay input and say "Open the report form" to log an experience. Include symptoms, allergens, and anything notable.',
        ),
      ]),
    ],
  });

// =============================================================================
// Recent Reports Section
// =============================================================================

export interface RecentReportCard {
  readonly id: string;
  readonly title: string;
  readonly severity: string;
  readonly dateLabel: string;
  readonly comment?: string | null;
}

interface ReportRecord {
  readonly id: string;
  readonly reportDate: Date;
  readonly severity?: string | null;
  readonly comment?: string | null;
  readonly product?: {
    readonly name?: string | null;
  } | null;
}

export const formatRecentReportCards = (
  reports: readonly ReportRecord[],
  formatter: Intl.DateTimeFormat,
): RecentReportCard[] => {
  return reports.map((report) => ({
    id: report.id,
    title: report.product?.name ?? "Untitled product",
    severity: report.severity ?? "UNKNOWN",
    dateLabel: formatter.format(report.reportDate),
    comment: report.comment ?? null,
  }));
};

export const buildRecentReportsSection = ({
  scope,
  reports,
  registerAction,
  sectionId,
}: {
  readonly scope: "latest" | "mine";
  readonly reports: readonly RecentReportCard[];
  readonly registerAction?: (action: SduiAction) => void;
  readonly sectionId?: string;
}): SduiSection => {
  const subtitle =
    scope === "mine"
      ? "Most recent reactions you logged"
      : "Latest reactions from the community";

  const components: SduiComponent[] =
    reports.length > 0
      ? [
          makeStack(
            reports.map((report) =>
              makeCard(
                [
                  makeHeading(report.title, { level: "5" }),
                  makeInline([
                    makeBadge(report.severity, {
                      tone: report.severity === "HIGH" ? "danger" : "warning",
                    }),
                    makeText("•", { tone: "muted", size: "sm" }),
                    makeText(report.dateLabel, { tone: "muted", size: "sm" }),
                  ]),
                  ...(report.comment
                    ? [makeText(report.comment, { size: "sm" })]
                    : []),
                ],
                { tone: "subtle" },
              ),
            ),
            { gap: "md" },
          ),
        ]
      : [makeText("No reports yet.", { tone: "muted" })];

  const actionId = `refresh-reports-${scope}`;

  if (registerAction) {
    registerAction({
      id: actionId,
      label: "Refresh",
      variant: "ghost",
      disabled: false,
      invocation: {
        type: "trpc",
        procedure: scope === "mine" ? "report.mine" : "report.latest",
        input: {
          scope,
          limit: 5,
        },
      },
    });
  }

  return buildSection({
    id: sectionId ?? id(),
    tone: "default",
    background: "surface",
    padding: "lg",
    gap: "md",
    width: "default",
    border: "soft",
    header: {
      kicker: "Recent reports",
      title: subtitle,
      align: "start",
    },
    components,
    actions: [actionId],
  });
};
