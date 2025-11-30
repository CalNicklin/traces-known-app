import { cn } from "@acme/ui";

interface ChatBubbleProps {
  readonly role: "assistant" | "user";
  readonly content: string;
  readonly isStreaming?: boolean;
}

export function ChatBubble({
  role,
  content,
  isStreaming = false,
}: ChatBubbleProps) {
  return (
    <div
      className={cn(
        "max-w-2xl rounded-3xl px-4 py-3 text-sm shadow-sm ring-1 ring-border/40 transition-colors",
        role === "assistant"
          ? "bg-primary/10 text-foreground"
          : "ml-auto bg-secondary/80 text-foreground",
      )}
    >
      <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
      {isStreaming ? (
        <span className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/70" />
          <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/70 [animation-delay:120ms]" />
          <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/70 [animation-delay:240ms]" />
        </span>
      ) : null}
    </div>
  );
}


