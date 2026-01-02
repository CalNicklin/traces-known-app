"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChatBubbleIcon,
  FileTextIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Text,
} from "@acme/ui";
import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

import { formatDate, getUserInitials } from "~/lib/user";
import { useTRPC } from "~/trpc/react";

interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

interface ProfileContentProps {
  user: User;
}

type Tab = "reports" | "comments" | "notifications";

export function ProfileContent({ user }: ProfileContentProps) {
  const [activeTab, setActiveTab] = useState<Tab>("reports");

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback className="text-lg">
              {getUserInitials(user)}
            </AvatarFallback>
          </Avatar>
          <div>
            <Text variant="h3">{user.name}</Text>
            <Text variant="muted">{user.email}</Text>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <TabButton
          active={activeTab === "reports"}
          onClick={() => setActiveTab("reports")}
          icon={<FileTextIcon className="h-4 w-4" />}
          label="My Reports"
        />
        <TabButton
          active={activeTab === "comments"}
          onClick={() => setActiveTab("comments")}
          icon={<ChatBubbleIcon className="h-4 w-4" />}
          label="My Comments"
        />
      </div>

      {/* Tab Content */}
      {activeTab === "reports" && <MyReportsTab />}
      {activeTab === "comments" && <MyCommentsTab />}
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function MyReportsTab() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(
    trpc.report.myReports.queryOptions({ limit: 20 }),
  );

  const deleteReport = useMutation(
    trpc.report.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Report deleted");
        void queryClient.invalidateQueries({ queryKey: ["report"] });
      },
      onError: (error) => {
        toast.error(error.message ?? "Failed to delete report");
      },
    }),
  );

  const handleDelete = (reportId: string) => {
    if (confirm("Are you sure you want to delete this report?")) {
      deleteReport.mutate({ id: reportId });
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  const reports = data?.items ?? [];

  if (reports.length === 0) {
    return (
      <EmptyState
        icon={<FileTextIcon className="h-12 w-12" />}
        title="No reports yet"
        description="You haven't submitted any allergy reports yet."
        action={
          <Button asChild>
            <Link href="/report">Submit a Report</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <Card key={report.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/product/${report.productId}`}
                    className="font-medium hover:underline"
                  >
                    {report.product?.name ?? "Unknown Product"}
                  </Link>
                  {report.product?.brand && (
                    <Text variant="muted">- {report.product.brand}</Text>
                  )}
                </div>
                {report.comment && (
                  <Text variant="muted" className="line-clamp-2">
                    {report.comment}
                  </Text>
                )}
                <div className="flex items-center gap-4">
                  <Text variant="caption">
                    {formatDate(report.reportDate)}
                  </Text>
                  {report.allergenIds && report.allergenIds.length > 0 && (
                    <Text variant="caption" className="text-red-600">
                      ⚠️ Allergen reaction reported
                    </Text>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/product/${report.productId}`}>View</Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(report.id)}
                  disabled={deleteReport.isPending}
                  className="text-destructive hover:text-destructive"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {data?.hasMore && (
        <div className="text-center">
          <Text variant="muted">
            Showing {reports.length} of your reports
          </Text>
        </div>
      )}
    </div>
  );
}

function MyCommentsTab() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(
    trpc.comment.myComments.queryOptions({ limit: 20 }),
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

  const handleDelete = (commentId: string) => {
    if (confirm("Are you sure you want to delete this comment?")) {
      deleteComment.mutate({ id: commentId });
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  const comments = data?.items ?? [];

  if (comments.length === 0) {
    return (
      <EmptyState
        icon={<ChatBubbleIcon className="h-12 w-12" />}
        title="No comments yet"
        description="You haven't replied to any reports yet."
      />
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <Card key={comment.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <Text variant="muted" className="line-clamp-2">
                  {comment.content}
                </Text>
                <div className="flex items-center gap-4">
                  <Link
                    href={`/product/${comment.report?.productId}`}
                    className="text-sm text-primary hover:underline"
                  >
                    on {comment.report?.product?.name ?? "Unknown Product"}
                  </Link>
                  <Text variant="caption">
                    {formatDate(comment.createdAt)}
                  </Text>
                  {comment.updatedAt && (
                    <Text variant="caption">(edited)</Text>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/product/${comment.report?.productId}`}>
                    View
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(comment.id)}
                  disabled={deleteComment.isPending}
                  className="text-destructive hover:text-destructive"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {data?.hasMore && (
        <div className="text-center">
          <Text variant="muted">
            Showing {comments.length} of your comments
          </Text>
        </div>
      )}
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 text-muted-foreground">{icon}</div>
        <Text variant="h4" className="mb-2">
          {title}
        </Text>
        <Text variant="muted" className="mb-4">
          {description}
        </Text>
        {action}
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <Card>
      <CardContent className="flex items-center justify-center py-12">
        <Text variant="muted">Loading...</Text>
      </CardContent>
    </Card>
  );
}
