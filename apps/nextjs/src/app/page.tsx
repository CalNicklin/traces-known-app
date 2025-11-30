import { getSession } from "~/auth/server";
import { GenerativeCanvas } from "./_components/generative-canvas";
import { GenerativeAI } from "./_lib/generative-ai";
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
    <GenerativeAI>
      <main className="px-4 py-10 lg:px-8">
        <GenerativeCanvas userName={session.user.name ?? "friend"} />
      </main>
    </GenerativeAI>
  );
}
