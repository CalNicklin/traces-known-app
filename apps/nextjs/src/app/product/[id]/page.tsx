import { Suspense } from "react";

import { Skeleton } from "@acme/ui";

import { ProductContent } from "~/app/_components/product-content";
import { getSession } from "~/auth/server";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const session = await getSession();
  const { id } = await params;

  if (!session) {
    return (
      <div className="container py-8">
        <p>Please sign in to view product details.</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-4xl">
        <Suspense
          fallback={
            <div className="space-y-6">
              <Skeleton className="h-8 w-1/3" />
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Skeleton className="h-64" />
                <div className="space-y-4">
                  <Skeleton className="h-4" />
                  <Skeleton className="h-4" />
                  <Skeleton className="h-4" />
                </div>
              </div>
            </div>
          }
        >
          <ProductContent id={id} />
        </Suspense>
      </div>
    </div>
  );
}
