import { getSession } from "~/auth/server";
import { AgentShell } from "./_components/agent/agent-shell";
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

  return (
    <main className="container py-8">
      <div className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground">Agent surface</p>
          <h1 className="text-3xl font-bold">
            Welcome back, {session.user.name}!
          </h1>
          <p className="text-muted-foreground">
            Tell the agent what you need and it will stitch the right tools
            together.
          </p>
        </div>
        <AgentShell userName={session.user.name ?? "friend"} />
      </div>
    </main>
  );
}
