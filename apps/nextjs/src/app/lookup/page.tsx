import { Suspense } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";

import { getSession } from "~/auth/server";
import { LookupPageContent } from "../_components/lookup-page-content";
import Search from "../_components/search";
import { SearchResults } from "../_components/search-results";

export default async function LookupPage(props: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
}) {
  const session = await getSession();
  const searchParams = await props.searchParams;
  const query = searchParams?.query ?? "";
  const currentPage = Number(searchParams?.page) || 1;

  if (!session) {
    return (
      <div className="container py-8">
        <p>Please sign in to access the lookup feature.</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-bold">Product Lookup</h1>

        <div className="grid grid-cols-1 gap-4 md:gap-8">
          <div className="space-y-4">
            <Search placeholder="Search products..." />
            <LookupPageContent isLoggedIn={!!session} />
          </div>

          <Suspense
            key={query + currentPage}
            fallback={
              <div className="flex items-center justify-center py-8">
                <MagnifyingGlassIcon className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <SearchResults
              query={query}
              currentPage={currentPage}
              isLoggedIn={!!session}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
