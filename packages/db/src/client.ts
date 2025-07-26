import { sql } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";

import * as allergenSchema from "./schema/allergen-schema";
import * as authSchema from "./schema/auth-schema";
import * as postSchema from "./schema/posts-schema";
import * as productSchema from "./schema/product-schema";
import * as relations from "./schema/relations";
import * as reportSchema from "./schema/report-schema";

export const db = drizzle({
  client: sql,
  schema: {
    ...authSchema,
    ...postSchema,
    ...productSchema,
    ...reportSchema,
    ...allergenSchema,
    ...relations,
  },
  casing: "snake_case",
});
