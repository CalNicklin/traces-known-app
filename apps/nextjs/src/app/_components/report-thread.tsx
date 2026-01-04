"use client";

import { useState } from "react";
import {
  ChatBubbleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Pencil1Icon,
  TrashIcon,
} from "@radix-ui/react-icons";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Text,
} from "@acme/ui";
import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

import { authClient } from "~/auth/client";
import { formatDate, getUserInitials } from "~/lib/user";
import { useTRPC } from "~/trpc/react";
import { CommentComposer } from "./comment-composer";

interface ReportUser {
  id: string;
  name: string;
  image: string | null;
}

interface Report {
  id: string;
  userId: string;
  productId: string;
  reportType: string;
  allergenIds: string[] | null;
  comment: string | null;
  reportDate: Date;
  createdAt: Date;
  updatedAt: Date | null;
  user: ReportUser;
}

interface Comment {
  id: string;
  reportId: string;
  userId: string;
  parentCommentId: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date | null;
  user: ReportUser;
}

interface ReportThreadProps {
  report: Report;
  onReportDeleted?: () => void;
  onReportUpdated?: () => void;
}

export function ReportThread({
  report,
  onReportDeleted,
  onReportUpdated,
}: ReportThreadProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;

  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedComment, setEditedComment] = useState(report.comment ?? "");
  const [showReplyComposer, setShowReplyComposer] = useState(false);

  const isOwner = currentUserId === report.userId;

  // Fetch comments for this report
  const { data: comments = [] } = useQuery({
    ...trpc.comment.byReportId.queryOptions({ reportId: report.id }),
    enabled: isExpanded,
  });

  // Mutations
  const updateReport = useMutation(
    trpc.report.update.mutationOptions({
      onSuccess: () => {
        toast.success("Report updated");
        setIsEditing(false);
        void queryClient.invalidateQueries({ queryKey: ["report"] });
        onReportUpdated?.();
      },
      onError: (error) => {
        toast.error(error.message ?? "Failed to update report");
      },
    }),
  );

  const deleteReport = useMutation(
    trpc.report.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Report deleted");
        void queryClient.invalidateQueries({ queryKey: ["report"] });
        onReportDeleted?.();
      },
      onError: (error) => {
        toast.error(error.message ?? "Failed to delete report");
      },
    }),
  );

  const handleSaveEdit = () => {
    updateReport.mutate({
      id: report.id,
      comment: editedComment || undefined,
    });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this report?")) {
      deleteReport.mutate({ id: report.id });
    }
  };

  const handleCommentAdded = () => {
    void queryClient.invalidateQueries({
      queryKey: ["comment", "byReportId", { reportId: report.id }],
    });
    setShowReplyComposer(false);
    setIsExpanded(true);
  };

  // Group comments: direct replies to report vs nested replies
  const directComments = comments.filter((c) => !c.parentCommentId);
  const commentCount = comments.length;

  return (
    <div className="rounded-lg border p-4">
      {/* Report Header */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {report.reportType === "reaction" ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-danger/10 text-danger">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-safe/10 text-safe">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2">
          {/* User info and date */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={report.user.image ?? undefined}
                  alt={report.user.name}
                />
                <AvatarFallback className="text-xs">
                  {getUserInitials(report.user)}
                </AvatarFallback>
              </Avatar>
              <Text variant="small">{report.user.name}</Text>
              <Text variant="caption">
                {formatDate(report.reportDate)}
              </Text>
              {report.updatedAt && (
                <Text variant="caption" className="text-muted-foreground">
                  (edited)
                </Text>
              )}
            </div>

            {/* Owner actions */}
            {isOwner && !isEditing && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-8 w-8 p-0"
                >
                  <Pencil1Icon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  disabled={deleteReport.isPending}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Comment content */}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editedComment}
                onChange={(e) => setEditedComment(e.target.value)}
                className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Edit your comment..."
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={updateReport.isPending}
                >
                  {updateReport.isPending ? "Saving..." : "Save"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedComment(report.comment ?? "");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              {report.comment && (
                <Text variant="muted">{report.comment}</Text>
              )}

              <Text
                variant="caption"
                className={
                  report.reportType === "reaction"
                    ? "text-danger"
                    : "text-green-600 dark:text-green-400"
                }
              >
                {report.reportType === "reaction"
                  ? "Reported allergic reaction"
                  : "Reported safe experience"}
              </Text>
            </>
          )}

          {/* Actions row */}
          <div className="flex items-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" />
              )}
              <ChatBubbleIcon className="h-4 w-4" />
              <span>
                {commentCount} {commentCount === 1 ? "reply" : "replies"}
              </span>
            </button>

            {currentUserId && (
              <button
                type="button"
                onClick={() => {
                  setShowReplyComposer(!showReplyComposer);
                  if (!isExpanded) setIsExpanded(true);
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Reply
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded comments section */}
      {isExpanded && (
        <div className="ml-11 mt-4 space-y-4 border-l-2 border-muted pl-4">
          {/* Reply composer */}
          {showReplyComposer && currentUserId && (
            <CommentComposer
              reportId={report.id}
              onSuccess={handleCommentAdded}
              onCancel={() => setShowReplyComposer(false)}
            />
          )}

          {/* Comments list */}
          {directComments.length > 0 ? (
            directComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                allComments={comments}
                currentUserId={currentUserId}
                reportId={report.id}
              />
            ))
          ) : (
            !showReplyComposer && (
              <Text variant="muted" className="text-sm">
                No replies yet
              </Text>
            )
          )}
        </div>
      )}
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  allComments: Comment[];
  currentUserId: string | undefined;
  reportId: string;
  depth?: number;
}

function CommentItem({
  comment,
  allComments,
  currentUserId,
  reportId,
  depth = 0,
}: CommentItemProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [showReplyComposer, setShowReplyComposer] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(depth > 1);

  const isOwner = currentUserId === comment.userId;
  const replies = allComments.filter((c) => c.parentCommentId === comment.id);
  const maxDepth = 3;

  const updateComment = useMutation(
    trpc.comment.update.mutationOptions({
      onSuccess: () => {
        toast.success("Comment updated");
        setIsEditing(false);
        void queryClient.invalidateQueries({ queryKey: ["comment"] });
      },
      onError: (error) => {
        toast.error(error.message ?? "Failed to update comment");
      },
    }),
  );

  const deleteComment = useMutation(
    trpc.comment.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Comment deleted");
        void queryClient.invalidateQueries({ queryKey: ["comment"] });
      },
      onError: (error) => {
        toast.error(error.message ?? "Failed to delete comment");
      },
    }),
  );

  const handleSaveEdit = () => {
    updateComment.mutate({
      id: comment.id,
      content: editedContent,
    });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this comment?")) {
      deleteComment.mutate({ id: comment.id });
    }
  };

  const handleReplyAdded = () => {
    void queryClient.invalidateQueries({ queryKey: ["comment"] });
    setShowReplyComposer(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <Avatar className="h-6 w-6 flex-shrink-0">
          <AvatarImage
            src={comment.user.image ?? undefined}
            alt={comment.user.name}
          />
          <AvatarFallback className="text-xs">
            {getUserInitials(comment.user)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Text variant="small">{comment.user.name}</Text>
              <Text variant="caption">
                {formatDate(comment.createdAt)}
              </Text>
              {comment.updatedAt && (
                <Text variant="caption" className="text-muted-foreground">
                  (edited)
                </Text>
              )}
            </div>

            {isOwner && !isEditing && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-6 w-6 p-0"
                >
                  <Pencil1Icon className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  disabled={deleteComment.isPending}
                >
                  <TrashIcon className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={updateComment.isPending || !editedContent.trim()}
                >
                  {updateComment.isPending ? "Saving..." : "Save"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedContent(comment.content);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Text variant="muted" className="text-sm">
              {comment.content}
            </Text>
          )}

          {/* Reply action */}
          {currentUserId && depth < maxDepth && !isEditing && (
            <button
              type="button"
              onClick={() => setShowReplyComposer(!showReplyComposer)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Reply
            </button>
          )}
        </div>
      </div>

      {/* Reply composer for this comment */}
      {showReplyComposer && currentUserId && (
        <div className="ml-8">
          <CommentComposer
            reportId={reportId}
            parentCommentId={comment.id}
            onSuccess={handleReplyAdded}
            onCancel={() => setShowReplyComposer(false)}
          />
        </div>
      )}

      {/* Nested replies */}
      {replies.length > 0 && (
        <div className="ml-8 space-y-2 border-l border-muted pl-3">
          {isCollapsed ? (
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ChevronDownIcon className="h-3 w-3" />
              Show {replies.length} {replies.length === 1 ? "reply" : "replies"}
            </button>
          ) : (
            <>
              {depth >= maxDepth - 1 && (
                <button
                  type="button"
                  onClick={() => setIsCollapsed(true)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ChevronUpIcon className="h-3 w-3" />
                  Hide replies
                </button>
              )}
              {replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  allComments={allComments}
                  currentUserId={currentUserId}
                  reportId={reportId}
                  depth={depth + 1}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
