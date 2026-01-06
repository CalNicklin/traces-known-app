"use client";

import { Suspense } from "react";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { useSuspenseQuery } from "@tanstack/react-query";

import { Badge } from "@acme/ui";

import { useTRPC } from "~/trpc/react";
import { CategoryChips, CategoryChipsSkeleton } from "./category-chips";
import { ProductCarousel, ProductCarouselSkeleton } from "./product-carousel";

interface LookupSectionsProps {
  /** Whether the user is logged in */
  isLoggedIn: boolean;
}

export function LookupSections({ isLoggedIn }: LookupSectionsProps) {
  return (
    <div className="space-y-8">
      {isLoggedIn && (
        <Suspense
          fallback={<ProductCarouselSkeleton title="Recently Viewed" />}
        >
          <RecentlyViewedSection />
        </Suspense>
      )}

      {isLoggedIn && (
        <Suspense
          fallback={<ProductCarouselSkeleton title="Your Reported Products" />}
        >
          <ReportedProductsSection />
        </Suspense>
      )}

      <Suspense fallback={<CategoryChipsSkeleton title="Browse by Category" />}>
        <CategoriesSection />
      </Suspense>

      <Suspense fallback={<ProductCarouselSkeleton title="Recently Added" />}>
        <RecentlyAddedSection />
      </Suspense>
    </div>
  );
}

function RecentlyViewedSection() {
  const trpc = useTRPC();
  const { data: products } = useSuspenseQuery(
    trpc.product.recentlyViewed.queryOptions({ limit: 10 }),
  );

  if (products.length === 0) return null;

  return (
    <ProductCarousel
      title="Recently Viewed"
      products={products}
      emptyMessage="You haven't viewed any products yet"
    />
  );
}

function ReportedProductsSection() {
  const trpc = useTRPC();
  const { data: products } = useSuspenseQuery(
    trpc.product.reportedByUser.queryOptions({ limit: 10 }),
  );

  if (products.length === 0) return null;

  return (
    <ProductCarousel
      title="Your Reported Products"
      products={products}
      emptyMessage="You haven't reported any products yet"
      renderBadge={() => (
        <Badge
          variant="destructive"
          className="h-5 w-5 rounded-full p-0"
          aria-label="You've reported an allergy on this product"
        >
          <ExclamationTriangleIcon className="h-3 w-3" />
        </Badge>
      )}
    />
  );
}

function CategoriesSection() {
  const trpc = useTRPC();
  const { data: categories } = useSuspenseQuery(
    trpc.category.all.queryOptions(),
  );

  return <CategoryChips categories={categories} title="Browse by Category" />;
}

function RecentlyAddedSection() {
  const trpc = useTRPC();
  const { data: products } = useSuspenseQuery(
    trpc.product.recentlyAdded.queryOptions({ limit: 10 }),
  );

  return (
    <ProductCarousel
      title="Recently Added"
      products={products}
      emptyMessage="No products have been added yet"
    />
  );
}
