"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@acme/ui";

import type { RouterOutputs } from "@acme/api";

import { useTRPC } from "~/trpc/react";

interface RecentReportsPanelProps {
  scope: "latest" | "mine";
}

export function RecentReportsPanel({ scope }: RecentReportsPanelProps) {
  if (scope === "mine") {
    return <RecentReportsMine />;
  }
  return <RecentReportsLatest />;
}

export function RecentReportsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent reports</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

function RecentReportsMine() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.report.mine.queryOptions({ limit: 10 }),
  );

  return (
    <RecentReportsList
      scope="mine"
      data={data}
    />
  );
}

function RecentReportsLatest() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.report.latest.queryOptions({ limit: 10 }),
  );

  return (
    <RecentReportsList
      scope="latest"
      data={data}
    />
  );
}

function RecentReportsList({
  data,
  scope,
}: {
  data: RouterOutputs["report"]["latest"] | RouterOutputs["report"]["mine"];
  scope: "mine" | "latest";
}) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No reports yet</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {scope === "mine"
            ? "You haven't logged any reactions yet. Use the report form to keep track."
            : "No community reports have been recorded recently."}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {scope === "mine" ? "My recent reports" : "Community activity"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((report) => (
          <div
            key={report.id}
            className="rounded-lg border p-3 text-sm leading-relaxed"
          >
            {"product" in report && report.product ? (
              <div>
                <p className="font-semibold">{report.product.name}</p>
                {report.product.brand && (
                  <p className="text-xs text-muted-foreground">
                    {report.product.brand}
                  </p>
                )}
              </div>
            ) : null}
            {"user" in report && report.user ? (
              <div className="mt-2 flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={report.user.image ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {report.user.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs">{report.user.name}</span>
              </div>
            ) : null}
            {report.comment && (
              <p className="mt-2 text-muted-foreground">{report.comment}</p>
            )}
            {report.allergenIds && report.allergenIds.length > 0 && (
              <p className="mt-1 text-xs text-destructive">
                Allergens flagged: {report.allergenIds.length}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

