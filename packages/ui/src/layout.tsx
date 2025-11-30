import type { HTMLAttributes, ReactNode } from "react";
import * as React from "react";

import { cn } from "./utils";

type SpaceScale = "none" | "xs" | "sm" | "md" | "lg" | "xl";
type Align = "start" | "center" | "end" | "stretch";
type Justify = "start" | "center" | "end" | "between";

const gapClass: Record<SpaceScale, string> = {
  none: "gap-0",
  xs: "gap-1.5",
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
};

const paddingClass: Record<SpaceScale, string> = {
  none: "p-0",
  xs: "p-2",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
  xl: "p-12",
};

const alignClass: Record<Align, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};

const justifyClass: Record<Justify, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
};

interface StackProps extends HTMLAttributes<HTMLDivElement> {
  readonly gap?: SpaceScale;
  readonly padding?: SpaceScale;
  readonly align?: Align;
  readonly justify?: Justify;
  readonly fullHeight?: boolean;
  readonly bordered?: boolean;
  readonly radius?: "none" | "md" | "xl";
  readonly shadow?: "none" | "sm" | "md";
}

const Stack = React.forwardRef<HTMLDivElement, StackProps>(function Stack(
  {
    gap = "md",
    padding = "none",
    align = "stretch",
    justify = "start",
    fullHeight = false,
    bordered = false,
    radius = "none",
    shadow = "none",
    className,
    ...props
  },
  ref,
) {
  const radiusClass =
    radius === "md" ? "rounded-2xl" : radius === "xl" ? "rounded-3xl" : "";
  const shadowClass =
    shadow === "md"
      ? "shadow-xl shadow-black/10 dark:shadow-black/40"
      : shadow === "sm"
        ? "shadow-md shadow-black/5 dark:shadow-black/30"
        : "";

  return (
    <div
      ref={ref}
      className={cn(
        "flex w-full flex-col",
        gapClass[gap],
        paddingClass[padding],
        alignClass[align],
        justifyClass[justify],
        bordered ? "border border-border bg-background/80" : "",
        radiusClass,
        shadowClass,
        fullHeight ? "min-h-0 flex-1" : "",
        className,
      )}
      {...props}
    />
  );
});
Stack.displayName = "Stack";

interface InlineProps extends HTMLAttributes<HTMLDivElement> {
  readonly gap?: SpaceScale;
  readonly align?: Align;
  readonly justify?: Justify;
  readonly wrap?: boolean;
  readonly divide?: boolean;
}

const Inline = React.forwardRef<HTMLDivElement, InlineProps>(function Inline(
  {
    gap = "sm",
    align = "center",
    justify = "start",
    wrap = false,
    divide = false,
    className,
    ...props
  },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex w-full flex-row",
        wrap ? "flex-wrap" : "flex-nowrap",
        gapClass[gap],
        alignClass[align],
        justifyClass[justify],
        divide ? "divide-x divide-border [&>*]:px-4" : "",
        className,
      )}
      {...props}
    />
  );
});
Inline.displayName = "Inline";

type GridColumns = 1 | 2 | 3 | 4 | 5 | 6 | 12;

const getColumnClass = (prefix: string, columns?: GridColumns) => {
  if (!columns) {
    return undefined;
  }
  return `${prefix}${prefix ? ":" : ""}grid-cols-${columns}`;
};

interface GridProps extends HTMLAttributes<HTMLDivElement> {
  readonly columns?: GridColumns;
  readonly smColumns?: GridColumns;
  readonly mdColumns?: GridColumns;
  readonly lgColumns?: GridColumns;
  readonly xlColumns?: GridColumns;
  readonly gap?: SpaceScale;
  readonly align?: Align;
  readonly justify?: Justify;
  readonly equalHeight?: boolean;
}

const Grid = React.forwardRef<HTMLDivElement, GridProps>(function Grid(
  {
    columns = 1,
    smColumns,
    mdColumns,
    lgColumns,
    xlColumns,
    gap = "lg",
    align = "stretch",
    justify = "start",
    equalHeight = false,
    className,
    ...props
  },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "grid w-full",
        gapClass[gap],
        alignClass[align],
        justifyClass[justify],
        getColumnClass("", columns),
        getColumnClass("sm", smColumns),
        getColumnClass("md", mdColumns),
        getColumnClass("lg", lgColumns),
        getColumnClass("xl", xlColumns),
        equalHeight ? "[&>*]:h-full" : "",
        className,
      )}
      {...props}
    />
  );
});
Grid.displayName = "Grid";

type SurfaceTone = "plain" | "muted" | "accent" | "elevated" | "subtle";
type SurfacePadding = Exclude<SpaceScale, "xs">;
type SurfaceInteraction = "static" | "interactive";

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  readonly tone?: SurfaceTone;
  readonly padding?: SurfacePadding;
  readonly interaction?: SurfaceInteraction;
  readonly inset?: boolean;
  readonly blur?: boolean;
}

const toneClass: Record<SurfaceTone, string> = {
  plain: "bg-card text-card-foreground border-border",
  muted: "bg-muted text-muted-foreground border-transparent",
  accent: "bg-primary/10 text-primary border-primary/30",
  elevated:
    "bg-background/90 text-foreground border-white/10 shadow-lg backdrop-blur",
  subtle: "bg-background text-foreground/80 border-border/70",
};

const interactionClass: Record<SurfaceInteraction, string> = {
  static: "",
  interactive:
    "transition-shadow hover:shadow-xl hover:shadow-primary/20 focus-within:shadow-xl focus-within:shadow-primary/30 cursor-pointer",
};

const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(function Surface(
  {
    tone = "plain",
    padding = "md",
    interaction = "static",
    inset = false,
    blur = false,
    className,
    ...props
  },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-3xl border",
        toneClass[tone],
        paddingClass[padding],
        interactionClass[interaction],
        inset ? "ring-1 ring-inset ring-white/10 dark:ring-black/20" : "",
        blur ? "backdrop-blur-md" : "",
        className,
      )}
      {...props}
    />
  );
});
Surface.displayName = "Surface";

type CanvasTone = "neutral" | "dusk" | "aurora" | "paper";
type CanvasPadding = "none" | "sm" | "md" | "lg";
type CanvasWidth = "fluid" | "prose" | "wide";
type OverlayPlacement = "bottom-center" | "bottom-left" | "bottom-right";

const canvasToneClass: Record<CanvasTone, string> = {
  neutral: "bg-background text-foreground",
  dusk: "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100",
  aurora:
    "bg-gradient-to-br from-indigo-900 via-slate-900 to-emerald-900 text-slate-100",
  paper:
    "bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_transparent_55%)] text-slate-900 dark:text-slate-100",
};

const canvasPaddingClass: Record<CanvasPadding, string> = {
  none: "p-0",
  sm: "p-4",
  md: "p-6",
  lg: "p-10",
};

const canvasWidthClass: Record<CanvasWidth, string> = {
  fluid: "w-full",
  prose: "mx-auto w-full max-w-3xl",
  wide: "mx-auto w-full max-w-6xl",
};

// Updated overlay placement with responsive behavior
// Currently hardcoded to bottom-center, but kept for future extensibility
const _overlayPlacementClass: Record<OverlayPlacement, string> = {
  // Mobile: full width with small margin; Desktop: centered with max-width
  "bottom-center": cn(
    "bottom-4 left-1/2 -translate-x-1/2",
    "w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)]", // Full width on mobile with margin
    "px-0",
  ),
  "bottom-left": "bottom-4 left-4 sm:left-6",
  "bottom-right": "bottom-4 right-4 sm:right-6",
};

// Responsive overlay width classes
const overlayWidthClass = {
  narrow: "max-w-full sm:max-w-lg",
  medium: "max-w-full sm:max-w-2xl",
  wide: "max-w-full sm:max-w-4xl",
} as const;

interface CanvasProps extends HTMLAttributes<HTMLDivElement> {
  readonly tone?: CanvasTone;
  readonly padding?: CanvasPadding;
  readonly width?: CanvasWidth;
  readonly fullscreen?: boolean;
  readonly scrollable?: boolean;
  readonly floatingOverlay?: ReactNode;
  readonly overlayPlacement?: OverlayPlacement;
  readonly overlayWidth?: "narrow" | "medium" | "wide";
  readonly stickyHeader?: ReactNode;
}

const Canvas = React.forwardRef<HTMLDivElement, CanvasProps>(function Canvas(
  {
    tone = "neutral",
    padding = "lg",
    width = "wide",
    fullscreen = true,
    scrollable = true,
    floatingOverlay,
    overlayPlacement: _overlayPlacement = "bottom-center",
    overlayWidth = "medium",
    stickyHeader,
    className,
    children,
    ...props
  },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex w-full flex-col",
        canvasToneClass[tone],
        canvasPaddingClass[padding],
        fullscreen ? "min-h-screen" : "",
        scrollable ? "overflow-y-auto" : "overflow-hidden",
        className,
      )}
      {...props}
    >
      {/* Content area with bottom padding when overlay is present */}
      <div
        className={cn(
          canvasWidthClass[width],
          // Add bottom padding to prevent content from being hidden behind overlay
          floatingOverlay && "pb-40 sm:pb-44",
        )}
      >
        {stickyHeader ? (
          <div className="bg-inherit/80 sticky top-0 z-10 mb-6 py-4 backdrop-blur-md">
            {stickyHeader}
          </div>
        ) : null}
        {children}
      </div>

      {/* Floating overlay - fixed at bottom with responsive sizing */}
      {floatingOverlay ? (
        <div
          className={cn(
            "fixed bottom-4 left-1/2 z-30 -translate-x-1/2",
            "w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)]",
            overlayWidthClass[overlayWidth],
          )}
          role="region"
          aria-label="Chat input"
        >
          <div
            className={cn(
              "mx-auto w-full",
              // Responsive border radius: less rounded on mobile
              "rounded-2xl sm:rounded-full",
              // Background and styling
              "border border-border/40 bg-background/95 p-3 sm:p-4",
              "shadow-2xl shadow-black/20 backdrop-blur-lg",
              // Responsive max-width
              overlayWidthClass[overlayWidth],
              // Animation
              "duration-300 animate-in fade-in slide-in-from-bottom-4",
            )}
          >
            {floatingOverlay}
          </div>
        </div>
      ) : null}
    </div>
  );
});
Canvas.displayName = "Canvas";

export { Canvas, Grid, Inline, Stack, Surface };
export type { CanvasProps, GridProps, InlineProps, StackProps, SurfaceProps };
