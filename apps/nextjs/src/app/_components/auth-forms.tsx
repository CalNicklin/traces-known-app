"use client";

import { useState } from "react";

import { Button } from "@acme/ui/button";

import { signInAction, signUpAction } from "./auth-actions";

export function AuthForms() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      {/* Toggle between Sign Up and Sign In */}
      <div className="flex rounded-lg border bg-muted p-1">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(false);
            setError("");
          }}
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
          onClick={() => {
            setIsSignUp(true);
            setError("");
          }}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            isSignUp
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Form */}
      <form
        className="space-y-4"
        action={isSignUp ? signUpAction : signInAction}
      >
        {isSignUp && (
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium">
              Name
            </label>
            <input
              type="text"
              name="name"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter your full name"
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium">
            Email
          </label>
          <input
            type="email"
            name="email"
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium">
            Password
          </label>
          <input
            type="password"
            name="password"
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Enter your password"
          />
        </div>

        {isSignUp && (
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-medium"
            >
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Confirm your password"
            />
          </div>
        )}

        <Button type="submit" size="lg" className="w-full">
          {isSignUp ? "Sign Up" : "Sign In"}
        </Button>
      </form>
    </div>
  );
}
