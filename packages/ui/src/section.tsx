import type { HTMLAttributes } from "react";
import * as React from "react";

import { cn } from "./utils";

type SectionTone = "default" | "muted" | "contrast" | "accent";
type SectionBackground = "transparent" | "surface" | "panel" | "glass";
type SectionPadding = "none" | "sm" | "md" | "lg";
type SectionGap = "none" | "xs" | "sm" | "md" | "lg";
type SectionWidth = "narrow" | "content" | "default" | "wide" | "full";
type SectionBleed = "none" | "x" | "y" | "all";
type SectionBorder = "none" | "soft" | "strong";

const paddingClass: Record<SectionPadding, string> = {
  none: "p-0",
  sm: "p-4",
  md: "p-6 md:p-8",
  lg: "p-8 md:p-10",
};

const gapClass: Record<SectionGap, string> = {
  none: "gap-0",
  xs: "gap-2",
  sm: "gap-4",
  md: "gap-6",
  lg: "gap-8",
};

const widthClass: Record<SectionWidth, string> = {
  narrow: "mx-auto w-full max-w-2xl",
  content: "mx-auto w-full max-w-3xl",
  default: "mx-auto w-full max-w-5xl",
  wide: "mx-auto w-full max-w-6xl",
  full: "w-full",
};

const bleedClass: Record<SectionBleed, string> = {
  none: "",
  x: "-mx-4 sm:-mx-8 lg:-mx-12",
  y: "-my-4 sm:-my-8 lg:-my-12",
  all: "-m-4 sm:-m-8 lg:-m-12",
};

const borderClass: Record<SectionBorder, string> = {
  none: "border-none",
  soft: "border border-border/50",
  strong: "border border-border",
};

const toneClass: Record<SectionTone, string> = {
  default: "text-foreground",
  muted: "text-muted-foreground",
  contrast: "text-slate-50 dark:text-slate-50",
  accent: "text-primary-foreground",
};

const backgroundClass: Record<SectionBackground, string> = {
  transparent: "bg-transparent",
  surface: "bg-card",
  panel: "bg-gradient-to-b from-background/90 to-background/60",
  glass: "bg-white/5 backdrop-blur-xl dark:bg-white/5",
};

type SectionElement = "section" | "article" | "div" | "main" | "aside";

interface SectionProps extends HTMLAttributes<HTMLElement> {
  readonly tone?: SectionTone;
  readonly background?: SectionBackground;
  readonly padding?: SectionPadding;
  readonly gap?: SectionGap;
  readonly width?: SectionWidth;
  readonly bleed?: SectionBleed;
  readonly border?: SectionBorder;
  readonly as?: SectionElement;
}

const Section = React.forwardRef<HTMLElement, SectionProps>(function Section(
  {
    tone = "default",
    background = "surface",
    padding = "lg",
    gap = "md",
    width = "default",
    bleed = "none",
    border = "soft",
    as = "section",
    className,
    children,
    ...props
  },
  ref,
) {
  const Component = as;

  return React.createElement(
    Component,
    {
      ref: ref as React.Ref<HTMLElement>,
      className: cn(
        "relative isolate flex flex-col rounded-[32px]",
        paddingClass[padding],
        gapClass[gap],
        widthClass[width],
        bleedClass[bleed],
        borderClass[border],
        backgroundClass[background],
        toneClass[tone],
        background === "glass" ? "ring-1 ring-white/15 dark:ring-white/10" : "",
        className,
      ),
      ...props,
    },
    children,
  );
});
Section.displayName = "Section";

type SectionHeaderAlign = "start" | "center" | "end";

interface SectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
  readonly align?: SectionHeaderAlign;
  readonly subdued?: boolean;
}

const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  function SectionHeader(
    { align = "start", subdued = false, className, ...props },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-2",
          align === "center"
            ? "text-center"
            : align === "end"
              ? "text-right"
              : "text-left",
          subdued ? "text-muted-foreground" : "",
          className,
        )}
        {...props}
      />
    );
  },
);
SectionHeader.displayName = "SectionHeader";

interface SectionBodyProps extends HTMLAttributes<HTMLDivElement> {
  readonly gap?: SectionGap;
  readonly columns?: 1 | 2 | 3;
  readonly alignItems?: "start" | "center" | "end";
}

const SectionBody = React.forwardRef<HTMLDivElement, SectionBodyProps>(
  function SectionBody(
    { gap = "md", columns = 1, alignItems = "start", className, ...props },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          "grid",
          gapClass[gap],
          columns === 1
            ? "grid-cols-1"
            : columns === 2
              ? "grid-cols-1 md:grid-cols-2"
              : "grid-cols-1 md:grid-cols-3",
          alignItems === "center"
            ? "items-center"
            : alignItems === "end"
              ? "items-end"
              : "items-start",
          className,
        )}
        {...props}
      />
    );
  },
);
SectionBody.displayName = "SectionBody";

type SplitBreakpoint = "sm" | "md" | "lg" | "xl" | "always";
type SplitRatio = "1:1" | "2:1" | "1:2" | "3:2" | "2:3";

const breakpointPrefix: Record<SplitBreakpoint, string> = {
  always: "",
  sm: "sm",
  md: "md",
  lg: "lg",
  xl: "xl",
};

const getPrefixedClass = (breakpoint: SplitBreakpoint, value: string) => {
  const prefix = breakpointPrefix[breakpoint];
  return prefix ? `${prefix}:${value}` : value;
};

const ratioClass: Record<SplitRatio, readonly [string, string]> = {
  "1:1": ["basis-1/2", "basis-1/2"],
  "2:1": ["basis-2/3", "basis-1/3"],
  "1:2": ["basis-1/3", "basis-2/3"],
  "3:2": ["[flex-basis:60%]", "[flex-basis:40%]"],
  "2:3": ["[flex-basis:40%]", "[flex-basis:60%]"],
};

interface SplitProps extends HTMLAttributes<HTMLDivElement> {
  readonly ratio?: SplitRatio;
  readonly stackBelow?: SplitBreakpoint;
  readonly gap?: SectionGap;
  readonly align?: "start" | "center" | "end" | "stretch";
}

const Split = React.forwardRef<HTMLDivElement, SplitProps>(function Split(
  {
    ratio = "1:1",
    stackBelow = "md",
    gap = "md",
    align = "stretch",
    className,
    children,
    ...props
  },
  ref,
) {
  const [firstChildClass, secondChildClass] = ratioClass[ratio];
  const prefixedRatio = [
    getPrefixedClass(stackBelow, `[&>*:first-child]:${firstChildClass}`),
    getPrefixedClass(stackBelow, `[&>*:last-child]:${secondChildClass}`),
  ];

  return (
    <div
      ref={ref}
      className={cn(
        "flex w-full flex-col",
        gapClass[gap],
        getPrefixedClass(stackBelow, "flex-row"),
        align === "center"
          ? "items-center"
          : align === "end"
            ? "items-end"
            : align === "stretch"
              ? "items-stretch"
              : "items-start",
        prefixedRatio,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});
Split.displayName = "Split";

type DividerVariant = "solid" | "dashed" | "glow";

interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  readonly variant?: DividerVariant;
}

const dividerClass: Record<DividerVariant, string> = {
  solid: "bg-border",
  dashed:
    "bg-[linear-gradient(to_right,transparent_0,transparent_8px,currentColor_8px,currentColor_12px)]",
  glow: "bg-gradient-to-r from-transparent via-primary/40 to-transparent",
};

const Divider = React.forwardRef<HTMLHRElement, DividerProps>(function Divider(
  { variant = "solid", className, ...props },
  ref,
) {
  return (
    <hr
      ref={ref}
      className={cn(
        "my-2 h-px border-0",
        dividerClass[variant],
        variant === "dashed" ? "text-border/70" : "",
        className,
      )}
      {...props}
    />
  );
});
Divider.displayName = "Divider";

export { Divider, Section, SectionBody, SectionHeader, Split };
export type {
  DividerProps,
  SectionBodyProps,
  SectionHeaderProps,
  SectionProps,
  SplitProps,
};
