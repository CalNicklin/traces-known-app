"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Text,
} from "@acme/ui";
import { Button } from "@acme/ui/button";

import { useTRPC } from "~/trpc/react";
import { ProductGallery, ProductGallerySkeleton } from "./product-gallery";
import { ReportThread } from "./report-thread";

interface ProductContentProps {
  id: string;
}

export function ProductContent({ id }: ProductContentProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Record view when component mounts
  const { mutate: recordView } = useMutation(
    trpc.product.recordView.mutationOptions(),
  );

  useEffect(() => {
    // Fire and forget - we don't need to wait for this
    recordView({ productId: id });
  }, [id, recordView]);

  const { data: product } = useSuspenseQuery(
    trpc.product.byId.queryOptions({ id }),
  );

  const { data: reports } = useSuspenseQuery(
    trpc.report.byProductId.queryOptions({ productId: id }),
  );

  const handleReportChange = () => {
    void queryClient.invalidateQueries({
      queryKey: ["report", "byProductId", { productId: id }],
    });
  };

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between border-b pb-4">
        <div>
          <Text variant="h2">{product.name}</Text>
          {product.barcode && (
            <Text variant="muted">Barcode: {product.barcode}</Text>
          )}
        </div>
        <Button asChild>
          <Link href={`/report?productId=${id}`}>Report Allergy Reaction</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <Suspense fallback={<ProductGallerySkeleton />}>
              <ProductGallery
                productId={id}
                mainImageUrl={product.imageUrl}
                productName={product.name}
              />
            </Suspense>
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
                  <Text variant="small">Brand:</Text>
                  <Text variant="muted">{product.brand}</Text>
                </div>
              )}
              <div className="flex gap-2">
                <Text variant="small">Risk Level:</Text>
                <Text variant="muted">
                  {product.riskLevel ?? "Not assessed"}
                </Text>
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
                <Text variant="muted">{product.allergenWarning}</Text>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Ingredients</CardTitle>
            </CardHeader>
            <CardContent>
              {product.ingredients && product.ingredients.length > 0 ? (
                <ul className="space-y-1">
                  {product.ingredients.map((ingredient, index) => (
                    <li key={index}>
                      <Text variant="muted">• {ingredient}</Text>
                    </li>
                  ))}
                </ul>
              ) : (
                <Text variant="muted">No ingredients information available</Text>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Community Reports ({reports.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {reports.length > 0 ? (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <ReportThread
                      key={report.id}
                      report={report}
                      onReportDeleted={handleReportChange}
                      onReportUpdated={handleReportChange}
                    />
                  ))}
                </div>
              ) : (
                <Text variant="muted">
                  No community reports yet. Be the first to share your
                  experience with this product.
                </Text>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
