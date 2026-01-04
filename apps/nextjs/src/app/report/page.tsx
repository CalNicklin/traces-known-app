import { Suspense } from "react";

import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@acme/ui";

import { ReportForm } from "~/app/_components/report-form";
import { getSession } from "~/auth/server";

interface ReportPageProps {
  searchParams: Promise<{ productId?: string }>;
}

function ReportFormSkeleton() {
  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Report Your Experience</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

export default async function ReportPage({ searchParams }: ReportPageProps) {
  const { productId } = await searchParams;
  const session = await getSession();

  if (!session) {
    return (
      <div className="container py-8">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Sign In Required</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Please sign in to access the report feature and help the
                community by sharing your allergy experiences.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Introduction */}
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold">Report Your Experience</h1>
          <p className="text-muted-foreground">
            Share your experience with a product to help others with similar
            allergies make informed choices.
          </p>
        </div>

        {/* Report Form */}
        <Suspense fallback={<ReportFormSkeleton />}>
          <ReportForm productId={productId} />
        </Suspense>
      </div>
    </div>
  );
}
