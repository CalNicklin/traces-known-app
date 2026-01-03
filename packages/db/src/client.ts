import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as allergenSchema from "./schema/allergen-schema";
import * as authSchema from "./schema/auth-schema";
import * as categorySchema from "./schema/category-schema";
import * as commentSchema from "./schema/comment-schema";
import * as notificationSchema from "./schema/notification-schema";
import * as postSchema from "./schema/posts-schema";
import * as productAISummarySchema from "./schema/product-ai-summary-schema";
import * as productImageSchema from "./schema/product-image-schema";
import * as productSchema from "./schema/product-schema";
import * as productViewSchema from "./schema/product-view-schema";
import * as relations from "./schema/relations";
import * as reportImageSchema from "./schema/report-image-schema";
import * as reportSchema from "./schema/report-schema";

if (!process.env.POSTGRES_URL) {
  throw new Error("Missing POSTGRES_URL environment variable");
}

// Supabase Transaction pooler (port 6543) doesn't support prepared statements
// Must set prepare: false for compatibility
const client = postgres(process.env.POSTGRES_URL, {
  prepare: false, // Required for Supabase Transaction pooler mode
  max: 1, // Limit connections for serverless environments
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
  max_lifetime: 60 * 5, // Force connection refresh every 5 minutes (before pooler kills it)
});

export const db = drizzle(client, {
  schema: {
    ...authSchema,
    ...postSchema,
    ...productSchema,
    ...productImageSchema,
    ...productAISummarySchema,
    ...reportSchema,
    ...reportImageSchema,
    ...allergenSchema,
    ...categorySchema,
    ...productViewSchema,
    ...commentSchema,
    ...notificationSchema,
    ...relations,
  },
  casing: "snake_case",
});
