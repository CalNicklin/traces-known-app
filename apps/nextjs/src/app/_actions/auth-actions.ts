"use server";

import {
  createServerValidate,
  ServerValidateError,
} from "@tanstack/react-form-nextjs";
import { APIError } from "better-auth/api";

import { signInSchema, signUpSchema } from "@acme/auth/validation";

import { auth } from "~/auth/server";
import { signInFormOpts, signUpFormOpts } from "../_components/auth-schemas";

// Server-side validation for sign in
const serverValidateSignIn = createServerValidate({
  ...signInFormOpts,
  // Required by this version of @tanstack/react-form-nextjs
  onServerValidate: () => undefined,
  validators: {
    onSubmit: signInSchema,
  },
});

// Server-side validation for sign up
const serverValidateSignUp = createServerValidate({
  ...signUpFormOpts,
  // Required by this version of @tanstack/react-form-nextjs
  onServerValidate: () => undefined,
  validators: {
    onSubmit: signUpSchema,
  },
});

export async function signInAction(prev: unknown, formData: FormData) {
  console.log("🔐 Sign in action called");

  try {
    const validatedData = await serverValidateSignIn(formData);

    console.log("🔐 Attempting sign in for:", validatedData.email);

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Request timeout")), 10000);
    });

    const signInPromise = auth.api.signInEmail({
      body: {
        email: validatedData.email,
        password: validatedData.password,
      },
    });

    const result = await Promise.race([signInPromise, timeoutPromise]);

    console.log("✅ Sign in successful:", { hasToken: !!result.token });

    return { success: true };
  } catch (e) {
    console.error("❌ Sign in error:", e);

    if (e instanceof ServerValidateError) {
      return e.formState;
    }

    if (e instanceof APIError) {
      return {
        errors: [e.message || "Invalid email or password"],
        fieldErrors: {},
      };
    }

    return {
      errors: [e instanceof Error ? e.message : "Invalid email or password"],
      fieldErrors: {},
    };
  }
}

export async function signUpAction(prev: unknown, formData: FormData) {
  console.log("📝 Sign up action called");

  try {
    const validatedData = await serverValidateSignUp(formData);

    console.log("📝 Attempting sign up for:", validatedData.email);

    const result = await auth.api.signUpEmail({
      body: {
        name: validatedData.name,
        username: validatedData.username.trim(),
        email: validatedData.email,
        password: validatedData.password,
      },
    });

    console.log("✅ Sign up successful:", { hasToken: !!result.token });

    return { success: true };
  } catch (e) {
    console.error("❌ Sign up error:", e);

    if (e instanceof ServerValidateError) {
      return e.formState;
    }

    if (e instanceof APIError) {
      return {
        errors: [e.message || "Failed to sign up. Please try again."],
        fieldErrors: {},
      };
    }

    return {
      errors: [
        e instanceof Error ? e.message : "Failed to sign up. Please try again.",
      ],
      fieldErrors: {},
    };
  }
}


