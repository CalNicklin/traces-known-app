import Link from "next/link";

import { Text } from "@acme/ui";
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
            <Text variant="large" className="text-xl font-bold">
              Traces{" "}
              <Text as="span" variant="large" className="text-primary">
                Known
              </Text>
            </Text>
          </Link>

          <div className="hidden items-center space-x-4 md:flex">
            <Link href="/lookup">
              <Text
                variant="small"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Lookup
              </Text>
            </Link>
            <Link href="/report">
              <Text
                variant="small"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Report
              </Text>
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden items-center space-x-2 sm:flex">
            <Text variant="muted">Welcome,</Text>
            <Text variant="small" className="text-foreground">
              {session.user.name}
            </Text>
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
