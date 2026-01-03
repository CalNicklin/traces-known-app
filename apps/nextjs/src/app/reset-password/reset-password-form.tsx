"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircledIcon, LockClosedIcon } from "@radix-ui/react-icons";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
} from "@acme/ui";

import { authClient } from "~/auth/client";

// Password requirements matching the validation schema
const PASSWORD_REQUIREMENTS = [
  { label: "At least 12 characters", test: (p: string) => p.length >= 12 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
  {
    label: "One special character",
    test: (p: string) => /[^A-Za-z0-9]/.test(p),
  },
];

function validatePassword(password: string): string | null {
  if (!password) return "Password is required";
  if (password.length < 12) return "Password must be at least 12 characters";
  if (password.length > 128) return "Password must be at most 128 characters";
  if (!/[A-Z]/.test(password))
    return "Password must contain at least one uppercase letter";
  if (!/[a-z]/.test(password))
    return "Password must contain at least one lowercase letter";
  if (!/[0-9]/.test(password))
    return "Password must contain at least one number";
  if (!/[^A-Za-z0-9]/.test(password))
    return "Password must contain at least one special character";
  return null;
}

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for token on mount
  useEffect(() => {
    if (!token) {
      setError(
        "Invalid or missing reset token. Please request a new password reset link.",
      );
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate password
    const pwError = validatePassword(password);
    if (pwError) {
      setPasswordError(pwError);
      return;
    }

    // Validate confirm password
    if (password !== confirmPassword) {
      setConfirmError("Passwords do not match");
      return;
    }

    if (!token) {
      setError("Missing reset token");
      return;
    }

    setIsSubmitting(true);

    const { error: resetError } = await authClient.resetPassword({
      newPassword: password,
      token,
    });

    setIsSubmitting(false);

    if (resetError) {
      setError(
        resetError.message ??
          "Failed to reset password. The link may have expired.",
      );
      return;
    }

    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircledIcon className="h-8 w-8 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl">Password reset successful</CardTitle>
            <CardDescription className="text-base">
              Your password has been updated. You can now sign in with your new
              password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="lg" onClick={() => router.push("/")}>
              Sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <LockClosedIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Reset your password</CardTitle>
          <CardDescription className="text-base">
            Enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600"
                role="alert"
              >
                {error}
                {!token && (
                  <Link
                    href="/forgot-password"
                    className="mt-2 block font-medium underline"
                  >
                    Request a new reset link
                  </Link>
                )}
              </div>
            )}

            <FieldGroup>
              <Field data-invalid={!!passwordError}>
                <FieldLabel htmlFor="password">New Password</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  onBlur={() => setPasswordError(validatePassword(password))}
                  aria-invalid={!!passwordError}
                  placeholder="Create a strong password"
                  disabled={!token}
                />
                {passwordError && <FieldError errors={[passwordError]} />}
              </Field>

              {/* Password requirements checklist */}
              {password.length > 0 && (
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Password requirements:
                  </p>
                  <ul className="space-y-1">
                    {PASSWORD_REQUIREMENTS.map((req) => {
                      const passed = req.test(password);
                      return (
                        <li
                          key={req.label}
                          className={`flex items-center gap-2 text-xs ${
                            passed ? "text-emerald-600" : "text-muted-foreground"
                          }`}
                        >
                          <span
                            className={`inline-block h-1.5 w-1.5 rounded-full ${
                              passed ? "bg-emerald-500" : "bg-muted-foreground/30"
                            }`}
                          />
                          {req.label}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <Field data-invalid={!!confirmError}>
                <FieldLabel htmlFor="confirmPassword">
                  Confirm Password
                </FieldLabel>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (confirmError) setConfirmError(null);
                  }}
                  onBlur={() => {
                    if (confirmPassword && confirmPassword !== password) {
                      setConfirmError("Passwords do not match");
                    }
                  }}
                  aria-invalid={!!confirmError}
                  placeholder="Confirm your password"
                  disabled={!token}
                />
                {confirmError && <FieldError errors={[confirmError]} />}
              </Field>
            </FieldGroup>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSubmitting || !token}
            >
              {isSubmitting ? "Resetting..." : "Reset password"}
            </Button>

            <div className="text-center">
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Back to sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
