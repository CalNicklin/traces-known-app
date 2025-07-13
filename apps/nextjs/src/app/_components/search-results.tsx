import { Suspense } from "react";

import { Card, Skeleton } from "@acme/ui";

import { SearchResultsContent } from "./search-results-content";

interface SearchResultsProps {
  query: string;
  currentPage: number;
}

export function SearchResults({ query, currentPage }: SearchResultsProps) {
  if (!query) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>Enter a product name to search for allergy reports.</p>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <SearchResultSkeleton />
          <SearchResultSkeleton />
          <SearchResultSkeleton />
        </div>
      }
    >
      <SearchResultsContent query={query} currentPage={currentPage} />
    </Suspense>
  );
}

function SearchResultSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </Card>
  );
}
