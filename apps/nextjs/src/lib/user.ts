import type { User } from "@acme/db/schema";

/**
 * Helper functions for working with user data
 * Types are derived from database schema
 */

type UserDisplayFields = Pick<User, "name"> &
  Partial<Pick<User, "displayUsername" | "username">>;

export function getUserDisplayName(user: UserDisplayFields): string {
  return user.displayUsername ?? user.username ?? user.name;
}

export function getUserInitials(user: Pick<User, "name">): string {
  const parts = user.name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]?.charAt(0) ?? ""}${parts[1]?.charAt(0) ?? ""}`.toUpperCase();
  }
  return user.name.substring(0, 2).toUpperCase();
}

/**
 * Format a date consistently to avoid hydration mismatches.
 * Uses a fixed locale (en-US) to ensure server and client produce the same output.
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
