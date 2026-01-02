"use client";

import Link from "next/link";
import { BellIcon, CheckIcon } from "@radix-ui/react-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Text,
} from "@acme/ui";
import { Button } from "@acme/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import { toast } from "@acme/ui/toast";

import { formatDate, getUserInitials } from "~/lib/user";
import { useTRPC } from "~/trpc/react";

export function NotificationDropdown() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Get unread count
  const { data: unreadCount = 0 } = useQuery(
    trpc.notification.unreadCount.queryOptions(),
  );

  // Get recent notifications
  const { data: notificationsData } = useQuery(
    trpc.notification.list.queryOptions({ limit: 10 }),
  );

  const notifications = notificationsData?.items ?? [];

  // Mark all read mutation
  const markAllRead = useMutation(
    trpc.notification.markAllRead.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ["notification"] });
      },
      onError: (error) => {
        toast.error(error.message ?? "Failed to mark notifications as read");
      },
    }),
  );

  // Mark single notification read
  const markRead = useMutation(
    trpc.notification.markRead.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ["notification"] });
      },
    }),
  );

  const handleNotificationClick = (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      markRead.mutate({ id: notificationId });
    }
  };

  const getNotificationMessage = (notification: (typeof notifications)[0]) => {
    const actorName = notification.actor?.name ?? "Someone";
    const productName = notification.report?.product?.name ?? "a product";

    if (notification.type === "reply_to_report") {
      return `${actorName} replied to your report on ${productName}`;
    }
    return `${actorName} replied to your comment on ${productName}`;
  };

  const getNotificationLink = (notification: (typeof notifications)[0]) => {
    if (notification.report?.productId) {
      return `/product/${notification.report.productId}`;
    }
    return "#";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0">
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <CheckIcon className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length > 0 ? (
          <>
            {notifications.map((notification) => (
              <DropdownMenuItem key={notification.id} asChild>
                <Link
                  href={getNotificationLink(notification)}
                  onClick={() =>
                    handleNotificationClick(notification.id, notification.isRead)
                  }
                  className={`flex cursor-pointer items-start gap-3 p-3 ${
                    !notification.isRead ? "bg-muted/50" : ""
                  }`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage
                      src={notification.actor?.image ?? undefined}
                      alt={notification.actor?.name ?? "User"}
                    />
                    <AvatarFallback className="text-xs">
                      {notification.actor
                        ? getUserInitials(notification.actor)
                        : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <Text variant="small" className="line-clamp-2">
                      {getNotificationMessage(notification)}
                    </Text>
                    <Text variant="caption">
                      {formatDate(notification.createdAt)}
                    </Text>
                  </div>
                  {!notification.isRead && (
                    <div className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                  )}
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/profile"
                className="flex cursor-pointer justify-center p-2"
              >
                <Text variant="small" className="text-primary">
                  View all activity
                </Text>
              </Link>
            </DropdownMenuItem>
          </>
        ) : (
          <div className="p-4 text-center">
            <Text variant="muted">No notifications yet</Text>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
