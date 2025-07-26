import { allergenRouter } from "./router/allergen";
import { authRouter } from "./router/auth";
import { postRouter } from "./router/post";
import { productRouter } from "./router/product";
import { reportRouter } from "./router/report";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  allergen: allergenRouter,
  auth: authRouter,
  post: postRouter,
  product: productRouter,
  report: reportRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
