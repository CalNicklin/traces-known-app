"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  initialFormState,
  mergeForm,
  useForm,
  useStore,
  useTransform,
} from "@tanstack/react-form-nextjs";

import { Field, FieldError, FieldGroup, FieldLabel, Input } from "@acme/ui";
import { Button } from "@acme/ui/button";

import { signInAction, signUpAction } from "../_actions/auth-actions";
import {
  emailSchema,
  nameSchema,
  passwordSchema,
  signInFormOpts,
  signInPasswordSchema,
  signUpFormOpts,
  usernameSchema,
} from "./auth-schemas";

const passwordSchemaSignIn = signInPasswordSchema;
const passwordSchemaSignUp = passwordSchema;

function SignInForm() {
  const router = useRouter();
  const [state, action] = useActionState(signInAction, initialFormState);

  const form = useForm({
    ...signInFormOpts,
    transform: useTransform((baseForm) => mergeForm(baseForm, state), [state]),
  });

  const formErrors = useStore(form.store, (formState) => formState.errors);
  const canSubmit = useStore(form.store, (formState) => formState.canSubmit);

  useEffect(() => {
    const stateWithSuccess = state as { success?: boolean } | undefined;
    if (stateWithSuccess?.success) {
      router.push("/");
    }
  }, [state, router]);

  return (
    <form
      action={action as never}
      onSubmit={(e) => {
        // Prevent posting invalid inputs to the Server Action, but keep the button clickable
        // so users can re-attempt after fixing inputs.
        if (!canSubmit) {
          e.preventDefault();
        }
        void form.handleSubmit();
      }}
      className="space-y-4"
    >
      {formErrors.length > 0 && (
        <div
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600"
          role="alert"
        >
          {formErrors.map((error, index) => (
            <p key={index}>{String(error)}</p>
          ))}
        </div>
      )}

      <FieldGroup>
        <form.Field
          name="email"
          validators={{
            onChange: ({ value }) => {
              const result = emailSchema.safeParse(value);
              return result.success
                ? undefined
                : result.error.issues[0]?.message;
            },
          }}
        >
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  autoComplete="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="Enter your email"
                />
                {isInvalid && (
                  <FieldError errors={field.state.meta.errors as string[]} />
                )}
              </Field>
            );
          }}
        </form.Field>

        <form.Field
          name="password"
          validators={{
            onChange: ({ value }) => {
              const result = passwordSchemaSignIn.safeParse(value);
              return result.success
                ? undefined
                : result.error.issues[0]?.message;
            },
          }}
        >
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  autoComplete="current-password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="Enter your password"
                />
                {isInvalid && (
                  <FieldError errors={field.state.meta.errors as string[]} />
                )}
              </Field>
            );
          }}
        </form.Field>
      </FieldGroup>

      <div className="text-right">
        <Link
          href="/forgot-password"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Forgot password?
        </Link>
      </div>

      <form.Subscribe
        selector={(formState) => [formState.canSubmit, formState.isSubmitting]}
      >
        {([canSubmit, isSubmitting]) => (
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isSubmitting}
            aria-disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}

function SignUpForm() {
  const router = useRouter();
  const [state, action] = useActionState(signUpAction, initialFormState);

  const form = useForm({
    ...signUpFormOpts,
    transform: useTransform((baseForm) => mergeForm(baseForm, state), [state]),
  });

  const formErrors = useStore(form.store, (formState) => formState.errors);
  const canSubmit = useStore(form.store, (formState) => formState.canSubmit);

  useEffect(() => {
    const stateWithSuccess = state as { success?: boolean } | undefined;
    if (stateWithSuccess?.success) {
      router.push("/");
    }
  }, [state, router]);

  return (
    <form
      action={action as never}
      onSubmit={(e) => {
        // Keep the button clickable so users can re-attempt after fixing inputs,
        // but prevent posting to the Server Action when the form is invalid.
        if (!canSubmit) {
          e.preventDefault();
        }
        void form.handleSubmit();
      }}
      className="space-y-4"
    >
      {formErrors.length > 0 && (
        <div
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600"
          role="alert"
        >
          {formErrors.map((error, index) => (
            <p key={index}>{String(error)}</p>
          ))}
        </div>
      )}

      <FieldGroup>
        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) => {
              const result = nameSchema.safeParse(value);
              return result.success
                ? undefined
                : result.error.issues[0]?.message;
            },
          }}
        >
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="text"
                  autoComplete="name"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="Enter your name"
                />
                {isInvalid && (
                  <FieldError errors={field.state.meta.errors as string[]} />
                )}
              </Field>
            );
          }}
        </form.Field>

        <form.Field
          name="username"
          validators={{
            onChange: ({ value }) => {
              const result = usernameSchema.safeParse(value);
              return result.success
                ? undefined
                : result.error.issues[0]?.message;
            },
          }}
        >
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Username</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="text"
                  autoComplete="username"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="Choose a username"
                />
                {isInvalid && (
                  <FieldError errors={field.state.meta.errors as string[]} />
                )}
              </Field>
            );
          }}
        </form.Field>

        <form.Field
          name="email"
          validators={{
            onChange: ({ value }) => {
              const result = emailSchema.safeParse(value);
              return result.success
                ? undefined
                : result.error.issues[0]?.message;
            },
          }}
        >
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  autoComplete="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="Enter your email"
                />
                {isInvalid && (
                  <FieldError errors={field.state.meta.errors as string[]} />
                )}
              </Field>
            );
          }}
        </form.Field>

        <form.Field
          name="password"
          validators={{
            onChange: ({ value }) => {
              const result = passwordSchemaSignUp.safeParse(value);
              return result.success
                ? undefined
                : result.error.issues[0]?.message;
            },
          }}
        >
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  autoComplete="new-password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="Create a strong password"
                />
                {isInvalid && (
                  <FieldError errors={field.state.meta.errors as string[]} />
                )}
              </Field>
            );
          }}
        </form.Field>

        <form.Field
          name="confirmPassword"
          validators={{
            onChangeListenTo: ["password"],
            onChange: ({ value, fieldApi }) => {
              if (!value) return "Please confirm your password";
              const password = fieldApi.form.getFieldValue("password");
              if (value !== password) return "Passwords do not match";
              return undefined;
            },
          }}
        >
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Confirm Password</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  autoComplete="new-password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="Confirm your password"
                />
                {isInvalid && (
                  <FieldError errors={field.state.meta.errors as string[]} />
                )}
              </Field>
            );
          }}
        </form.Field>
      </FieldGroup>

      <form.Subscribe
        selector={(formState) => [formState.canSubmit, formState.isSubmitting]}
      >
        {([canSubmit, isSubmitting]) => (
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isSubmitting}
            aria-disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? "Creating account..." : "Sign Up"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}

export function AuthForms() {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      {/* Toggle between Sign Up and Sign In */}
      <div className="flex rounded-lg border bg-muted p-1">
        <button
          type="button"
          onClick={() => setIsSignUp(false)}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            !isSignUp
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setIsSignUp(true)}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            isSignUp
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Render the appropriate form */}
      {isSignUp ? <SignUpForm /> : <SignInForm />}
    </div>
  );
}
