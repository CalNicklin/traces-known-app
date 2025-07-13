"use server";

import { redirect } from "next/navigation";

import { auth } from "~/auth/server";

export async function signInAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  console.log("🔐 Attempting sign in for:", email);

  try {
    const result = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });

    console.log("✅ Sign in successful:", { hasToken: !!result.token });
  } catch (error) {
    console.error("❌ Sign in error:", error);
    throw new Error("Invalid email or password");
  }

  // Redirect after successful auth (outside try/catch)
  redirect("/");
}

export async function signUpAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  console.log("📝 Attempting sign up for:", email, "with name:", name);

  if (password !== confirmPassword) {
    console.error("❌ Passwords do not match");
    throw new Error("Passwords do not match");
  }

  try {
    const result = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
    });

    console.log("✅ Sign up successful:", { hasToken: !!result.token });
  } catch (error) {
    console.error("❌ Sign up error:", error);
    throw new Error("Failed to sign up. Please try again.");
  }

  // Redirect after successful auth (outside try/catch)
  redirect("/");
}
