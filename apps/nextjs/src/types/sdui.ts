/**
 * SDUI Types for Next.js App
 *
 * These types mirror the SDUI schema from @acme/api/sdui-schema to avoid
 * type resolution issues caused by the zod/v4 import in the source package.
 *
 * When the upstream package is updated to fix the zod/v4 resolution issue,
 * these can be removed and imports can return to using @acme/api directly.
 */

// =============================================================================
// Space & Layout Primitives
// =============================================================================

export type SpaceScale = "none" | "xs" | "sm" | "md" | "lg" | "xl";
export type Align = "start" | "center" | "end" | "stretch";
export type Justify = "start" | "center" | "end" | "between";
export type Tone = "default" | "muted" | "accent" | "success" | "warning" | "danger";

// =============================================================================
// Action Types
// =============================================================================

export type SduiActionInvocation =
  | {
      readonly type: "trpc";
      readonly procedure: string;
      readonly input?: Record<string, unknown>;
    }
  | {
      readonly type: "url";
      readonly url: string;
      readonly method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
      readonly headers?: Record<string, string>;
      readonly body?: Record<string, unknown>;
    }
  | {
      readonly type: "navigate";
      readonly path: string;
      readonly params?: Record<string, string>;
    }
  | {
      readonly type: "prompt";
      readonly text: string;
    };

export interface SduiAction {
  readonly id: string;
  readonly label: string;
  readonly variant: "primary" | "secondary" | "ghost" | "link" | "destructive";
  readonly icon?: string;
  readonly hotkey?: string;
  readonly disabled: boolean;
  readonly invocation: SduiActionInvocation;
  readonly analytics?: {
    readonly surface?: string;
    readonly feature?: string;
  };
}

// =============================================================================
// Data Requirement Types
// =============================================================================

export interface SduiDataRequirement {
  readonly id: string;
  readonly procedure: string;
  readonly input?: Record<string, unknown>;
  readonly staleTime: number;
  readonly refetchOnWindowFocus: boolean;
}

// =============================================================================
// Component Types
// =============================================================================

export type ComponentType =
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

export interface SduiComponent {
  readonly id: string;
  readonly type: ComponentType;
  readonly props: Record<string, unknown>;
  readonly dataSource?: string;
  readonly propBindings?: Record<string, string>;
  readonly children?: SduiComponent[];
  readonly actions?: string[];
  readonly visibility?: "visible" | "hidden" | "collapsed";
  readonly analyticsId?: string;
}

// =============================================================================
// Section Types
// =============================================================================

export interface SduiSectionHeader {
  readonly kicker?: string;
  readonly title?: string;
  readonly description?: string;
  readonly align: "start" | "center" | "end";
}

export interface SduiSection {
  readonly id: string;
  readonly tone: "default" | "muted" | "contrast" | "accent";
  readonly background: "transparent" | "surface" | "panel" | "glass";
  readonly padding: SpaceScale;
  readonly gap: SpaceScale;
  readonly width: "narrow" | "content" | "default" | "wide" | "full";
  readonly border: "none" | "soft" | "strong";
  readonly header?: SduiSectionHeader;
  readonly components: SduiComponent[];
  readonly actions?: string[];
  readonly dataSource?: string;
  readonly analyticsId?: string;
}

// =============================================================================
// Layout Types
// =============================================================================

export interface SduiOverlayQuickAction {
  readonly id: string;
  readonly label: string;
  readonly prompt: string;
}

export interface SduiOverlay {
  readonly type: "chat-input";
  readonly placeholder: string;
  readonly helperText?: string;
  readonly quickActions: SduiOverlayQuickAction[];
}

export interface CanvasLayoutProps {
  readonly tone: "neutral" | "dusk" | "aurora" | "paper";
  readonly padding: "none" | "sm" | "md" | "lg";
  readonly width: "fluid" | "prose" | "wide";
  readonly fullscreen: boolean;
  readonly scrollable: boolean;
  readonly overlayPlacement: "bottom-center" | "bottom-left" | "bottom-right";
  readonly overlayWidth: "narrow" | "medium" | "wide";
  readonly overlay?: SduiOverlay;
}

export interface ModalLayoutProps {
  readonly size: "sm" | "md" | "lg" | "xl" | "full";
  readonly closable: boolean;
}

export interface DrawerLayoutProps {
  readonly side: "left" | "right";
  readonly size: "sm" | "md" | "lg";
  readonly closable: boolean;
}

// =============================================================================
// Screen Types
// =============================================================================

export interface SduiScreen {
  readonly id: string;
  readonly version: "2025-01";
  readonly title?: string;
  readonly description?: string;
  readonly layout: "canvas" | "modal" | "drawer";
  readonly layoutProps?:
    | CanvasLayoutProps
    | ModalLayoutProps
    | DrawerLayoutProps;
  readonly sections: SduiSection[];
  readonly actions: SduiAction[];
  readonly dataRequirements: SduiDataRequirement[];
  readonly metadata?: Record<string, unknown>;
}

// =============================================================================
// Rich Text Types
// =============================================================================

export interface SduiRichTextSpan {
  readonly text: string;
  readonly marks: ("bold" | "italic" | "underline" | "code" | "subtle" | "link")[];
  readonly href?: string;
}

export interface SduiRichTextParagraph {
  readonly type: "paragraph";
  readonly spans: SduiRichTextSpan[];
  readonly align?: "start" | "center" | "end" | "justify";
}

export interface SduiRichTextHeading {
  readonly type: "heading";
  readonly text: string;
  readonly level: "1" | "2" | "3" | "4" | "5" | "6";
}

export interface SduiRichTextList {
  readonly type: "list";
  readonly ordered: boolean;
  readonly items: string[];
}

export interface SduiRichTextQuote {
  readonly type: "quote";
  readonly text: string;
  readonly attribution?: string;
}

export interface SduiRichTextDivider {
  readonly type: "divider";
}

export type SduiRichTextNode =
  | SduiRichTextParagraph
  | SduiRichTextHeading
  | SduiRichTextList
  | SduiRichTextQuote
  | SduiRichTextDivider;

// =============================================================================
// Form Component Prop Types
// =============================================================================

export interface SelectOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface FormProps {
  readonly actionId: string;
  readonly submitLabel: string;
  readonly resetLabel?: string;
  readonly submitVariant: "primary" | "secondary" | "ghost" | "link" | "destructive";
  readonly orientation: "vertical" | "horizontal";
  readonly gap: SpaceScale;
}

export interface FormFieldProps {
  readonly name: string;
  readonly label: string;
  readonly hint?: string;
  readonly required: boolean;
  readonly error?: string;
}

export interface TextInputProps {
  readonly name: string;
  readonly placeholder?: string;
  readonly inputType: "text" | "email" | "password" | "number" | "tel" | "url";
  readonly defaultValue?: string;
  readonly disabled: boolean;
  readonly minLength?: number;
  readonly maxLength?: number;
}

export interface TextareaProps {
  readonly name: string;
  readonly placeholder?: string;
  readonly rows: number;
  readonly defaultValue?: string;
  readonly disabled: boolean;
  readonly minLength?: number;
  readonly maxLength?: number;
}

export interface SelectProps {
  readonly name: string;
  readonly placeholder?: string;
  readonly options: SelectOption[];
  readonly defaultValue?: string;
  readonly disabled: boolean;
}

export interface CheckboxProps {
  readonly name: string;
  readonly label: string;
  readonly defaultChecked: boolean;
  readonly disabled: boolean;
}

export interface RadioProps {
  readonly name: string;
  readonly options: SelectOption[];
  readonly defaultValue?: string;
  readonly disabled: boolean;
  readonly orientation: "horizontal" | "vertical";
}

export interface DateInputProps {
  readonly name: string;
  readonly placeholder?: string;
  readonly minDate?: string;
  readonly maxDate?: string;
  readonly defaultValue?: string;
  readonly disabled: boolean;
}

export interface FileUploadProps {
  readonly name: string;
  readonly accept?: string;
  readonly multiple: boolean;
  readonly maxSize?: number;
  readonly maxFiles: number;
  readonly disabled: boolean;
}

export interface RatingProps {
  readonly name: string;
  readonly max: number;
  readonly defaultValue?: number;
  readonly disabled: boolean;
  readonly size: "sm" | "md" | "lg";
}

export interface SliderProps {
  readonly name: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly defaultValue?: number;
  readonly disabled: boolean;
  readonly showValue: boolean;
}
