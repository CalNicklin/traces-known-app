import { NextResponse } from "next/server";
import { z } from "zod";

import { formatRecentReportCards, buildRecentReportsSection } from "~/server/ai/sdui-builder";
import { getServerCaller } from "~/server/trpc-caller";

const InvokeSchema = z.object({
  actionId: z.string().min(1),
  elementId: z.string().min(1),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = InvokeSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid action payload",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { actionId, elementId } = parsed.data;

  switch (actionId) {
    case "refresh-reports-latest":
    case "refresh-reports-mine": {
      const scope = actionId === "refresh-reports-mine" ? "mine" : "latest";
      try {
        const caller = await getServerCaller(request.headers);
        if (scope === "mine") {
          const session = await caller.auth.getSession();
          if (!session?.user.id) {
            return NextResponse.json(
              { error: "Sign in to refresh your reports." },
              { status: 401 },
            );
          }
        }
        const reports =
          scope === "mine"
            ? await caller.report.mine({ limit: 5 })
            : await caller.report.latest({ limit: 5 });

        const formatter = new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
        });

        const cards = formatRecentReportCards(reports, formatter);
        const section = buildRecentReportsSection({
          scope,
          reports: cards,
          sectionId: elementId,
        });

        return NextResponse.json({ section });
      } catch (error) {
        console.error("SDUI action error", error);
        return NextResponse.json(
          { error: "Unable to refresh reports right now." },
          { status: 500 },
        );
      }
    }
    default:
      return NextResponse.json(
        { error: `Action ${actionId} is not supported.` },
        { status: 404 },
      );
  }
}


