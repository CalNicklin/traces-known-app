"use client";

import { Suspense } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";

import { Badge, Card, CardContent, Skeleton } from "@acme/ui";

import { AgentBlock } from "~/app/_lib/agent-schema";
import { AllergenPreferencesPanel } from "../allergen-preferences";
import { RecentReportsPanel } from "../recent-reports";
import { ReportForm } from "../report-form";
import { SearchResultCard } from "../search-result-card";
import { useTRPC } from "~/trpc/react";

interface AgentBlockRendererProps {
  block: AgentBlock;
}

export function AgentBlockRenderer({ block }: AgentBlockRendererProps) {
  if (block.kind === "text") {
    return (
      <div
        className={`max-w-xl rounded-2xl px-4 py-3 text-sm ${
          block.role === "assistant"
            ? "bg-primary/10 text-foreground"
            : "bg-muted"
        }`}
      >
        {block.text}
      </div>
    );
  }

  switch (block.component) {
    case "lookupResults":
      return (
        <Suspense
          fallback={<CardSkeleton title={`Searching "${block.props.query}"`} />}
        >
          <LookupResultsBlock query={block.props.query} />
        </Suspense>
      );
    case "productSummary":
      return (
        <Suspense fallback={<CardSkeleton title="Loading product insights" />}>
          <ProductSummaryBlock productId={block.props.productId} />
        </Suspense>
      );
    case "reportForm":
      return (
        <Suspense fallback={<CardSkeleton title="Preparing report form" />}>
          <ReportFormBlock productId={block.props.productId} />
        </Suspense>
      );
    case "allergenPreferences":
      return (
        <Suspense fallback={<CardSkeleton title="Loading allergens" />}>
          <AllergenPreferencesPanel />
        </Suspense>
      );
    case "recentReports":
      return (
        <Suspense fallback={<CardSkeleton title="Fetching reports" />}>
          <RecentReportsPanel scope={block.props.scope} />
        </Suspense>
      );
    default:
      return null;
  }
}

function LookupResultsBlock({ query }: { query: string }) {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.product.search.queryOptions({
      query,
      page: 1,
      limit: 5,
    }),
  );

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          No products found for “{query}”.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((product) => (
        <SearchResultCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function ProductSummaryBlock({ productId }: { productId: string }) {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.product.detail.queryOptions({ id: productId }),
  );

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Unable to load product details.
        </CardContent>
      </Card>
    );
  }

  const { product, stats } = data;

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div>
          <h3 className="text-xl font-semibold">{product.name}</h3>
          {product.brand && (
            <p className="text-sm text-muted-foreground">{product.brand}</p>
          )}
        </div>

        {product.aiSummary ? (
          <div className="rounded-lg bg-primary/5 p-4 text-sm">
            <p className="font-medium">
              AI Risk Level: {product.aiSummary.riskLevel}
            </p>
            <p className="mt-2 text-muted-foreground">
              {product.aiSummary.summary}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.aiSummary.highlights.map((item) => (
                <Badge key={item} variant="secondary">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Total reports</p>
            <p className="text-2xl font-semibold">{stats.totalReports}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Last reported</p>
            <p className="text-lg font-medium">
              {stats.lastReportedAt
                ? new Date(stats.lastReportedAt).toLocaleDateString()
                : "Never"}
            </p>
          </div>
        </div>

        {stats.allergenMentions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Most reported allergens
            </p>
            <div className="flex flex-wrap gap-2">
              {stats.allergenMentions.slice(0, 4).map((mention) => (
                <Badge key={mention.allergenId} variant="outline">
                  {mention.allergenName} · {mention.count}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReportFormBlock({ productId }: { productId?: string }) {
  if (!productId) {
    return <ReportForm />;
  }

  return (
    <Suspense fallback={<CardSkeleton title="Loading product context" />}>
      <PrefilledReportForm productId={productId} />
    </Suspense>
  );
}

function PrefilledReportForm({ productId }: { productId: string }) {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.product.byId.queryOptions({ id: productId }),
  );

  const preselected = data
    ? {
        id: data.id,
        name: data.name,
        brand: data.brand,
        barcode: data.barcode,
      }
    : null;

  return <ReportForm preselectedProduct={preselected} />;
}

function CardSkeleton({ title }: { title: string }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-6">
        <p className="text-sm text-muted-foreground">{title}</p>
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-2/3" />
      </CardContent>
    </Card>
  );
}

