import { createOpenAI } from "@ai-sdk/openai";

import { env } from "~/env";

const openai = createOpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export function getModel() {
  return openai(env.OPENAI_MODEL ?? "gpt-4.1-mini");
}
