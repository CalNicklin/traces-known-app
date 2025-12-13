import Link from "next/link";

import { Button } from "@acme/ui/button";

import { getSession } from "~/auth/server";
import { signOutAction } from "../_actions/sign-out";

export async function Navigation() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">
              Traces <span className="text-primary">Known</span>
            </span>
          </Link>

          <div className="hidden items-center space-x-4 md:flex">
            <Link
              href="/lookup"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Lookup
            </Link>
            <Link
              href="/report"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Report
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden items-center space-x-2 text-sm text-muted-foreground sm:flex">
            <span>Welcome,</span>
            <span className="font-medium text-foreground">
              {session.user.name}
            </span>
          </div>

          <form action={signOutAction}>
            <Button variant="outline" size="sm">
              Sign Out
            </Button>
          </form>
        </div>
      </div>
    </nav>
  );
}
