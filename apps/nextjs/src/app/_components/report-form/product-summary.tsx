"use client";

import { Text } from "@acme/ui";

import type { ProductSearchResult } from "./types";

interface ProductSummaryProps {
  product: ProductSearchResult | null;
}

export function ProductSummary({ product }: ProductSummaryProps) {
  if (!product) return null;

  return (
    <div className="rounded-lg border bg-muted/50 p-3">
      <Text variant="small">Product:</Text>
      <Text variant="muted">
        {product.name}
        {product.brand && ` - ${product.brand}`}
      </Text>
    </div>
  );
}
