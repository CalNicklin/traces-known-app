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
