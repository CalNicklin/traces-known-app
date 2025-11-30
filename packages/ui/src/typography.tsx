import type { VariantProps } from "class-variance-authority";
import type { CSSProperties, HTMLAttributes } from "react";
import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "./utils";

type HeadingLevel = "display" | "1" | "2" | "3" | "4" | "5" | "6";
type HeadingAlign = "start" | "center" | "end";
type HeadingTone = "default" | "muted" | "accent";
type HeadingElementTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

const headingVariants = cva("font-semibold tracking-tight text-foreground", {
  variants: {
    level: {
      display: "text-5xl leading-tight md:text-6xl",
      "1": "text-4xl leading-tight md:text-5xl",
      "2": "text-3xl leading-tight md:text-4xl",
      "3": "text-2xl leading-tight md:text-3xl",
      "4": "text-xl leading-snug md:text-2xl",
      "5": "text-lg leading-snug md:text-xl",
      "6": "text-base uppercase tracking-[0.14em]",
    },
    align: {
      start: "text-left",
      center: "text-center",
      end: "text-right",
    },
    tone: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      accent: "text-primary",
    },
    weight: {
      light: "font-light",
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
  },
  defaultVariants: {
    level: "2",
    align: "start",
    tone: "default",
    weight: "semibold",
  },
});

const headingTagMap: Record<HeadingLevel, HeadingElementTag> = {
  display: "h1",
  "1": "h1",
  "2": "h2",
  "3": "h3",
  "4": "h4",
  "5": "h5",
  "6": "h6",
};

interface HeadingProps
  extends Omit<HTMLAttributes<HTMLHeadingElement>, "color">,
    VariantProps<typeof headingVariants> {
  readonly as?: HeadingElementTag;
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  function Heading(
    { as, level = "2", align, tone, weight, className, ...props },
    ref,
  ) {
    const resolvedLevel = (level ?? "2") as HeadingLevel;
    const Component = as ?? headingTagMap[resolvedLevel];

    return (
      <Component
        ref={ref}
        className={cn(
          headingVariants({ level: resolvedLevel, align, tone, weight }),
          className,
        )}
        {...props}
      />
    );
  },
);
Heading.displayName = "Heading";

type TextElement = "p" | "span" | "div" | "label" | "strong";

const textVariants = cva("text-base leading-relaxed text-foreground", {
  variants: {
    size: {
      xs: "text-[13px] leading-5",
      sm: "text-sm leading-6",
      md: "text-base leading-7",
      lg: "text-lg leading-8",
      xl: "text-xl leading-9",
    },
    tone: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      accent: "text-primary",
      success: "text-emerald-500 dark:text-emerald-400",
      warning: "text-amber-500 dark:text-amber-400",
      danger: "text-destructive",
    },
    emphasis: {
      none: "font-normal",
      medium: "font-medium",
      strong: "font-semibold",
    },
    align: {
      start: "text-left",
      center: "text-center",
      end: "text-right",
      justify: "text-justify",
    },
    casing: {
      normal: "",
      uppercase: "uppercase tracking-[0.16em]",
      caps: "text-xs uppercase tracking-[0.24em]",
    },
    wrap: {
      normal: "break-words",
      balance: "[text-wrap:balance]",
      pretty: "[text-wrap:pretty]",
      nowrap: "whitespace-nowrap",
    },
  },
  defaultVariants: {
    size: "md",
    tone: "default",
    emphasis: "none",
    align: "start",
    casing: "normal",
    wrap: "normal",
  },
});

interface TextProps
  extends Omit<HTMLAttributes<HTMLElement>, "color">,
    VariantProps<typeof textVariants> {
  readonly as?: TextElement;
  readonly clampLines?: number;
}

const Text = React.forwardRef<HTMLElement, TextProps>(function Text(
  {
    as = "p",
    size,
    tone,
    emphasis,
    align,
    casing,
    wrap,
    clampLines,
    className,
    style,
    ...props
  },
  ref,
) {
  const Component = as;
  const clampStyles: CSSProperties | undefined = clampLines
    ? {
        WebkitLineClamp: clampLines,
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }
    : undefined;

  return React.createElement(Component, {
    ref,
    className: cn(
      textVariants({ size, tone, emphasis, align, casing, wrap }),
      className,
    ),
    style: { ...clampStyles, ...style },
    ...props,
  });
});
Text.displayName = "Text";

const kickerVariants = cva(
  "text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground",
  {
    variants: {
      tone: {
        default: "text-muted-foreground",
        accent: "text-primary",
        subtle: "text-foreground/70",
      },
      align: {
        start: "text-left",
        center: "text-center",
        end: "text-right",
      },
    },
    defaultVariants: {
      tone: "default",
      align: "start",
    },
  },
);

interface KickerProps extends HTMLAttributes<HTMLDivElement> {
  readonly tone?: VariantProps<typeof kickerVariants>["tone"];
  readonly align?: HeadingAlign;
}

const Kicker = React.forwardRef<HTMLDivElement, KickerProps>(function Kicker(
  { tone, align, className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(kickerVariants({ tone, align }), className)}
      {...props}
    />
  );
});
Kicker.displayName = "Kicker";

const proseVariants = cva(
  "prose prose-neutral dark:prose-invert max-w-none [&_:where(img,video)]:rounded-2xl [&_:where(img,video)]:shadow-lg",
  {
    variants: {
      size: {
        sm: "prose-sm",
        md: "prose-base",
        lg: "prose-lg",
      },
      bleed: {
        none: "",
        readingWidth: "mx-auto max-w-3xl",
      },
    },
    defaultVariants: {
      size: "md",
      bleed: "none",
    },
  },
);

interface ProseProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof proseVariants> {}

const Prose = React.forwardRef<HTMLDivElement, ProseProps>(function Prose(
  { size, bleed, className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(proseVariants({ size, bleed }), className)}
      {...props}
    />
  );
});
Prose.displayName = "Prose";

export { Heading, Kicker, Prose, Text };
export type { HeadingLevel, HeadingProps, HeadingTone, TextProps };
