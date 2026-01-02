import { allergenRouter } from "./router/allergen";
import { authRouter } from "./router/auth";
import { categoryRouter } from "./router/category";
import { commentRouter } from "./router/comment";
import { openFoodFactsRouter } from "./router/external";
import { imageRouter } from "./router/image";
import { notificationRouter } from "./router/notification";
import { postRouter } from "./router/post";
import { productRouter } from "./router/product";
import { reportRouter } from "./router/report";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  allergen: allergenRouter,
  auth: authRouter,
  category: categoryRouter,
  comment: commentRouter,
  image: imageRouter,
  notification: notificationRouter,
  post: postRouter,
  product: productRouter,
  report: reportRouter,
  external: createTRPCRouter({
    openFoodFacts: openFoodFactsRouter,
  }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
