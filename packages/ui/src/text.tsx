import type { VariantProps } from "class-variance-authority";
import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "@acme/ui";

const textVariants = cva("", {
  variants: {
    variant: {
      h1: "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
      h2: "scroll-m-20 text-3xl font-bold tracking-tight",
      h3: "scroll-m-20 text-2xl font-semibold tracking-tight",
      h4: "scroll-m-20 text-xl font-semibold tracking-tight",
      p: "leading-7",
      lead: "text-xl text-muted-foreground",
      large: "text-lg font-semibold",
      small: "text-sm font-medium leading-none",
      muted: "text-sm text-muted-foreground",
      caption: "text-xs text-muted-foreground",
    },
  },
  defaultVariants: {
    variant: "p",
  },
});

type TextElement =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "p"
  | "span"
  | "div";

type TextVariant = NonNullable<VariantProps<typeof textVariants>["variant"]>;

const variantElementMap: Record<TextVariant, TextElement> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  p: "p",
  lead: "p",
  large: "p",
  small: "span",
  muted: "span",
  caption: "span",
};

interface TextProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof textVariants> {
  /** Override the default HTML element for this variant */
  as?: TextElement;
}

const Text = React.forwardRef<HTMLElement, TextProps>(
  ({ className, variant, as, children, ...props }, ref) => {
    const resolvedVariant = variant ?? "p";
    const Component = as ?? variantElementMap[resolvedVariant];

    return React.createElement(
      Component,
      {
        ref,
        className: cn(textVariants({ variant: resolvedVariant }), className),
        ...props,
      },
      children,
    );
  },
);
Text.displayName = "Text";

export { Text, textVariants };
export type { TextProps, TextVariant, TextElement };
