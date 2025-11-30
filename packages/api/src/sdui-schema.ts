/**
 * SDUI Schema v2025-01
 *
 * Revolutionary redesign inspired by Airbnb's Server-Driven UI system.
 * Follows a Screen → Section → Component model with declarative data binding.
 *
 * Key concepts:
 * - Screen: Top-level envelope containing layout, sections, actions, and data requirements
 * - Section: Semantic grouping of components with optional header
 * - Component: UI primitive with props, optional data binding, and children
 * - DataRequirement: Declares tRPC procedures the client should fetch
 * - PropBindings: Maps component props to data paths (JSONPath-like)
 */

import { z } from "zod/v4";

// =============================================================================
// Shared Enums & Primitives
// =============================================================================

const spaceScaleEnum = z.enum(["none", "xs", "sm", "md", "lg", "xl"]);
const alignEnum = z.enum(["start", "center", "end", "stretch"]);
const justifyEnum = z.enum(["start", "center", "end", "between"]);
const toneEnum = z.enum([
  "default",
  "muted",
  "accent",
  "success",
  "warning",
  "danger",
]);
const sizeEnum = z.enum(["xs", "sm", "md", "lg", "xl"]);

// =============================================================================
// Action Schema (view-level, referenced by ID)
// =============================================================================

const actionInvocationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("trpc"),
    procedure: z.string().min(1),
    input: z.record(z.string(), z.unknown()).optional(),
  }),
  z.object({
    type: z.literal("url"),
    url: z.string().url(),
    method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).default("POST"),
    headers: z.record(z.string(), z.string()).optional(),
    body: z.record(z.string(), z.unknown()).optional(),
  }),
  z.object({
    type: z.literal("navigate"),
    path: z.string().min(1),
    params: z.record(z.string(), z.string()).optional(),
  }),
  z.object({
    type: z.literal("prompt"),
    text: z.string().min(1),
  }),
]);

const actionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  variant: z
    .enum(["primary", "secondary", "ghost", "link", "destructive"])
    .default("secondary"),
  icon: z.string().optional(),
  hotkey: z.string().optional(),
  disabled: z.boolean().default(false),
  invocation: actionInvocationSchema,
  analytics: z
    .object({
      surface: z.string().optional(),
      feature: z.string().optional(),
    })
    .optional(),
});

// =============================================================================
// Data Requirement Schema
// =============================================================================

const dataRequirementSchema = z.object({
  id: z.string().min(1),
  procedure: z.string().min(1),
  input: z.record(z.string(), z.unknown()).optional(),
  staleTime: z.number().int().min(0).default(30000),
  refetchOnWindowFocus: z.boolean().default(false),
});

// =============================================================================
// Component Types & Props
// =============================================================================

/**
 * Closed set of component types the renderer knows about.
 * Each type has specific props defined below.
 */
const componentTypeEnum = z.enum([
  // Layout
  "stack",
  "inline",
  "grid",
  "card",
  "split",
  // Typography
  "heading",
  "text",
  "richText",
  "kicker",
  // Data-driven
  "list",
  "stat",
  "statGroup",
  "badge",
  // Media
  "image",
  "icon",
  // Interactive
  "button",
  "buttonGroup",
  "skeleton",
  // Form
  "form",
  "formField",
  "textInput",
  "textarea",
  "select",
  "checkbox",
  "radio",
  "dateInput",
  "fileUpload",
  "rating",
  "slider",
  // Utility
  "divider",
  "spacer",
]);

// Layout component props
const stackPropsSchema = z.object({
  gap: spaceScaleEnum.default("md"),
  padding: spaceScaleEnum.default("none"),
  align: alignEnum.default("stretch"),
  justify: justifyEnum.default("start"),
  fullHeight: z.boolean().default(false),
});

const inlinePropsSchema = z.object({
  gap: spaceScaleEnum.default("sm"),
  align: alignEnum.default("center"),
  justify: justifyEnum.default("start"),
  wrap: z.boolean().default(false),
});

const gridPropsSchema = z.object({
  columns: z.number().int().min(1).max(12).default(1),
  smColumns: z.number().int().min(1).max(12).optional(),
  mdColumns: z.number().int().min(1).max(12).optional(),
  lgColumns: z.number().int().min(1).max(12).optional(),
  gap: spaceScaleEnum.default("md"),
  equalHeight: z.boolean().default(false),
});

const cardPropsSchema = z.object({
  tone: z
    .enum(["plain", "muted", "accent", "elevated", "subtle"])
    .default("plain"),
  padding: spaceScaleEnum.default("md"),
  interactive: z.boolean().default(false),
  bordered: z.boolean().default(true),
});

const splitPropsSchema = z.object({
  ratio: z
    .enum(["1:1", "2:1", "1:2", "3:2", "2:3", "3:1", "1:3"])
    .default("1:1"),
  stackBelow: z.enum(["sm", "md", "lg", "xl", "never"]).default("md"),
  gap: spaceScaleEnum.default("md"),
  align: alignEnum.default("stretch"),
});

// Typography component props
const headingPropsSchema = z.object({
  text: z.string(),
  level: z.enum(["display", "1", "2", "3", "4", "5", "6"]).default("3"),
  tone: z.enum(["default", "muted", "accent"]).default("default"),
  align: z.enum(["start", "center", "end"]).default("start"),
  weight: z.enum(["light", "normal", "medium", "semibold", "bold"]).optional(),
});

const textPropsSchema = z.object({
  text: z.string(),
  size: sizeEnum.default("md"),
  tone: toneEnum.default("default"),
  emphasis: z.enum(["none", "medium", "strong"]).default("none"),
  align: z.enum(["start", "center", "end", "justify"]).default("start"),
  clampLines: z.number().int().min(1).max(10).optional(),
});

const richTextMarkEnum = z.enum([
  "bold",
  "italic",
  "underline",
  "code",
  "subtle",
  "link",
]);

const richTextSpanSchema = z.object({
  text: z.string(),
  marks: z.array(richTextMarkEnum).default([]),
  href: z.string().url().optional(),
});

const richTextParagraphSchema = z.object({
  type: z.literal("paragraph"),
  spans: z.array(richTextSpanSchema).min(1),
  align: z.enum(["start", "center", "end", "justify"]).optional(),
});

const richTextHeadingSchema = z.object({
  type: z.literal("heading"),
  text: z.string(),
  level: z.enum(["1", "2", "3", "4", "5", "6"]).default("3"),
});

const richTextListSchema = z.object({
  type: z.literal("list"),
  ordered: z.boolean().default(false),
  items: z.array(z.string()).min(1),
});

const richTextQuoteSchema = z.object({
  type: z.literal("quote"),
  text: z.string(),
  attribution: z.string().optional(),
});

const richTextDividerSchema = z.object({
  type: z.literal("divider"),
});

const richTextNodeSchema = z.discriminatedUnion("type", [
  richTextParagraphSchema,
  richTextHeadingSchema,
  richTextListSchema,
  richTextQuoteSchema,
  richTextDividerSchema,
]);

const richTextPropsSchema = z.object({
  nodes: z.array(richTextNodeSchema).min(1),
  spacing: z.enum(["compact", "normal", "loose"]).default("normal"),
});

const kickerPropsSchema = z.object({
  text: z.string(),
  tone: z.enum(["default", "muted", "accent"]).default("muted"),
});

// Data-driven component props
const listPropsSchema = z.object({
  emptyText: z.string().default("No items"),
  orientation: z.enum(["vertical", "horizontal"]).default("vertical"),
  gap: spaceScaleEnum.default("md"),
});

const statPropsSchema = z.object({
  label: z.string(),
  value: z.string(),
  previousValue: z.string().optional(),
  trend: z.enum(["up", "down", "neutral"]).optional(),
  trendLabel: z.string().optional(),
  size: z.enum(["sm", "md", "lg"]).default("md"),
});

const statGroupPropsSchema = z.object({
  orientation: z.enum(["horizontal", "vertical"]).default("horizontal"),
  gap: spaceScaleEnum.default("lg"),
});

const badgePropsSchema = z.object({
  text: z.string(),
  tone: toneEnum.default("default"),
  size: z.enum(["sm", "md"]).default("sm"),
});

// Media component props
const imagePropsSchema = z.object({
  src: z.string(),
  alt: z.string(),
  aspect: z.enum(["auto", "square", "video", "wide"]).default("auto"),
  fit: z.enum(["cover", "contain", "fill"]).default("cover"),
  rounded: z.boolean().default(false),
});

const iconPropsSchema = z.object({
  name: z.string(),
  size: sizeEnum.default("md"),
  tone: toneEnum.default("default"),
});

// Interactive component props
const buttonPropsSchema = z.object({
  label: z.string(),
  actionId: z.string().optional(),
  variant: z
    .enum(["primary", "secondary", "ghost", "link", "destructive"])
    .default("secondary"),
  size: z.enum(["sm", "md", "lg"]).default("md"),
  icon: z.string().optional(),
  iconPosition: z.enum(["start", "end"]).default("start"),
  fullWidth: z.boolean().default(false),
});

const buttonGroupPropsSchema = z.object({
  orientation: z.enum(["horizontal", "vertical"]).default("horizontal"),
  gap: spaceScaleEnum.default("sm"),
});

const skeletonPropsSchema = z.object({
  variant: z.enum(["text", "heading", "card", "image", "stat"]).default("text"),
  lines: z.number().int().min(1).max(10).default(1),
});

// Form component props
const selectOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  disabled: z.boolean().optional(),
});

const formPropsSchema = z.object({
  actionId: z.string().min(1),
  submitLabel: z.string().default("Submit"),
  resetLabel: z.string().optional(),
  submitVariant: z
    .enum(["primary", "secondary", "ghost", "link", "destructive"])
    .default("primary"),
  orientation: z.enum(["vertical", "horizontal"]).default("vertical"),
  gap: spaceScaleEnum.default("md"),
});

const formFieldPropsSchema = z.object({
  name: z.string().min(1),
  label: z.string(),
  hint: z.string().optional(),
  required: z.boolean().default(false),
  error: z.string().optional(),
});

const textInputPropsSchema = z.object({
  name: z.string().min(1),
  placeholder: z.string().optional(),
  inputType: z
    .enum(["text", "email", "password", "number", "tel", "url"])
    .default("text"),
  defaultValue: z.string().optional(),
  disabled: z.boolean().default(false),
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(1).optional(),
});

const textareaPropsSchema = z.object({
  name: z.string().min(1),
  placeholder: z.string().optional(),
  rows: z.number().int().min(2).max(20).default(4),
  defaultValue: z.string().optional(),
  disabled: z.boolean().default(false),
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(1).optional(),
});

const selectPropsSchema = z.object({
  name: z.string().min(1),
  placeholder: z.string().optional(),
  options: z.array(selectOptionSchema).min(1),
  defaultValue: z.string().optional(),
  disabled: z.boolean().default(false),
});

const checkboxPropsSchema = z.object({
  name: z.string().min(1),
  label: z.string(),
  defaultChecked: z.boolean().default(false),
  disabled: z.boolean().default(false),
});

const radioPropsSchema = z.object({
  name: z.string().min(1),
  options: z.array(selectOptionSchema).min(1),
  defaultValue: z.string().optional(),
  disabled: z.boolean().default(false),
  orientation: z.enum(["horizontal", "vertical"]).default("vertical"),
});

const dateInputPropsSchema = z.object({
  name: z.string().min(1),
  placeholder: z.string().optional(),
  minDate: z.string().optional(),
  maxDate: z.string().optional(),
  defaultValue: z.string().optional(),
  disabled: z.boolean().default(false),
});

const fileUploadPropsSchema = z.object({
  name: z.string().min(1),
  accept: z.string().optional(),
  multiple: z.boolean().default(false),
  maxSize: z.number().int().min(1).optional(),
  maxFiles: z.number().int().min(1).default(1),
  disabled: z.boolean().default(false),
});

const ratingPropsSchema = z.object({
  name: z.string().min(1),
  max: z.number().int().min(3).max(10).default(5),
  defaultValue: z.number().int().optional(),
  disabled: z.boolean().default(false),
  size: z.enum(["sm", "md", "lg"]).default("md"),
});

const sliderPropsSchema = z.object({
  name: z.string().min(1),
  min: z.number().default(0),
  max: z.number().default(100),
  step: z.number().default(1),
  defaultValue: z.number().optional(),
  disabled: z.boolean().default(false),
  showValue: z.boolean().default(true),
});

// Utility component props
const dividerPropsSchema = z.object({
  variant: z.enum(["solid", "dashed", "glow"]).default("solid"),
  spacing: spaceScaleEnum.default("md"),
});

const spacerPropsSchema = z.object({
  size: spaceScaleEnum.default("md"),
});

// =============================================================================
// Component Schema (recursive)
// =============================================================================

// Explicit type definition (not using z.infer to avoid type resolution issues)
type ComponentType =
  | "stack"
  | "inline"
  | "grid"
  | "card"
  | "split"
  | "heading"
  | "text"
  | "richText"
  | "kicker"
  | "list"
  | "stat"
  | "statGroup"
  | "badge"
  | "image"
  | "icon"
  | "button"
  | "buttonGroup"
  | "skeleton"
  | "form"
  | "formField"
  | "textInput"
  | "textarea"
  | "select"
  | "checkbox"
  | "radio"
  | "dateInput"
  | "fileUpload"
  | "rating"
  | "slider"
  | "divider"
  | "spacer";

interface SduiComponent {
  id: string;
  type: ComponentType;
  props: Record<string, unknown>;
  dataSource?: string;
  propBindings?: Record<string, string>;
  children?: SduiComponent[];
  actions?: string[];
  visibility?: "visible" | "hidden" | "collapsed";
  analyticsId?: string;
}

const componentSchema: z.ZodType<SduiComponent> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    type: componentTypeEnum,
    props: z.record(z.string(), z.unknown()).default({}),
    dataSource: z.string().optional(),
    propBindings: z.record(z.string(), z.string()).optional(),
    children: z.array(componentSchema).optional(),
    actions: z.array(z.string()).optional(),
    visibility: z.enum(["visible", "hidden", "collapsed"]).default("visible"),
    analyticsId: z.string().optional(),
  }),
);

// =============================================================================
// Section Schema
// =============================================================================

const sectionHeaderSchema = z.object({
  kicker: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  align: z.enum(["start", "center", "end"]).default("start"),
});

const sectionSchema = z.object({
  id: z.string().min(1),
  tone: z.enum(["default", "muted", "contrast", "accent"]).default("default"),
  background: z
    .enum(["transparent", "surface", "panel", "glass"])
    .default("surface"),
  padding: spaceScaleEnum.default("lg"),
  gap: spaceScaleEnum.default("md"),
  width: z
    .enum(["narrow", "content", "default", "wide", "full"])
    .default("default"),
  border: z.enum(["none", "soft", "strong"]).default("soft"),
  header: sectionHeaderSchema.optional(),
  components: z.array(componentSchema).min(1),
  actions: z.array(z.string()).optional(),
  dataSource: z.string().optional(),
  analyticsId: z.string().optional(),
});

// =============================================================================
// Layout Props (for canvas, modal, drawer)
// =============================================================================

const overlayQuickActionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  prompt: z.string().min(1),
});

const overlaySchema = z.object({
  type: z.literal("chat-input"),
  placeholder: z.string().default("Describe what you want to see…"),
  helperText: z.string().optional(),
  quickActions: z.array(overlayQuickActionSchema).default([]),
});

const canvasLayoutPropsSchema = z.object({
  tone: z.enum(["neutral", "dusk", "aurora", "paper"]).default("neutral"),
  padding: z.enum(["none", "sm", "md", "lg"]).default("lg"),
  width: z.enum(["fluid", "prose", "wide"]).default("wide"),
  fullscreen: z.boolean().default(true),
  scrollable: z.boolean().default(true),
  overlayPlacement: z
    .enum(["bottom-center", "bottom-left", "bottom-right"])
    .default("bottom-center"),
  overlayWidth: z.enum(["narrow", "medium", "wide"]).default("medium"),
  overlay: overlaySchema.optional(),
});

const modalLayoutPropsSchema = z.object({
  size: z.enum(["sm", "md", "lg", "xl", "full"]).default("md"),
  closable: z.boolean().default(true),
});

const drawerLayoutPropsSchema = z.object({
  side: z.enum(["left", "right"]).default("right"),
  size: z.enum(["sm", "md", "lg"]).default("md"),
  closable: z.boolean().default(true),
});

// =============================================================================
// Screen Schema (top-level envelope)
// =============================================================================

const screenSchema = z.object({
  id: z.string().min(1),
  version: z.literal("2025-01"),
  title: z.string().optional(),
  description: z.string().optional(),
  layout: z.enum(["canvas", "modal", "drawer"]).default("canvas"),
  layoutProps: z
    .union([
      canvasLayoutPropsSchema,
      modalLayoutPropsSchema,
      drawerLayoutPropsSchema,
    ])
    .optional(),
  sections: z.array(sectionSchema).min(1),
  actions: z.array(actionSchema).default([]),
  dataRequirements: z.array(dataRequirementSchema).default([]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// =============================================================================
// Explicit Type Definitions (avoiding z.infer for better cross-package compatibility)
// =============================================================================

type SpaceScale = "none" | "xs" | "sm" | "md" | "lg" | "xl";
type _Align = "start" | "center" | "end" | "stretch";
type _Justify = "start" | "center" | "end" | "between";

type SduiActionInvocation =
  | {
      type: "trpc";
      procedure: string;
      input?: Record<string, unknown>;
    }
  | {
      type: "url";
      url: string;
      method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
      headers?: Record<string, string>;
      body?: Record<string, unknown>;
    }
  | {
      type: "navigate";
      path: string;
      params?: Record<string, string>;
    }
  | {
      type: "prompt";
      text: string;
    };

interface SduiAction {
  id: string;
  label: string;
  variant: "primary" | "secondary" | "ghost" | "link" | "destructive";
  icon?: string;
  hotkey?: string;
  disabled: boolean;
  invocation: SduiActionInvocation;
  analytics?: {
    surface?: string;
    feature?: string;
  };
}

interface SduiDataRequirement {
  id: string;
  procedure: string;
  input?: Record<string, unknown>;
  staleTime: number;
  refetchOnWindowFocus: boolean;
}

interface SduiSectionHeader {
  kicker?: string;
  title?: string;
  description?: string;
  align: "start" | "center" | "end";
}

interface SduiSection {
  id: string;
  tone: "default" | "muted" | "contrast" | "accent";
  background: "transparent" | "surface" | "panel" | "glass";
  padding: SpaceScale;
  gap: SpaceScale;
  width: "narrow" | "content" | "default" | "wide" | "full";
  border: "none" | "soft" | "strong";
  header?: SduiSectionHeader;
  components: SduiComponent[];
  actions?: string[];
  dataSource?: string;
  analyticsId?: string;
}

interface SduiOverlayQuickAction {
  id: string;
  label: string;
  prompt: string;
}

interface SduiOverlay {
  type: "chat-input";
  placeholder: string;
  helperText?: string;
  quickActions: SduiOverlayQuickAction[];
}

interface CanvasLayoutProps {
  tone: "neutral" | "dusk" | "aurora" | "paper";
  padding: "none" | "sm" | "md" | "lg";
  width: "fluid" | "prose" | "wide";
  fullscreen: boolean;
  scrollable: boolean;
  overlayPlacement: "bottom-center" | "bottom-left" | "bottom-right";
  overlayWidth: "narrow" | "medium" | "wide";
  overlay?: SduiOverlay;
}

interface ModalLayoutProps {
  size: "sm" | "md" | "lg" | "xl" | "full";
  closable: boolean;
}

interface DrawerLayoutProps {
  side: "left" | "right";
  size: "sm" | "md" | "lg";
  closable: boolean;
}

interface SduiScreen {
  id: string;
  version: "2025-01";
  title?: string;
  description?: string;
  layout: "canvas" | "modal" | "drawer";
  layoutProps?: CanvasLayoutProps | ModalLayoutProps | DrawerLayoutProps;
  sections: SduiSection[];
  actions: SduiAction[];
  dataRequirements: SduiDataRequirement[];
  metadata?: Record<string, unknown>;
}

// Rich text types
interface SduiRichTextSpan {
  text: string;
  marks: ("bold" | "italic" | "underline" | "code" | "subtle" | "link")[];
  href?: string;
}

interface SduiRichTextParagraph {
  type: "paragraph";
  spans: SduiRichTextSpan[];
  align?: "start" | "center" | "end" | "justify";
}

interface SduiRichTextHeading {
  type: "heading";
  text: string;
  level: "1" | "2" | "3" | "4" | "5" | "6";
}

interface SduiRichTextList {
  type: "list";
  ordered: boolean;
  items: string[];
}

interface SduiRichTextQuote {
  type: "quote";
  text: string;
  attribution?: string;
}

interface SduiRichTextDivider {
  type: "divider";
}

type SduiRichTextNode =
  | SduiRichTextParagraph
  | SduiRichTextHeading
  | SduiRichTextList
  | SduiRichTextQuote
  | SduiRichTextDivider;

// =============================================================================
// Builder Helpers
// =============================================================================

const buildComponent = (component: SduiComponent): SduiComponent =>
  componentSchema.parse(component);

const buildSection = (section: z.input<typeof sectionSchema>): SduiSection =>
  sectionSchema.parse(section);

const buildScreen = (screen: z.input<typeof screenSchema>): SduiScreen =>
  screenSchema.parse(screen);

// =============================================================================
// Component Prop Schema Registry (for validation)
// =============================================================================

const componentPropSchemas: Record<ComponentType, z.ZodTypeAny> = {
  stack: stackPropsSchema,
  inline: inlinePropsSchema,
  grid: gridPropsSchema,
  card: cardPropsSchema,
  split: splitPropsSchema,
  heading: headingPropsSchema,
  text: textPropsSchema,
  richText: richTextPropsSchema,
  kicker: kickerPropsSchema,
  list: listPropsSchema,
  stat: statPropsSchema,
  statGroup: statGroupPropsSchema,
  badge: badgePropsSchema,
  image: imagePropsSchema,
  icon: iconPropsSchema,
  button: buttonPropsSchema,
  buttonGroup: buttonGroupPropsSchema,
  skeleton: skeletonPropsSchema,
  form: formPropsSchema,
  formField: formFieldPropsSchema,
  textInput: textInputPropsSchema,
  textarea: textareaPropsSchema,
  select: selectPropsSchema,
  checkbox: checkboxPropsSchema,
  radio: radioPropsSchema,
  dateInput: dateInputPropsSchema,
  fileUpload: fileUploadPropsSchema,
  rating: ratingPropsSchema,
  slider: sliderPropsSchema,
  divider: dividerPropsSchema,
  spacer: spacerPropsSchema,
};

/**
 * Validates component props against the schema for its type.
 * Returns the parsed props or throws a ZodError.
 */
const validateComponentProps = <T extends ComponentType>(
  type: T,
  props: unknown,
): z.infer<(typeof componentPropSchemas)[T]> => {
  const schema = componentPropSchemas[type];
  return schema.parse(props);
};

// =============================================================================
// Schema Metadata (for MCP/agent access)
// =============================================================================

const COMPONENT_TYPES = componentTypeEnum.options;

const COMPONENT_CHILDREN_ALLOWED: Record<ComponentType, boolean> = {
  stack: true,
  inline: true,
  grid: true,
  card: true,
  split: true,
  heading: false,
  text: false,
  richText: false,
  kicker: false,
  list: true, // children are item templates
  stat: false,
  statGroup: true,
  badge: false,
  image: false,
  icon: false,
  button: false,
  buttonGroup: true,
  skeleton: false,
  form: true, // contains formField and button children
  formField: true, // wraps input component
  textInput: false,
  textarea: false,
  select: false,
  checkbox: false,
  radio: false,
  dateInput: false,
  fileUpload: false,
  rating: false,
  slider: false,
  divider: false,
  spacer: false,
};

// =============================================================================
// Exports
// =============================================================================

export {
  // Schemas
  actionSchema,
  canvasLayoutPropsSchema,
  componentPropSchemas,
  componentSchema,
  componentTypeEnum,
  dataRequirementSchema,
  drawerLayoutPropsSchema,
  modalLayoutPropsSchema,
  overlaySchema,
  richTextNodeSchema,
  screenSchema,
  sectionSchema,
  // Builders
  buildComponent,
  buildScreen,
  buildSection,
  validateComponentProps,
  // Metadata
  COMPONENT_CHILDREN_ALLOWED,
  COMPONENT_TYPES,
};

export type {
  CanvasLayoutProps,
  ComponentType,
  DrawerLayoutProps,
  ModalLayoutProps,
  SduiAction,
  SduiComponent,
  SduiDataRequirement,
  SduiOverlay,
  SduiRichTextNode,
  SduiScreen,
  SduiSection,
};

// =============================================================================
// Legacy Compatibility (deprecated, will be removed)
// =============================================================================

/**
 * @deprecated Use screenSchema instead. Will be removed in v2025-06.
 */
const viewSchema = screenSchema;

/**
 * @deprecated Use SduiScreen instead. Will be removed in v2025-06.
 */
type SduiView = SduiScreen;

/**
 * @deprecated Use buildScreen instead. Will be removed in v2025-06.
 */
const buildView = buildScreen;

/**
 * @deprecated Use SduiComponent instead. Will be removed in v2025-06.
 */
type SduiElement = SduiComponent;

/**
 * @deprecated Use buildComponent instead. Will be removed in v2025-06.
 */
const buildElement = buildComponent;

/**
 * @deprecated No longer needed. Will be removed in v2025-06.
 */
type ElementByKind<_Kind extends string> = SduiComponent;

/**
 * @deprecated No longer needed. Will be removed in v2025-06.
 */
type ElementInputByKind<_Kind extends string> = SduiComponent;

/**
 * @deprecated Use componentSchema instead. Will be removed in v2025-06.
 */
const elementSchema = componentSchema;

export { buildElement, buildView, elementSchema, viewSchema };

export type { ElementByKind, ElementInputByKind, SduiElement, SduiView };
