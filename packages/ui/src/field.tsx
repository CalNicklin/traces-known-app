"use client";

import * as React from "react";

import { cn } from ".";
import { Label } from "./label";

/**
 * Field components for TanStack Form
 * Based on shadcn/ui field components
 */

interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "vertical" | "horizontal";
  "data-invalid"?: boolean;
}

export function Field({
  className,
  orientation = "vertical",
  ...props
}: FieldProps) {
  return (
    <div
      className={cn(
        "space-y-2",
        orientation === "horizontal" && "flex flex-row items-start gap-4 space-y-0",
        props["data-invalid"] && "text-destructive",
        className,
      )}
      {...props}
    />
  );
}

interface FieldGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

export function FieldGroup({ className, ...props }: FieldGroupProps) {
  return <div className={cn("space-y-4", className)} {...props} />;
}

interface FieldSetProps extends React.FieldsetHTMLAttributes<HTMLFieldSetElement> {}

export function FieldSet({ className, ...props }: FieldSetProps) {
  return (
    <fieldset
      className={cn("space-y-4 border-none p-0", className)}
      {...props}
    />
  );
}

interface FieldLegendProps extends React.HTMLAttributes<HTMLLegendElement> {
  variant?: "default" | "label";
}

export function FieldLegend({
  className,
  variant = "default",
  ...props
}: FieldLegendProps) {
  return (
    <legend
      className={cn(
        variant === "label" && "text-sm font-medium leading-none",
        className,
      )}
      {...props}
    />
  );
}

interface FieldLabelProps extends React.ComponentPropsWithoutRef<typeof Label> {}

export function FieldLabel({ className, ...props }: FieldLabelProps) {
  return <Label className={cn(className)} {...props} />;
}

interface FieldDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function FieldDescription({ className, ...props }: FieldDescriptionProps) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
}

interface FieldErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {
  errors?: (string | undefined)[];
}

export function FieldError({ className, errors, children, ...props }: FieldErrorProps) {
  const errorMessages = errors?.filter(Boolean) ?? [];
  
  if (errorMessages.length === 0 && !children) {
    return null;
  }

  return (
    <div className={cn("space-y-1", className)} {...props}>
      {errorMessages.map((error, index) => (
        <p
          key={index}
          className="text-sm font-medium text-destructive"
          role="alert"
        >
          {error}
        </p>
      ))}
      {children && (
        <p className="text-sm font-medium text-destructive" role="alert">
          {children}
        </p>
      )}
    </div>
  );
}

interface FieldContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function FieldContent({ className, ...props }: FieldContentProps) {
  return <div className={cn("flex-1 space-y-2", className)} {...props} />;
}


