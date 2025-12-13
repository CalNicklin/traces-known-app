// Client-safe entrypoint: validation only.
// Server-only initAuth lives in ./server.ts (exported as @acme/auth/server).
export * from "./validation";
export type { Auth, Session } from "./server";
