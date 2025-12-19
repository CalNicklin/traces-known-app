"use client";

import Link from "next/link";
import { CookieIcon, CubeIcon, MixIcon, StarIcon } from "@radix-ui/react-icons";

import type { RouterOutputs } from "@acme/api";
import { Card } from "@acme/ui";

type Category = RouterOutputs["category"]["all"][0];

// Map of icon names to components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  CookieIcon,
  CubeIcon,
  MixIcon,
  StarIcon,
};

function getCategoryIcon(iconName: string | null) {
  if (!iconName) return CubeIcon;
  return iconMap[iconName] ?? CubeIcon;
}

interface CategoryGridProps {
  categories: Category[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Browse by Category</h2>
      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
        role="list"
        aria-label="Product categories"
      >
        {categories.map((category) => {
          const Icon = getCategoryIcon(category.icon);
          return (
            <Link
              key={category.id}
              href={`/lookup?category=${category.slug}`}
              className="group block"
              role="listitem"
            >
              <Card className="flex flex-col items-center justify-center gap-2 p-4 text-center transition-colors hover:bg-accent">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {category.productCount}{" "}
                    {category.productCount === 1 ? "product" : "products"}
                  </p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function CategoryGridSkeleton() {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Browse by Category</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card
            key={i}
            className="flex flex-col items-center justify-center gap-2 p-4"
          >
            <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            <div className="h-3 w-12 animate-pulse rounded bg-muted" />
          </Card>
        ))}
      </div>
    </section>
  );
}

