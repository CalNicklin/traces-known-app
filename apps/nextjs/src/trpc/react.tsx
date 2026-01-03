"use client";

import type { QueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  createTRPCClient,
  httpBatchStreamLink,
  loggerLink,
} from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import SuperJSON from "superjson";

import type { AppRouter } from "@acme/api";

import { env } from "~/env";
import { createQueryClient } from "./query-client";

let clientQueryClientSingleton: QueryClient | undefined = undefined;
const getQueryClient = () => {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return createQueryClient();
  } else {
    // Browser: use singleton pattern to keep the same query client
    return (clientQueryClientSingleton ??= createQueryClient());
  }
};

export const { useTRPC, TRPCProvider } = createTRPCContext<AppRouter>();

export function TRPCReactProvider(props: {
  children: React.ReactNode;
  cookies: string;
}) {
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        loggerLink({
          enabled: (op) =>
            env.NODE_ENV === "development" ||
            (op.direction === "down" && op.result instanceof Error),
        }),
        httpBatchStreamLink({
          transformer: SuperJSON,
          url: getBaseUrl() + "/api/trpc",
          headers() {
            const headers = new Headers();
            headers.set("x-trpc-source", "nextjs-react");
            // Forward cookies during SSR for auth
            if (typeof window === "undefined" && props.cookies) {
              console.log("[tRPC] Forwarding cookies during SSR:", props.cookies.substring(0, 50) + "...");
              headers.set("cookie", props.cookies);
            }
            return headers;
          },
        }),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {props.children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}

const getBaseUrl = () => {
  if (typeof window !== "undefined") return window.location.origin;

  // Log env vars in production for debugging (remove after confirming fix)
  if (typeof window === "undefined") {
    console.log("[tRPC] getBaseUrl SSR:", {
      VERCEL_ENV: env.VERCEL_ENV,
      VERCEL_PROJECT_PRODUCTION_URL: env.VERCEL_PROJECT_PRODUCTION_URL,
      VERCEL_URL: env.VERCEL_URL,
    });
  }

  // In production, use the production URL to avoid redirects that return HTML
  if (env.VERCEL_ENV === "production" && env.VERCEL_PROJECT_PRODUCTION_URL) {
    const url = `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
    console.log("[tRPC] Using production URL:", url);
    return url;
  }
  // Preview deployments use VERCEL_URL
  if (env.VERCEL_URL) {
    const url = `https://${env.VERCEL_URL}`;
    console.log("[tRPC] Using VERCEL_URL:", url);
    return url;
  }
  // eslint-disable-next-line no-restricted-properties
  return `http://localhost:${process.env.PORT ?? 3000}`;
};