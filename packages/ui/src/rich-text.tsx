import type { HTMLAttributes, ReactNode } from "react";
import * as React from "react";

import type { DividerProps } from "./section";
import type {
  HeadingLevel,
  HeadingProps,
  HeadingTone,
  TextProps,
} from "./typography";
import { Divider } from "./section";
import { Heading, Kicker, Text } from "./typography";
import { cn } from "./utils";

type RichTextMark = "bold" | "italic" | "underline" | "code" | "subtle";

interface RichTextSpan {
  readonly text: string;
  readonly marks?: readonly RichTextMark[];
}

interface ParagraphNode {
  readonly type: "paragraph";
  readonly spans: readonly RichTextSpan[];
  readonly align?: TextProps["align"];
  readonly tone?: TextProps["tone"];
  readonly emphasis?: TextProps["emphasis"];
}

interface HeadingNode {
  readonly type: "heading";
  readonly level?: HeadingLevel;
  readonly text: string;
  readonly tone?: HeadingTone;
  readonly align?: HeadingProps["align"];
  readonly kicker?: string;
}

interface ListNode {
  readonly type: "list";
  readonly ordered?: boolean;
  readonly items: readonly ParagraphNode[];
}

interface QuoteNode {
  readonly type: "quote";
  readonly text: string;
  readonly attribution?: string;
}

interface DividerNode {
  readonly type: "divider";
  readonly variant?: DividerProps["variant"];
}

type RichTextNode =
  | ParagraphNode
  | HeadingNode
  | ListNode
  | QuoteNode
  | DividerNode;

type ParagraphSpacing = "compact" | "normal" | "loose";

const markClass: Record<RichTextMark, string> = {
  bold: "font-semibold",
  italic: "italic",
  underline: "underline decoration-dotted",
  code: "rounded-md bg-muted px-1.5 py-0.5 font-mono text-[13px]",
  subtle: "text-muted-foreground",
};

const paragraphSpacingClass: Record<ParagraphSpacing, string> = {
  compact: "space-y-2",
  normal: "space-y-3",
  loose: "space-y-4",
};

interface RichTextBlockProps extends HTMLAttributes<HTMLDivElement> {
  readonly nodes: readonly RichTextNode[];
  readonly spacing?: ParagraphSpacing;
}

const RichTextBlock = React.forwardRef<HTMLDivElement, RichTextBlockProps>(
  function RichTextBlock(
    { nodes, spacing = "normal", className, ...props },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col",
          paragraphSpacingClass[spacing],
          className,
        )}
        {...props}
      >
        {nodes.map((node, index) => (
          <React.Fragment key={`${node.type}-${index}`}>
            {renderNode(node)}
          </React.Fragment>
        ))}
      </div>
    );
  },
);
RichTextBlock.displayName = "RichTextBlock";

const renderNode = (node: RichTextNode): ReactNode => {
  switch (node.type) {
    case "paragraph":
      return (
        <Text
          align={node.align}
          tone={node.tone}
          emphasis={node.emphasis}
          as="p"
        >
          {node.spans.map((span, spanIndex) => (
            <span
              key={`${span.text}-${spanIndex}`}
              className={cn(span.marks?.map((mark) => markClass[mark]))}
            >
              {span.text}
            </span>
          ))}
        </Text>
      );
    case "heading":
      return (
        <div className="space-y-2">
          {node.kicker ? (
            <Kicker className="text-xs uppercase tracking-[0.28em]">
              {node.kicker}
            </Kicker>
          ) : null}
          <Heading
            level={node.level ?? "3"}
            tone={node.tone}
            align={node.align}
          >
            {node.text}
          </Heading>
        </div>
      );
    case "list": {
      const ListTag: "ol" | "ul" = node.ordered ? "ol" : "ul";
      const listBaseClass = node.ordered ? "list-decimal" : "list-disc";
      return (
        <ListTag
          className={cn(
            "ml-6 space-y-2 text-sm text-muted-foreground marker:text-muted-foreground",
            listBaseClass,
          )}
        >
          {node.items.map((item, itemIndex) => (
            <li key={`list-item-${itemIndex}`}>
              {renderNode({ ...item, type: "paragraph" })}
            </li>
          ))}
        </ListTag>
      );
    }
    case "quote":
      return (
        <figure className="space-y-2 rounded-3xl border border-border/60 bg-background/80 p-6">
          <blockquote className="text-lg leading-relaxed text-foreground">
            “{node.text}”
          </blockquote>
          {node.attribution ? (
            <figcaption className="text-sm text-muted-foreground">
              — {node.attribution}
            </figcaption>
          ) : null}
        </figure>
      );
    case "divider":
      return <Divider variant={node.variant} />;
    default:
      return assertNever(node);
  }
};

const assertNever = (value: never): never => {
  throw new Error(`Unhandled rich text node: ${JSON.stringify(value)}`);
};

export type {
  DividerNode,
  HeadingNode,
  ListNode,
  ParagraphNode,
  ParagraphSpacing,
  QuoteNode,
  RichTextBlockProps,
  RichTextMark,
  RichTextNode,
  RichTextSpan,
};
export { RichTextBlock };
