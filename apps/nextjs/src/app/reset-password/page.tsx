import { Suspense } from "react";

import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[80vh] items-center justify-center px-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
