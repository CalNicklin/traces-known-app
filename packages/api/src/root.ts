import { authRouter } from "./router/auth";
import { postRouter } from "./router/post";
import { productRouter } from "./router/product";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  post: postRouter,
  product: productRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
