import { describe, expect, it } from "vitest";

import {
  buildRecentReportsSection,
  buildSearchResultsSection,
} from "../sdui-builder";

describe("SDUI builder helpers", () => {
  it("creates a search section with cards per result", () => {
    const section = buildSearchResultsSection({
      query: "almond milk",
      results: [
        { id: "a", name: "Elmhurst Almond Milk", brand: "Elmhurst" },
        { id: "b", name: "Califia Unsweetened", brand: "Califia" },
      ],
    });

    expect(section.id).toBeDefined();
    expect(section.header?.title).toContain("almond milk");
    // The section should have components (stack with card children)
    expect(section.components.length).toBeGreaterThan(0);
    const stackComponent = section.components[0];
    expect(stackComponent?.type).toBe("stack");
    expect(stackComponent?.children?.length).toBe(2);
  });

  it("attaches refresh actions to recent report sections", () => {
    const actions: string[] = [];
    const section = buildRecentReportsSection({
      scope: "latest",
      reports: [
        {
          id: "rep-1",
          title: "Cereal bar",
          severity: "LOW",
          dateLabel: "Jan 1",
        },
      ],
      registerAction: (action) => {
        actions.push(action.id);
        expect(action.invocation.type).toBe("trpc");
        if (action.invocation.type === "trpc") {
          expect(action.invocation.procedure).toBe("report.latest");
        }
      },
    });

    expect(section.actions).toEqual(["refresh-reports-latest"]);
    expect(actions).toEqual(["refresh-reports-latest"]);
  });
});
