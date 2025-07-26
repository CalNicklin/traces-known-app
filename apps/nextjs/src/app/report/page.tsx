import { Suspense } from "react";

import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@acme/ui";

import { ReportForm } from "~/app/_components/report-form";
import { getSession } from "~/auth/server";

function ReportFormSkeleton() {
  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Report Allergy Reaction</CardTitle>
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

export default async function ReportPage() {
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
          <h1 className="mb-2 text-3xl font-bold">Report Allergy Reaction</h1>
          <p className="text-muted-foreground">
            Share your allergy experience to help others with similar allergies
            make informed choices.
          </p>
        </div>

        {/* Help Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Help the Community</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your reports help others identify potentially dangerous products
                and make safer food choices.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Anonymous & Safe</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Reports are associated with your account but displayed safely to
                protect your privacy.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Report Form */}
        <Suspense fallback={<ReportFormSkeleton />}>
          <ReportForm />
        </Suspense>
      </div>
    </div>
  );
}
