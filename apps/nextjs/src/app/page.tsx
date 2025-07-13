import Link from "next/link";

import { Card, CardContent } from "@acme/ui";

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
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
              Traces <span className="text-primary">Known</span>
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Track and share allergy reactions to help others with similar
              allergies make informed food choices.
            </p>
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
          <h1 className="mb-2 text-3xl font-bold">
            Welcome back, {session.user.name}!
          </h1>
          <p className="text-muted-foreground">
            What would you like to do today?
          </p>
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
                  <h3 className="text-xl font-semibold transition-colors group-hover:text-primary">
                    Lookup →
                  </h3>
                </div>
                <p className="leading-relaxed text-muted-foreground">
                  Check if people with the same allergies as you have reported
                  an item that you want to eat.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/report" className="group block">
            <Card className="transition-all hover:scale-[1.02] hover:shadow-md">
              <CardContent className="flex flex-col gap-4 p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-destructive/10 p-2">
                    <svg
                      className="h-6 w-6 text-destructive"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold transition-colors group-hover:text-destructive">
                    Report →
                  </h3>
                </div>
                <p className="leading-relaxed text-muted-foreground">
                  Report your allergy symptoms after eating a product so others
                  can review before they eat.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick stats or recent activity could go here */}
        <Card className="mt-12 bg-muted/50">
          <CardContent className="p-6">
            <h2 className="mb-2 text-lg font-semibold">Getting Started</h2>
            <p className="text-sm text-muted-foreground">
              Start by looking up products you're considering eating, or report
              any reactions you've had to help the community.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
