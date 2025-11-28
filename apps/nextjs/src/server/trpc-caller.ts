import { appRouter, createTRPCContext } from "@acme/api";

import { auth } from "~/auth/server";

export async function getServerCaller(headers?: HeadersInit) {
  const ctx = await createTRPCContext({
    headers: new Headers(headers ?? {}),
    auth,
  });

  return appRouter.createCaller(ctx);
}

