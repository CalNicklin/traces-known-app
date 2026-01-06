import { Suspense } from "react";

import { Skeleton } from "@acme/ui";

import { CategoryPageContent } from "~/app/_components/category-page-content";
import { getSession } from "~/auth/server";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{
    page?: string;
  }>;
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const session = await getSession();
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const currentPage = Number(resolvedSearchParams?.page) || 1;

  if (!session) {
    return (
      <div className="container py-8">
        <p>Please sign in to browse categories.</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-4xl">
        <Suspense
          fallback={
            <div className="space-y-6">
              {/* Breadcrumb skeleton */}
              <Skeleton className="h-5 w-48" />
              {/* Category chips skeleton */}
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-24 rounded-full" />
                ))}
              </div>
              {/* Title skeleton */}
              <Skeleton className="h-8 w-64" />
              {/* Product grid skeleton */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
              </div>
            </div>
          }
        >
          <CategoryPageContent slug={slug} currentPage={currentPage} />
        </Suspense>
      </div>
    </div>
  );
}
