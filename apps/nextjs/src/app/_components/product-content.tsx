"use client";

import Image from "next/image";
import { notFound } from "next/navigation";
import { useSuspenseQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui";

import { useTRPC } from "~/trpc/react";

interface ProductContentProps {
  id: string;
}

export function ProductContent({ id }: ProductContentProps) {
  const trpc = useTRPC();

  const { data: product } = useSuspenseQuery(
    trpc.product.byId.queryOptions({ id }),
  );

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">{product.name}</h1>
        {product.barcode && (
          <p className="text-muted-foreground">Barcode: {product.barcode}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <p className="text-muted-foreground">No image available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {product.brand && (
                <div className="flex gap-2">
                  <span className="font-medium">Brand:</span>
                  <span className="text-muted-foreground">{product.brand}</span>
                </div>
              )}
              <div className="flex gap-2">
                <span className="font-medium">Risk Level:</span>
                <span className="text-muted-foreground">
                  {product.riskLevel ?? "Not assessed"}
                </span>
              </div>
            </CardContent>
          </Card>

          {product.allergenWarning && (
            <Card className="border-destructive/20 bg-destructive/10">
              <CardHeader>
                <CardTitle className="text-destructive">
                  ⚠️ Allergen Warning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{product.allergenWarning}</p>
              </CardContent>
            </Card>
          )}

          {product.ingredients && product.ingredients.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Ingredients</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm">
                  {product.ingredients.map((ingredient, index) => (
                    <li key={index}>• {ingredient}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Community Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                🚧 Community reporting feature coming soon. Check back later to
                see allergy reports for this product.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
