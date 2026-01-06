"use client";

import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { useSuspenseQuery } from "@tanstack/react-query";

import type { RouterOutputs } from "@acme/api";
import {
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  Skeleton,
  Text,
} from "@acme/ui";

import { useTRPC } from "~/trpc/react";
import { CategoryChips, CategoryChipsSkeleton } from "./category-chips";
import { RiskBadge } from "./risk-badge";

interface CategoryPageContentProps {
  slug: string;
  currentPage: number;
}

export function CategoryPageContent({
  slug,
  currentPage,
}: CategoryPageContentProps) {
  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/lookup">Lookup</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <Suspense fallback={<Skeleton className="h-5 w-24" />}>
              <CategoryBreadcrumbPage slug={slug} />
            </Suspense>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Category Chips */}
      <Suspense fallback={<CategoryChipsSkeleton />}>
        <CategoryChipsSection currentSlug={slug} />
      </Suspense>

      {/* Products */}
      <Suspense fallback={<ProductGridSkeleton />}>
        <CategoryProducts slug={slug} currentPage={currentPage} />
      </Suspense>
    </div>
  );
}

function CategoryBreadcrumbPage({ slug }: { slug: string }) {
  const trpc = useTRPC();
  const { data: category } = useSuspenseQuery(
    trpc.category.bySlug.queryOptions({ slug }),
  );

  return <BreadcrumbPage>{category?.name ?? "Category"}</BreadcrumbPage>;
}

function CategoryChipsSection({ currentSlug }: { currentSlug: string }) {
  const trpc = useTRPC();
  const { data: categories } = useSuspenseQuery(
    trpc.category.all.queryOptions(),
  );

  return <CategoryChips categories={categories} currentSlug={currentSlug} />;
}

type CategoryProduct =
  RouterOutputs["category"]["productsBySlug"]["products"][0];

function CategoryProducts({
  slug,
  currentPage,
}: {
  slug: string;
  currentPage: number;
}) {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.category.productsBySlug.queryOptions({
      slug,
      page: currentPage,
      limit: 24,
    }),
  );

  if (!data.category) {
    return (
      <div className="py-12 text-center">
        <Text variant="large" className="text-muted-foreground">
          Category not found
        </Text>
        <Text variant="muted" className="mt-2">
          The category you're looking for doesn't exist.
        </Text>
        <Button asChild className="mt-4">
          <Link href="/lookup">Back to Lookup</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{data.category.name}</h1>
          <Text variant="muted">
            {data.totalCount} {data.totalCount === 1 ? "product" : "products"}
          </Text>
        </div>
      </div>

      {/* Product Grid */}
      {data.products.length === 0 ? (
        <div className="py-12 text-center">
          <Text variant="large" className="text-muted-foreground">
            No products yet
          </Text>
          <Text variant="muted" className="mt-2">
            Be the first to add a product to this category.
          </Text>
        </div>
      ) : (
        <div className="space-y-4">
          {data.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data.totalPages > 1 && (
        <Pagination
          currentPage={data.page}
          totalPages={data.totalPages}
          slug={slug}
        />
      )}
    </div>
  );
}

function ProductCard({ product }: { product: CategoryProduct }) {
  return (
    <Link href={`/product/${product.id}`} className="group block">
      <Card className="p-4 transition-colors hover:bg-accent">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={64}
                height={64}
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <Text variant="caption">No image</Text>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-1">
            <Text
              variant="small"
              className="font-semibold text-foreground group-hover:text-primary"
            >
              {product.name}
            </Text>

            <div className="flex items-center gap-2">
              {product.brand && <Text variant="muted">{product.brand}</Text>}
              {product.riskLevel && (
                <RiskBadge
                  level={
                    product.riskLevel as "low" | "moderate" | "high" | "unknown"
                  }
                />
              )}
            </div>
          </div>

          <div className="text-muted-foreground">
            <ChevronRightIcon className="h-5 w-5" />
          </div>
        </div>
      </Card>
    </Link>
  );
}

function Pagination({
  currentPage,
  totalPages,
  slug,
}: {
  currentPage: number;
  totalPages: number;
  slug: string;
}) {
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className="flex items-center justify-center gap-4">
      <Button variant="outline" size="sm" asChild={hasPrev} disabled={!hasPrev}>
        {hasPrev ? (
          <Link href={`/category/${slug}?page=${currentPage - 1}`}>
            <ChevronLeftIcon className="mr-1 h-4 w-4" />
            Previous
          </Link>
        ) : (
          <span>
            <ChevronLeftIcon className="mr-1 h-4 w-4" />
            Previous
          </span>
        )}
      </Button>

      <Text variant="muted">
        Page {currentPage} of {totalPages}
      </Text>

      <Button variant="outline" size="sm" asChild={hasNext} disabled={!hasNext}>
        {hasNext ? (
          <Link href={`/category/${slug}?page=${currentPage + 1}`}>
            Next
            <ChevronRightIcon className="ml-1 h-4 w-4" />
          </Link>
        ) : (
          <span>
            Next
            <ChevronRightIcon className="ml-1 h-4 w-4" />
          </span>
        )}
      </Button>
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-5 w-24" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
