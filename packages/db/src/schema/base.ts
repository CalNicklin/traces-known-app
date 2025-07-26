import { pgSchema, timestamp } from "drizzle-orm/pg-core";

export const appSchema = pgSchema("app");

export const timestamps = {
  updatedAt: timestamp().defaultNow().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  deletedAt: timestamp(),
};
