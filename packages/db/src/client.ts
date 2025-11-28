import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as allergenSchema from "./schema/allergen-schema";
import * as authSchema from "./schema/auth-schema";
import * as postSchema from "./schema/posts-schema";
import * as productSchema from "./schema/product-schema";
import * as relations from "./schema/relations";
import * as reportSchema from "./schema/report-schema";

const connectionString = process.env.POSTGRES_URL;
if (!connectionString) {
  throw new Error("Missing POSTGRES_URL environment variable");
}

const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, {
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
