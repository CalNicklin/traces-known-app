import { NextResponse } from "next/server";
import { z } from "zod";

import type { SduiScreen } from "~/types/sdui";

// Runtime imports for schema validation
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { screenSchema } = require("@acme/api/sdui-schema") as {
  screenSchema: z.ZodType<SduiScreen>;
};

/**
 * POST /api/sdui/validate
 *
 * Validates an SDUI screen payload against the schema.
 * Use this for pre-flight validation before sending to the client.
 *
 * Request body: Raw SDUI screen JSON
 * Response: { valid: true, normalized: SduiScreen } or { valid: false, errors: ZodFormattedError }
 */
export async function POST(request: Request) {
  const json: unknown = await request.json().catch(() => null);

  if (json === null) {
    return NextResponse.json(
      {
        valid: false,
        errors: {
          _errors: ["Invalid JSON in request body"],
        },
      },
      { status: 400 },
    );
  }

  const result = screenSchema.safeParse(json);

  if (!result.success) {
    return NextResponse.json(
      {
        valid: false,
        errors: result.error.format(),
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    valid: true,
    normalized: result.data,
  });
}

/**
 * GET /api/sdui/validate
 *
 * Returns schema metadata for documentation purposes.
 */
export async function GET() {
  return NextResponse.json({
    version: "2025-01",
    schemaInfo: {
      description: "SDUI Screen Schema v2025-01",
      documentation: "/docs/sdui/schema.md",
      componentTypes: [
        "stack",
        "inline",
        "grid",
        "card",
        "split",
        "heading",
        "text",
        "richText",
        "kicker",
        "list",
        "stat",
        "statGroup",
        "badge",
        "image",
        "icon",
        "button",
        "buttonGroup",
        "skeleton",
        "divider",
        "spacer",
      ],
      layoutTypes: ["canvas", "modal", "drawer"],
    },
  });
}

