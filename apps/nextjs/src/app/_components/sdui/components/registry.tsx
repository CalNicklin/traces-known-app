"use client";

import type { ReactNode } from "react";
import React, { Fragment } from "react";

import {
  Badge,
  Canvas,
  Divider,
  Grid,
  Heading,
  Inline,
  Kicker,
  RichTextBlock,
  Section,
  SectionHeader,
  Skeleton,
  Split,
  Stack,
  Surface,
  Text,
} from "@acme/ui";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";

import type { ComponentType, SduiComponent } from "~/types/sdui";
import { FormContext, useAction, useDataSource, useFormContext, useSduiContext } from "../sdui-context";

// =============================================================================
// Types
// =============================================================================

interface RenderContext {
  readonly depth: number;
  readonly parentType: ComponentType | "section" | "screen" | null;
}

interface ComponentRendererProps {
  readonly component: SduiComponent;
  readonly context: RenderContext;
}

// =============================================================================
// Prop Binding Resolution
// =============================================================================

/**
 * Resolves prop bindings using JSONPath-like syntax.
 * Supports: $.field, $.nested.field, $[0], $.array[0].field
 */
function resolvePath(data: unknown, path: string): unknown {
  if (!path.startsWith("$")) return path;

  const segments = path
    .slice(1) // Remove leading $
    .split(/\.|\[|\]/)
    .filter(Boolean);

  let current: unknown = data;

  for (const segment of segments) {
    if (current === null || current === undefined) return undefined;

    if (typeof current === "object") {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Safely converts a form value to a string.
 * Returns empty string for null/undefined/objects.
 */
function toFormString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function resolveBindings(
  props: Record<string, unknown>,
  bindings: Record<string, string> | undefined,
  data: unknown,
): Record<string, unknown> {
  if (!bindings) return props;

  const resolved = { ...props };

  for (const [propKey, path] of Object.entries(bindings)) {
    const value = resolvePath(data, path);
    if (value !== undefined) {
      resolved[propKey] = value;
    }
  }

  return resolved;
}

// =============================================================================
// Component Renderers
// =============================================================================

// Layout Components
function StackRenderer({ component, context }: ComponentRendererProps) {
  const props = component.props as {
    gap?: string;
    padding?: string;
    align?: string;
    justify?: string;
    fullHeight?: boolean;
  };

  return (
    <Stack
      gap={props.gap as "none" | "xs" | "sm" | "md" | "lg" | "xl"}
      padding={props.padding as "none" | "xs" | "sm" | "md" | "lg" | "xl"}
      align={props.align as "start" | "center" | "end" | "stretch"}
      justify={props.justify as "start" | "center" | "end" | "between"}
      fullHeight={props.fullHeight}
    >
      {component.children?.map((child) => (
        <Fragment key={child.id}>
          {renderComponent(child, {
            ...context,
            depth: context.depth + 1,
            parentType: "stack",
          })}
        </Fragment>
      ))}
    </Stack>
  );
}

function InlineRenderer({ component, context }: ComponentRendererProps) {
  const props = component.props as {
    gap?: string;
    align?: string;
    justify?: string;
    wrap?: boolean;
  };

  return (
    <Inline
      gap={props.gap as "none" | "xs" | "sm" | "md" | "lg" | "xl"}
      align={props.align as "start" | "center" | "end" | "stretch"}
      justify={props.justify as "start" | "center" | "end" | "between"}
      wrap={props.wrap}
    >
      {component.children?.map((child) => (
        <Fragment key={child.id}>
          {renderComponent(child, {
            ...context,
            depth: context.depth + 1,
            parentType: "inline",
          })}
        </Fragment>
      ))}
    </Inline>
  );
}

function GridRenderer({ component, context }: ComponentRendererProps) {
  const props = component.props as {
    columns?: number;
    smColumns?: number;
    mdColumns?: number;
    lgColumns?: number;
    gap?: string;
    equalHeight?: boolean;
  };

  return (
    <Grid
      columns={props.columns as 1 | 2 | 3 | 4 | 5 | 6 | 12}
      smColumns={props.smColumns as 1 | 2 | 3 | 4 | 5 | 6 | 12 | undefined}
      mdColumns={props.mdColumns as 1 | 2 | 3 | 4 | 5 | 6 | 12 | undefined}
      lgColumns={props.lgColumns as 1 | 2 | 3 | 4 | 5 | 6 | 12 | undefined}
      gap={props.gap as "none" | "xs" | "sm" | "md" | "lg" | "xl"}
      equalHeight={props.equalHeight}
    >
      {component.children?.map((child) => (
        <Fragment key={child.id}>
          {renderComponent(child, {
            ...context,
            depth: context.depth + 1,
            parentType: "grid",
          })}
        </Fragment>
      ))}
    </Grid>
  );
}

function CardRenderer({ component, context }: ComponentRendererProps) {
  const props = component.props as {
    tone?: string;
    padding?: string;
    interactive?: boolean;
  };

  return (
    <Surface
      tone={props.tone as "plain" | "muted" | "accent" | "elevated" | "subtle"}
      padding={props.padding as "none" | "sm" | "md" | "lg" | "xl"}
      interaction={props.interactive ? "interactive" : "static"}
    >
      {component.children?.map((child) => (
        <Fragment key={child.id}>
          {renderComponent(child, {
            ...context,
            depth: context.depth + 1,
            parentType: "card",
          })}
        </Fragment>
      ))}
    </Surface>
  );
}

function SplitRenderer({ component, context }: ComponentRendererProps) {
  const props = component.props as {
    ratio?: string;
    stackBelow?: string;
    gap?: string;
    align?: string;
  };

  const children = component.children ?? [];
  const [first, second] = children;

  return (
    <Split
      ratio={props.ratio as "1:1" | "2:1" | "1:2" | "3:2" | "2:3"}
      stackBelow={props.stackBelow as "sm" | "md" | "lg" | "xl" | "always"}
      gap={props.gap as "none" | "xs" | "sm" | "md" | "lg"}
      align={props.align as "start" | "center" | "end" | "stretch"}
    >
      {first
        ? renderComponent(first, {
            ...context,
            depth: context.depth + 1,
            parentType: "split",
          })
        : null}
      {second
        ? renderComponent(second, {
            ...context,
            depth: context.depth + 1,
            parentType: "split",
          })
        : null}
    </Split>
  );
}

// Typography Components
function HeadingRenderer({ component }: ComponentRendererProps) {
  const props = component.props as {
    text?: string;
    level?: string;
    tone?: string;
    align?: string;
    weight?: string;
  };

  return (
    <Heading
      level={props.level as "display" | "1" | "2" | "3" | "4" | "5" | "6"}
      tone={props.tone as "default" | "muted" | "accent"}
      align={props.align as "start" | "center" | "end"}
    >
      {props.text}
    </Heading>
  );
}

function TextRenderer({ component }: ComponentRendererProps) {
  const props = component.props as {
    text?: string;
    size?: string;
    tone?: string;
    emphasis?: string;
    align?: string;
    clampLines?: number;
  };

  return (
    <Text
      size={props.size as "xs" | "sm" | "md" | "lg" | "xl"}
      tone={
        props.tone as
          | "default"
          | "muted"
          | "accent"
          | "success"
          | "warning"
          | "danger"
      }
      emphasis={props.emphasis as "none" | "medium" | "strong"}
      clampLines={props.clampLines}
    >
      {props.text}
    </Text>
  );
}

function RichTextRenderer({ component }: ComponentRendererProps) {
  const props = component.props as {
    nodes?: {
      type: string;
      text?: string;
      spans?: { text: string; marks?: string[] }[];
      level?: string;
      ordered?: boolean;
      items?: string[];
      attribution?: string;
    }[];
    spacing?: string;
  };

  if (!props.nodes) return null;

  type RichTextMark = "bold" | "italic" | "underline" | "code" | "subtle";

  // Transform to RichTextBlock format
  const nodes = props.nodes.map((node) => {
    if (node.type === "paragraph" && node.spans) {
      return {
        type: "paragraph" as const,
        spans: node.spans.map((span) => ({
          text: span.text,
          marks: (span.marks ?? []) as RichTextMark[],
        })),
      };
    }
    if (node.type === "heading") {
      return {
        type: "heading" as const,
        text: node.text ?? "",
        level: (node.level ?? "3") as "1" | "2" | "3" | "4" | "5" | "6",
      };
    }
    if (node.type === "list") {
      return {
        type: "list" as const,
        ordered: node.ordered ?? false,
        items: (node.items ?? []).map((item) => ({
          type: "paragraph" as const,
          spans: [{ text: item, marks: [] as RichTextMark[] }],
        })),
      };
    }
    if (node.type === "quote") {
      return {
        type: "quote" as const,
        text: node.text ?? "",
        attribution: node.attribution,
      };
    }
    return { type: "divider" as const };
  });

  return (
    <RichTextBlock
      nodes={nodes}
      spacing={props.spacing as "compact" | "normal" | "loose"}
    />
  );
}

function KickerRenderer({ component }: ComponentRendererProps) {
  const props = component.props as {
    text?: string;
    tone?: string;
  };

  return <Kicker>{props.text}</Kicker>;
}

// Data Components
function ListRenderer({ component, context }: ComponentRendererProps) {
  const { data, isLoading } = useDataSource(component.dataSource);
  const props = component.props as {
    emptyText?: string;
    orientation?: string;
    gap?: string;
  };

  const resolvedProps = resolveBindings(props, component.propBindings, data);
  const items = (resolvedProps.items as unknown[] | undefined) ?? [];
  const itemTemplate = component.children?.[0];

  if (isLoading) {
    return (
      <Stack gap={props.gap as "none" | "xs" | "sm" | "md" | "lg" | "xl"}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </Stack>
    );
  }

  if (items.length === 0) {
    return <Text tone="muted">{props.emptyText ?? "No items"}</Text>;
  }

  const Container = props.orientation === "horizontal" ? Inline : Stack;

  return (
    <Container gap={props.gap as "none" | "xs" | "sm" | "md" | "lg" | "xl"}>
      {items.map((item, index) => {
        if (!itemTemplate) {
          return (
            <Text key={index}>
              {typeof item === "string" ? item : JSON.stringify(item)}
            </Text>
          );
        }

        // Clone template with item data bindings resolved
        const resolvedTemplate: SduiComponent = {
          ...itemTemplate,
          id: `${itemTemplate.id}-${index}`,
          props: resolveBindings(
            itemTemplate.props,
            itemTemplate.propBindings,
            item,
          ),
        };

        return (
          <Fragment key={resolvedTemplate.id}>
            {renderComponent(resolvedTemplate, {
              ...context,
              depth: context.depth + 1,
              parentType: "list",
            })}
          </Fragment>
        );
      })}
    </Container>
  );
}

function StatRenderer({ component }: ComponentRendererProps) {
  const props = component.props as {
    label?: string;
    value?: string;
    previousValue?: string;
    trend?: string;
    trendLabel?: string;
    size?: string;
  };

  const sizeClass =
    props.size === "lg"
      ? "text-4xl"
      : props.size === "sm"
        ? "text-xl"
        : "text-2xl";
  const trendColor =
    props.trend === "up"
      ? "text-green-500"
      : props.trend === "down"
        ? "text-red-500"
        : "text-muted-foreground";

  return (
    <div className="flex flex-col gap-1">
      <Text size="sm" tone="muted">
        {props.label}
      </Text>
      <div className={`font-semibold ${sizeClass}`}>{props.value}</div>
      {props.trend && props.trendLabel && (
        <Text size="xs" className={trendColor}>
          {props.trend === "up" ? "↑" : props.trend === "down" ? "↓" : "→"}{" "}
          {props.trendLabel}
        </Text>
      )}
    </div>
  );
}

function StatGroupRenderer({ component, context }: ComponentRendererProps) {
  const props = component.props as {
    orientation?: string;
    gap?: string;
  };

  const Container = props.orientation === "vertical" ? Stack : Inline;

  return (
    <Container gap={props.gap as "none" | "xs" | "sm" | "md" | "lg" | "xl"}>
      {component.children?.map((child) => (
        <Fragment key={child.id}>
          {renderComponent(child, {
            ...context,
            depth: context.depth + 1,
            parentType: "statGroup",
          })}
        </Fragment>
      ))}
    </Container>
  );
}

function BadgeRenderer({ component }: ComponentRendererProps) {
  const props = component.props as {
    text?: string;
    tone?: string;
    size?: string;
  };

  const variant =
    props.tone === "success"
      ? "default"
      : props.tone === "warning"
        ? "secondary"
        : props.tone === "danger"
          ? "destructive"
          : "outline";

  return <Badge variant={variant}>{props.text}</Badge>;
}

// Interactive Components
function ButtonRenderer({ component }: ComponentRendererProps) {
  const props = component.props as {
    label?: string;
    actionId?: string;
    variant?: string;
    size?: string;
    fullWidth?: boolean;
  };

  const { action, isPending, invoke } = useAction(props.actionId ?? "");

  const handleClick = () => {
    if (props.actionId) {
      void invoke(component.id);
    }
  };

  const buttonVariant = props.variant ?? "primary";
  const buttonSize = props.size ?? "md";

  return (
    <Button
      variant={
        buttonVariant as
          | "primary"
          | "secondary"
          | "ghost"
          | "link"
          | "destructive"
          | "outline"
      }
      size={buttonSize as "sm" | "md" | "lg"}
      disabled={isPending || action?.disabled}
      onClick={handleClick}
      className={props.fullWidth ? "w-full" : undefined}
    >
      {isPending ? "Working…" : props.label}
    </Button>
  );
}

function ButtonGroupRenderer({ component, context }: ComponentRendererProps) {
  const props = component.props as {
    orientation?: string;
    gap?: string;
  };

  const Container = props.orientation === "vertical" ? Stack : Inline;

  return (
    <Container gap={props.gap as "none" | "xs" | "sm" | "md" | "lg" | "xl"}>
      {component.children?.map((child) => (
        <Fragment key={child.id}>
          {renderComponent(child, {
            ...context,
            depth: context.depth + 1,
            parentType: "buttonGroup",
          })}
        </Fragment>
      ))}
    </Container>
  );
}

function SkeletonRenderer({ component }: ComponentRendererProps) {
  const props = component.props as {
    variant?: string;
    lines?: number;
  };

  const lines = props.lines ?? 1;

  if (props.variant === "card") {
    return <Skeleton className="h-32 w-full rounded-xl" />;
  }

  if (props.variant === "heading") {
    return <Skeleton className="h-8 w-3/4" />;
  }

  if (props.variant === "image") {
    return <Skeleton className="aspect-video w-full rounded-lg" />;
  }

  if (props.variant === "stat") {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-16" />
      </div>
    );
  }

  // Default: text lines
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}

// Form Components
function FormRenderer({ component, context }: ComponentRendererProps) {
  const { invokeAction, pendingActionId } = useSduiContext();
  const [formData, setFormData] = React.useState<Record<string, unknown>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const props = component.props as {
    actionId?: string;
    submitLabel?: string;
    resetLabel?: string;
    submitVariant?: string;
    orientation?: string;
    gap?: string;
  };

  const handleFieldChange = (name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when field changes
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!props.actionId) return;

    try {
      await invokeAction(props.actionId, component.id, formData);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleReset = () => {
    setFormData({});
    setErrors({});
  };

  const isSubmitting = pendingActionId === props.actionId;
  const Container = props.orientation === "horizontal" ? Inline : Stack;

  return (
    <FormContext.Provider
      value={{
        formData,
        errors,
        isSubmitting,
        onFieldChange: handleFieldChange,
      }}
    >
      <form onSubmit={(e) => void handleSubmit(e)}>
        <Container gap={props.gap as "none" | "xs" | "sm" | "md" | "lg" | "xl"}>
          {component.children?.map((child) => (
            <Fragment key={child.id}>
              {renderComponent(child, {
                ...context,
                depth: context.depth + 1,
                parentType: "form",
              })}
            </Fragment>
          ))}
          <Inline gap="sm">
            <Button
              type="submit"
              variant={
                props.submitVariant as
                  | "primary"
                  | "secondary"
                  | "ghost"
                  | "destructive"
                  | undefined
              }
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting…" : (props.submitLabel ?? "Submit")}
            </Button>
            {props.resetLabel && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleReset}
                disabled={isSubmitting}
              >
                {props.resetLabel}
              </Button>
            )}
          </Inline>
        </Container>
      </form>
    </FormContext.Provider>
  );
}

function FormFieldRenderer({ component, context }: ComponentRendererProps) {
  const { errors } = useFormContext();
  const props = component.props as {
    name?: string;
    label?: string;
    hint?: string;
    required?: boolean;
    error?: string;
  };

  const fieldError = props.name ? (errors[props.name] ?? props.error) : props.error;

  return (
    <div className="flex flex-col gap-1.5">
      {props.label && (
        <Label htmlFor={props.name}>
          {props.label}
          {props.required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
      )}
      {component.children?.map((child) => (
        <Fragment key={child.id}>
          {renderComponent(child, {
            ...context,
            depth: context.depth + 1,
            parentType: "formField",
          })}
        </Fragment>
      ))}
      {props.hint && !fieldError && (
        <Text size="xs" tone="muted">
          {props.hint}
        </Text>
      )}
      {fieldError && (
        <Text size="xs" tone="danger">
          {fieldError}
        </Text>
      )}
    </div>
  );
}

function TextInputRenderer({ component }: ComponentRendererProps) {
  const { formData, onFieldChange, isSubmitting } = useFormContext();
  const props = component.props as {
    name?: string;
    placeholder?: string;
    inputType?: string;
    defaultValue?: string;
    disabled?: boolean;
    minLength?: number;
    maxLength?: number;
  };

  const name = props.name ?? component.id;
  const rawValue = formData[name] ?? props.defaultValue ?? "";
  const value = toFormString(rawValue);

  return (
    <Input
      id={name}
      name={name}
      type={props.inputType ?? "text"}
      placeholder={props.placeholder}
      value={value}
      onChange={(e) => onFieldChange(name, e.target.value)}
      disabled={props.disabled ?? isSubmitting}
      minLength={props.minLength}
      maxLength={props.maxLength}
    />
  );
}

function TextareaRenderer({ component }: ComponentRendererProps) {
  const { formData, onFieldChange, isSubmitting } = useFormContext();
  const props = component.props as {
    name?: string;
    placeholder?: string;
    rows?: number;
    defaultValue?: string;
    disabled?: boolean;
    minLength?: number;
    maxLength?: number;
  };

  const name = props.name ?? component.id;
  const rawValue = formData[name] ?? props.defaultValue ?? "";
  const value = toFormString(rawValue);

  return (
    <textarea
      id={name}
      name={name}
      placeholder={props.placeholder}
      rows={props.rows ?? 4}
      value={value}
      onChange={(e) => onFieldChange(name, e.target.value)}
      disabled={props.disabled ?? isSubmitting}
      minLength={props.minLength}
      maxLength={props.maxLength}
      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}

function SelectRenderer({ component }: ComponentRendererProps) {
  const { formData, onFieldChange, isSubmitting } = useFormContext();
  const props = component.props as {
    name?: string;
    placeholder?: string;
    options?: { value: string; label: string; disabled?: boolean }[];
    defaultValue?: string;
    disabled?: boolean;
  };

  const name = props.name ?? component.id;
  const rawValue = formData[name] ?? props.defaultValue ?? "";
  const value = toFormString(rawValue);

  return (
    <select
      id={name}
      name={name}
      value={value}
      onChange={(e) => onFieldChange(name, e.target.value)}
      disabled={props.disabled ?? isSubmitting}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {props.placeholder && (
        <option value="" disabled>
          {props.placeholder}
        </option>
      )}
      {props.options?.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function CheckboxRenderer({ component }: ComponentRendererProps) {
  const { formData, onFieldChange, isSubmitting } = useFormContext();
  const props = component.props as {
    name?: string;
    label?: string;
    defaultChecked?: boolean;
    disabled?: boolean;
  };

  const name = props.name ?? component.id;
  const checked = formData[name] ?? props.defaultChecked ?? false;

  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        id={name}
        name={name}
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(e) => onFieldChange(name, e.target.checked)}
        disabled={props.disabled ?? isSubmitting}
        className="h-4 w-4 rounded border-input text-primary focus:ring-ring focus:ring-offset-2"
      />
      {props.label && <span className="text-sm">{props.label}</span>}
    </label>
  );
}

function RadioRenderer({ component }: ComponentRendererProps) {
  const { formData, onFieldChange, isSubmitting } = useFormContext();
  const props = component.props as {
    name?: string;
    options?: { value: string; label: string; disabled?: boolean }[];
    defaultValue?: string;
    disabled?: boolean;
    orientation?: string;
  };

  const name = props.name ?? component.id;
  const value = formData[name] ?? props.defaultValue ?? "";
  const Container = props.orientation === "horizontal" ? Inline : Stack;

  return (
    <Container gap="sm">
      {props.options?.map((option) => (
        <label key={option.value} className="flex items-center gap-2 cursor-pointer">
          <input
            name={name}
            type="radio"
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onFieldChange(name, e.target.value)}
            disabled={props.disabled ?? option.disabled ?? isSubmitting}
            className="h-4 w-4 border-input text-primary focus:ring-ring focus:ring-offset-2"
          />
          <span className="text-sm">{option.label}</span>
        </label>
      ))}
    </Container>
  );
}

function DateInputRenderer({ component }: ComponentRendererProps) {
  const { formData, onFieldChange, isSubmitting } = useFormContext();
  const props = component.props as {
    name?: string;
    placeholder?: string;
    minDate?: string;
    maxDate?: string;
    defaultValue?: string;
    disabled?: boolean;
  };

  const name = props.name ?? component.id;
  const rawValue = formData[name] ?? props.defaultValue ?? "";
  const value = toFormString(rawValue);

  return (
    <Input
      id={name}
      name={name}
      type="date"
      value={value}
      onChange={(e) => onFieldChange(name, e.target.value)}
      disabled={props.disabled ?? isSubmitting}
      min={props.minDate}
      max={props.maxDate}
    />
  );
}

function FileUploadRenderer({ component }: ComponentRendererProps) {
  const { onFieldChange, isSubmitting } = useFormContext();
  const props = component.props as {
    name?: string;
    accept?: string;
    multiple?: boolean;
    maxSize?: number;
    maxFiles?: number;
    disabled?: boolean;
  };

  const name = props.name ?? component.id;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      onFieldChange(name, props.multiple ? Array.from(files) : files[0]);
    }
  };

  return (
    <Input
      id={name}
      name={name}
      type="file"
      accept={props.accept}
      multiple={props.multiple}
      onChange={handleChange}
      disabled={props.disabled ?? isSubmitting}
    />
  );
}

function RatingRenderer({ component }: ComponentRendererProps) {
  const { formData, onFieldChange, isSubmitting } = useFormContext();
  const props = component.props as {
    name?: string;
    max?: number;
    defaultValue?: number;
    disabled?: boolean;
    size?: string;
  };

  const name = props.name ?? component.id;
  const value = (formData[name] as number | undefined) ?? props.defaultValue ?? 0;
  const max = props.max ?? 5;
  const disabled = props.disabled ?? isSubmitting;

  const sizeClass =
    props.size === "lg"
      ? "text-3xl"
      : props.size === "sm"
        ? "text-lg"
        : "text-2xl";

  return (
    <div className={`flex gap-1 ${sizeClass}`}>
      {Array.from({ length: max }).map((_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= value;

        return (
          <button
            key={i}
            type="button"
            onClick={() => !disabled && onFieldChange(name, starValue)}
            disabled={disabled}
            className={`transition-colors ${
              disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:text-yellow-400"
            } ${isFilled ? "text-yellow-500" : "text-muted-foreground/30"}`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

function SliderRenderer({ component }: ComponentRendererProps) {
  const { formData, onFieldChange, isSubmitting } = useFormContext();
  const props = component.props as {
    name?: string;
    min?: number;
    max?: number;
    step?: number;
    defaultValue?: number;
    disabled?: boolean;
    showValue?: boolean;
  };

  const name = props.name ?? component.id;
  const min = props.min ?? 0;
  const max = props.max ?? 100;
  const value = (formData[name] as number | undefined) ?? props.defaultValue ?? min;

  return (
    <div className="flex items-center gap-3">
      <input
        id={name}
        name={name}
        type="range"
        min={min}
        max={max}
        step={props.step ?? 1}
        value={value}
        onChange={(e) => onFieldChange(name, Number(e.target.value))}
        disabled={props.disabled ?? isSubmitting}
        className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-50"
      />
      {props.showValue !== false && (
        <span className="min-w-[3ch] text-sm text-muted-foreground">{value}</span>
      )}
    </div>
  );
}

// Utility Components
function DividerRenderer({ component }: ComponentRendererProps) {
  const props = component.props as {
    variant?: string;
    spacing?: string;
  };

  return <Divider variant={props.variant as "solid" | "dashed" | "glow"} />;
}

function SpacerRenderer({ component }: ComponentRendererProps) {
  const props = component.props as {
    size?: string;
  };

  const sizeClass =
    props.size === "xl"
      ? "h-12"
      : props.size === "lg"
        ? "h-8"
        : props.size === "md"
          ? "h-6"
          : props.size === "sm"
            ? "h-4"
            : props.size === "xs"
              ? "h-2"
              : "h-0";

  return <div className={sizeClass} aria-hidden="true" />;
}

function ImageRenderer({ component }: ComponentRendererProps) {
  const props = component.props as {
    src?: string;
    alt?: string;
    aspect?: string;
    fit?: string;
    rounded?: boolean;
  };

  const aspectClass =
    props.aspect === "square"
      ? "aspect-square"
      : props.aspect === "video"
        ? "aspect-video"
        : props.aspect === "wide"
          ? "aspect-[21/9]"
          : "";

  const fitClass =
    props.fit === "contain"
      ? "object-contain"
      : props.fit === "fill"
        ? "object-fill"
        : "object-cover";

  return (
    <img
      src={props.src}
      alt={props.alt ?? ""}
      className={`w-full ${aspectClass} ${fitClass} ${props.rounded ? "rounded-lg" : ""}`}
    />
  );
}

function IconRenderer({ component }: ComponentRendererProps) {
  const props = component.props as {
    name?: string;
    size?: string;
    tone?: string;
  };

  // For now, render as text placeholder - in production, use an icon library
  return (
    <span
      className={`inline-block ${props.size === "lg" ? "text-2xl" : props.size === "sm" ? "text-sm" : "text-base"}`}
      role="img"
      aria-label={props.name}
    >
      [{props.name}]
    </span>
  );
}

// Unknown Component Fallback (kept for debugging, but type system ensures all types are handled)
function _UnknownRenderer({ component }: ComponentRendererProps) {
  return (
    <div className="rounded border border-dashed border-yellow-500/50 bg-yellow-500/10 p-4">
      <Text tone="warning" size="sm">
        Unknown component type: {component.type}
      </Text>
    </div>
  );
}

// =============================================================================
// Registry
// =============================================================================

const componentRenderers: Record<
  ComponentType,
  (props: ComponentRendererProps) => ReactNode
> = {
  // Layout
  stack: StackRenderer,
  inline: InlineRenderer,
  grid: GridRenderer,
  card: CardRenderer,
  split: SplitRenderer,
  // Typography
  heading: HeadingRenderer,
  text: TextRenderer,
  richText: RichTextRenderer,
  kicker: KickerRenderer,
  // Data
  list: ListRenderer,
  stat: StatRenderer,
  statGroup: StatGroupRenderer,
  badge: BadgeRenderer,
  // Media
  image: ImageRenderer,
  icon: IconRenderer,
  // Interactive
  button: ButtonRenderer,
  buttonGroup: ButtonGroupRenderer,
  skeleton: SkeletonRenderer,
  // Form
  form: FormRenderer,
  formField: FormFieldRenderer,
  textInput: TextInputRenderer,
  textarea: TextareaRenderer,
  select: SelectRenderer,
  checkbox: CheckboxRenderer,
  radio: RadioRenderer,
  dateInput: DateInputRenderer,
  fileUpload: FileUploadRenderer,
  rating: RatingRenderer,
  slider: SliderRenderer,
  // Utility
  divider: DividerRenderer,
  spacer: SpacerRenderer,
};

// =============================================================================
// Main Render Function
// =============================================================================

export function renderComponent(
  component: SduiComponent,
  context: RenderContext,
): ReactNode {
  if (
    component.visibility === "hidden" ||
    component.visibility === "collapsed"
  ) {
    return null;
  }

  const Renderer = componentRenderers[component.type];

  return <Renderer component={component} context={context} />;
}

// =============================================================================
// Section Renderer (used by main renderer)
// =============================================================================

interface SectionRendererProps {
  readonly section: {
    readonly id: string;
    readonly tone?: string;
    readonly background?: string;
    readonly padding?: string;
    readonly gap?: string;
    readonly width?: string;
    readonly border?: string;
    readonly header?: {
      readonly kicker?: string;
      readonly title?: string;
      readonly description?: string;
      readonly align?: string;
    };
    readonly components: SduiComponent[];
    readonly actions?: string[];
    readonly dataSource?: string;
  };
}

export function SectionRenderer({ section }: SectionRendererProps) {
  const { actions, pendingActionId, invokeAction } = useSduiContext();

  return (
    <Section
      tone={section.tone as "default" | "muted" | "contrast" | "accent"}
      background={
        section.background as "transparent" | "surface" | "panel" | "glass"
      }
      padding={section.padding as "none" | "sm" | "md" | "lg"}
      gap={section.gap as "none" | "xs" | "sm" | "md" | "lg"}
      width={
        section.width as "narrow" | "content" | "default" | "wide" | "full"
      }
      border={section.border as "none" | "soft" | "strong"}
    >
      {section.header && (
        <SectionHeader
          align={section.header.align as "start" | "center" | "end"}
        >
          {section.header.kicker && <Kicker>{section.header.kicker}</Kicker>}
          {section.header.title && (
            <Heading level="3" tone="default">
              {section.header.title}
            </Heading>
          )}
          {section.header.description && (
            <Text tone="muted">{section.header.description}</Text>
          )}
        </SectionHeader>
      )}

      {section.components.map((component) => (
        <Fragment key={component.id}>
          {renderComponent(component, { depth: 0, parentType: "section" })}
        </Fragment>
      ))}

      {section.actions && section.actions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {section.actions.map((actionId) => {
            const action = actions.get(actionId);
            if (!action) return null;

            return (
              <Button
                key={actionId}
                variant="outline"
                size="sm"
                disabled={pendingActionId === actionId}
                onClick={() => void invokeAction(actionId, section.id)}
              >
                {pendingActionId === actionId ? "Working…" : action.label}
              </Button>
            );
          })}
        </div>
      )}
    </Section>
  );
}

// =============================================================================
// Canvas Renderer
// =============================================================================

interface CanvasRendererProps {
  readonly layoutProps: {
    readonly tone?: string;
    readonly padding?: string;
    readonly width?: string;
    readonly fullscreen?: boolean;
    readonly scrollable?: boolean;
    readonly overlayPlacement?: string;
    readonly overlayWidth?: string;
  };
  readonly overlay?: ReactNode;
  readonly children: ReactNode;
}

export function CanvasRenderer({
  layoutProps,
  overlay,
  children,
}: CanvasRendererProps) {
  return (
    <Canvas
      tone={layoutProps.tone as "neutral" | "dusk" | "aurora" | "paper"}
      padding={layoutProps.padding as "none" | "sm" | "md" | "lg"}
      width={layoutProps.width as "fluid" | "prose" | "wide"}
      fullscreen={layoutProps.fullscreen}
      scrollable={layoutProps.scrollable}
      overlayPlacement={
        layoutProps.overlayPlacement as
          | "bottom-center"
          | "bottom-left"
          | "bottom-right"
      }
      overlayWidth={layoutProps.overlayWidth as "narrow" | "medium" | "wide"}
      floatingOverlay={overlay}
    >
      {children}
    </Canvas>
  );
}
