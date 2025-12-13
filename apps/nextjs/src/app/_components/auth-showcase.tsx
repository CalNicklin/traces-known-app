import { Card, CardContent } from "@acme/ui";
import { Button } from "@acme/ui/button";

import { getSession } from "~/auth/server";
import { signOutAction } from "../_actions/sign-out";
import { AuthForms } from "./auth-forms";

export async function AuthShowcase() {
  const session = await getSession();

  if (!session) {
    return <AuthForms />;
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      {/* Success indicator */}
      <div className="flex items-center justify-center space-x-2 text-green-600">
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-lg font-semibold">Successfully Signed In!</span>
      </div>

      {/* User info card */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Welcome back!</h3>
            <p className="text-muted-foreground">
              You are currently signed in as:
            </p>
          </div>

          <div className="rounded-r border-l-4 border-primary bg-muted/50 py-2 pl-4">
            <div className="space-y-1">
              <p className="text-lg font-medium">{session.user.name}</p>
              <p className="text-sm text-muted-foreground">
                {session.user.email}
              </p>
              <p className="text-xs text-muted-foreground">
                User ID: {session.user.id}
              </p>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>
              Session expires:{" "}
              {new Date(session.session.expiresAt).toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sign out button */}
      <form className="w-full">
        <Button
          size="lg"
          variant="outline"
          className="w-full"
          formAction={signOutAction}
        >
          Sign Out
        </Button>
      </form>
    </div>
  );
}
