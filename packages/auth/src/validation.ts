import { z } from "zod/v4";

import { UserInsertSchema } from "@acme/db/schema";

/**
 * Shared auth validation schemas.
 *
 * Rules:
 * - DB-backed fields (name/email/username) are derived from Drizzle via drizzle-zod (`UserInsertSchema`).
 * - Non-DB fields (password/confirmPassword) live here so apps don't define Zod schemas.
 */

// DB-backed field schemas (derived from Drizzle)
export const emailSchema = UserInsertSchema.shape.email;
export const nameSchema = UserInsertSchema.shape.name;
export const usernameSchema = UserInsertSchema.shape.username;

// Non-DB field schemas (policy)
export const signInPasswordSchema = z.string().min(1, "Password is required");

export const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .max(128, "Password must be at most 128 characters")
  .refine((password) => /[A-Z]/.test(password), {
    message: "Password must contain at least one uppercase letter",
  })
  .refine((password) => /[a-z]/.test(password), {
    message: "Password must contain at least one lowercase letter",
  })
  .refine((password) => /[0-9]/.test(password), {
    message: "Password must contain at least one number",
  })
  .refine((password) => /[^A-Za-z0-9]/.test(password), {
    message: "Password must contain at least one special character",
  });

export const confirmPasswordSchema = z
  .string()
  .min(1, "Please confirm your password");

// Request payload schemas
export const signInSchema = z.object({
  email: emailSchema,
  password: signInPasswordSchema,
});

export const signUpSchema = UserInsertSchema.pick({
  name: true,
  email: true,
  username: true,
})
  .extend({
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignInFormValues = z.infer<typeof signInSchema>;
export type SignUpFormValues = z.infer<typeof signUpSchema>;



