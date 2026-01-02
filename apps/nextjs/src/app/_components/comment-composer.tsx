"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";

interface CommentComposerProps {
  reportId: string;
  parentCommentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  placeholder?: string;
}

export function CommentComposer({
  reportId,
  parentCommentId,
  onSuccess,
  onCancel,
  placeholder = "Write a reply...",
}: CommentComposerProps) {
  const trpc = useTRPC();
  const [content, setContent] = useState("");

  const createComment = useMutation(
    trpc.comment.create.mutationOptions({
      onSuccess: () => {
        toast.success("Reply posted");
        setContent("");
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message ?? "Failed to post reply");
      },
    }),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    createComment.mutate({
      reportId,
      parentCommentId,
      content: content.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        disabled={createComment.isPending}
      />
      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={createComment.isPending || !content.trim()}
        >
          {createComment.isPending ? "Posting..." : "Post Reply"}
        </Button>
        {onCancel && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onCancel}
            disabled={createComment.isPending}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
