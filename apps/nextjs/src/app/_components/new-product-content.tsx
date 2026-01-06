"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { useMutation, useQuery } from "@tanstack/react-query";

import { mapOpenFoodFactsToProductForm } from "@acme/external-services/open-food-facts";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@acme/ui";
import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";
import type { AddProductFormResult } from "./add-product-form";
import { AddProductForm } from "./add-product-form";

interface NewProductContentProps {
  barcode: string;
}

export function NewProductContent({ barcode }: NewProductContentProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const [isCreating, setIsCreating] = useState(false);

  // Fetch OFF data
  const {
    data: offData,
    isLoading: isLoadingOff,
    error: offError,
  } = useQuery({
    ...trpc.external.openFoodFacts.byCode.queryOptions({ code: barcode }),
    retry: false,
  });

  // Check if product already exists in our DB
  const { data: existingProduct, isLoading: isCheckingDb } = useQuery({
    ...trpc.product.byBarcode.queryOptions({ barcode }),
    retry: false,
  });

  // Product creation mutation
  const createProduct = useMutation(trpc.product.create.mutationOptions());

  // Map OFF data to form format
  const mappedData = offData ? mapOpenFoodFactsToProductForm(offData) : null;

  const handleSubmit = async (result: AddProductFormResult) => {
    setIsCreating(true);
    try {
      const newProduct = await createProduct.mutateAsync(result.data);

      if (newProduct) {
        toast.success("Product added! Now let's file your report.");

        // If there's an image file, we could upload it here
        // For now, redirect to report page
        router.push(`/report?productId=${newProduct.id}`);
      }
    } catch (err) {
      toast.error(
        "Failed to add product: " +
          ((err as Error).message || "Unknown error"),
      );
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    router.push("/lookup");
  };

  const handleProductFound = (productId: string) => {
    // If barcode lookup finds an existing product, go to report page
    router.push(`/report?productId=${productId}`);
  };

  // Loading state
  if (isLoadingOff || isCheckingDb) {
    return <LoadingSkeleton />;
  }

  // Product already exists
  if (existingProduct) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Product Already Exists</CardTitle>
          <CardDescription>
            This product is already in our database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="font-medium">{existingProduct.name}</p>
              {existingProduct.brand && (
                <p className="text-sm text-muted-foreground">
                  {existingProduct.brand}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => router.push(`/report?productId=${existingProduct.id}`)}
            className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            Report Your Experience
          </button>
        </CardContent>
      </Card>
    );
  }

  // OFF error or no data
  if (offError || !offData?.product) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Product Not Found</CardTitle>
          <CardDescription>
            We couldn&apos;t find this product in Open Food Facts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Barcode: {barcode}
          </p>
          <p className="text-sm">
            You can still add this product manually by filling out the form
            below.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Preview Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <InfoCircledIcon className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Product Preview</CardTitle>
            <Badge variant="secondary" className="ml-auto">
              From Open Food Facts
            </Badge>
          </div>
          <CardDescription>
            Review this information before adding to our database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {/* Product Image */}
            {mappedData?.imageUrl ? (
              <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border bg-white">
                <Image
                  src={mappedData.imageUrl}
                  alt={mappedData.name ?? "Product"}
                  fill
                  className="object-contain p-1"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-lg border bg-muted">
                <span className="text-xs text-muted-foreground">No image</span>
              </div>
            )}

            {/* Product Info */}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">
                {mappedData?.name ?? "Unknown Product"}
              </h3>
              {mappedData?.brand && (
                <p className="text-sm text-muted-foreground">
                  {mappedData.brand}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Barcode: {barcode}
              </p>

              {/* Allergen Warning Preview */}
              {mappedData?.allergenWarning && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    Contains allergens
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Ingredients Preview */}
          {mappedData?.ingredients && mappedData.ingredients.length > 0 && (
            <div className="mt-4 rounded-md bg-background p-3">
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Ingredients ({mappedData.ingredients.length})
              </p>
              <p className="text-sm">
                {mappedData.ingredients.slice(0, 5).join(", ")}
                {mappedData.ingredients.length > 5 && (
                  <span className="text-muted-foreground">
                    {" "}
                    +{mappedData.ingredients.length - 5} more
                  </span>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Product Form - reusing existing component */}
      <AddProductForm
        initialData={mappedData ?? { barcode }}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isCreating}
        onProductFound={handleProductFound}
      />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Skeleton className="h-24 w-24 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    </div>
  );
}
