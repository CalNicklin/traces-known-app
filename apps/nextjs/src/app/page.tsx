import Link from "next/link";

import { Card, CardContent, Text } from "@acme/ui";

import { getSession } from "~/auth/server";
import { AuthShowcase } from "./_components/auth-showcase";

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    // Show auth interface when not signed in
    return (
      <main className="container min-h-screen py-16">
        <div className="flex min-h-[80vh] flex-col items-center justify-center gap-8">
          <div className="space-y-4 text-center">
            <Text variant="h1" className="sm:text-6xl">
              Traces{" "}
              <Text as="span" variant="h1" className="text-primary">
                Known
              </Text>
            </Text>
            <Text variant="lead" className="max-w-2xl">
              Track and share allergy reactions to help others with similar
              allergies make informed food choices.
            </Text>
          </div>
          <AuthShowcase />
        </div>
      </main>
    );
  }

  // Show main app interface when signed in
  return (
    <main className="container py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <Text variant="h2" className="mb-2">
            Welcome back, {session.user.name}!
          </Text>
          <Text variant="muted">What would you like to do today?</Text>
        </div>

        <div className="grid max-w-2xl grid-cols-1 gap-6 md:grid-cols-2">
          <Link href="/lookup" className="group block">
            <Card className="transition-all hover:scale-[1.02] hover:shadow-md">
              <CardContent className="flex flex-col gap-4 p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <svg
                      className="h-6 w-6 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <Text
                    variant="h4"
                    className="transition-colors group-hover:text-primary"
                  >
                    Lookup →
                  </Text>
                </div>
                <Text variant="muted" className="leading-relaxed">
                  Check if people with the same allergies as you have reported
                  an item that you want to eat.
                </Text>
              </CardContent>
            </Card>
          </Link>

          <Link href="/report" className="group block">
            <Card className="transition-all hover:scale-[1.02] hover:shadow-md">
              <CardContent className="flex flex-col gap-4 p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-secondary p-2">
                    <svg
                      className="h-6 w-6 text-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <Text
                    variant="h4"
                    className="transition-colors group-hover:text-primary"
                  >
                    Report →
                  </Text>
                </div>
                <Text variant="muted" className="leading-relaxed">
                  Share your experience after trying a product to help others
                  with similar allergies.
                </Text>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick stats or recent activity could go here */}
        <Card className="mt-12 bg-muted/50">
          <CardContent className="p-6">
            <Text variant="large" className="mb-2">
              Getting Started
            </Text>
            <Text variant="muted">
              Start by looking up products you're considering eating, or report
              any reactions you've had to help the community.
            </Text>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
