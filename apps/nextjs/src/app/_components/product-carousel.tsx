"use client";

import { useRef } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";

import type { RouterOutputs } from "@acme/api";
import { Button } from "@acme/ui";

import { ProductCardMini, ProductCardMiniSkeleton } from "./product-card-mini";

type Product = RouterOutputs["product"]["recentlyAdded"][0];

interface ProductCarouselProps {
  title: string;
  products: Product[];
  /** Optional badge renderer for each product */
  renderBadge?: (product: Product) => React.ReactNode;
  /** Empty state message */
  emptyMessage?: string;
}

export function ProductCarousel({
  title,
  products,
  renderBadge,
  emptyMessage = "No products to show",
}: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 200;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (products.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => scroll("left")}
            aria-label={`Scroll ${title} left`}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => scroll("right")}
            aria-label={`Scroll ${title} right`}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-2"
        role="list"
        aria-label={title}
      >
        {products.map((product) => (
          <div key={product.id} role="listitem">
            <ProductCardMini product={product} badge={renderBadge?.(product)} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function ProductCarouselSkeleton({ title }: { title: string }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <ProductCardMiniSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}
