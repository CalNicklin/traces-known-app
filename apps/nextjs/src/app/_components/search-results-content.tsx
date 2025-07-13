"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";
import { SearchResultCard } from "./search-result-card";

interface SearchResultsContentProps {
  query: string;
  currentPage: number;
}

export function SearchResultsContent({
  query,
  currentPage,
}: SearchResultsContentProps) {
  const trpc = useTRPC();
  const { data: searchResults } = useSuspenseQuery(
    trpc.product.search.queryOptions({
      query,
      page: currentPage,
      limit: 24,
    }),
  );

  if (searchResults.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>No products found for "{query}".</p>
        <p className="mt-2 text-sm">Try adjusting your search terms.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {searchResults.map((product) => (
        <SearchResultCard key={product.id} product={product} />
      ))}
    </div>
  );
}
