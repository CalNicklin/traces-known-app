import { Suspense } from "react";

import { Card, Skeleton } from "@acme/ui";

import { LookupSections } from "./lookup-sections";
import { SearchResultsContent } from "./search-results-content";

interface SearchResultsProps {
  query: string;
  currentPage: number;
  /** Whether the user is logged in (for personalized sections) */
  isLoggedIn: boolean;
}

export function SearchResults({
  query,
  currentPage,
  isLoggedIn,
}: SearchResultsProps) {
  // Show browse sections when no search query
  if (!query) {
    return <LookupSections isLoggedIn={isLoggedIn} />;
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
