import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@acme/ui";

import { getSession } from "~/auth/server";
import { NewProductContent } from "../../_components/new-product-content";

interface NewProductPageProps {
  searchParams: Promise<{ barcode?: string }>;
}

function NewProductSkeleton() {
  return (
    <div className="space-y-6">
      {/* Preview Card Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Skeleton className="h-24 w-24 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>

      {/* Form Skeleton */}
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

export default async function NewProductPage({
  searchParams,
}: NewProductPageProps) {
  const { barcode } = await searchParams;
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  if (!barcode) {
    redirect("/lookup");
  }

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold">Add New Product</h1>
          <p className="text-muted-foreground">
            Review the product information below and help others with allergies
            by adding this product to our database.
          </p>
        </div>

        <NewProductContent barcode={barcode} />
      </div>
    </div>
  );
}
