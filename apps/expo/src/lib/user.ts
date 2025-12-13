/**
 * Helper functions for working with user data
 */

export function getUserDisplayName(user: {
  name: string;
  username?: string | null;
}): string {
  return user.username ?? user.name;
}
