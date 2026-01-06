"use client";

import Link from "next/link";
import { CheckCircledIcon } from "@radix-ui/react-icons";

import { Text } from "@acme/ui";
import { Button } from "@acme/ui/button";

interface ThankYouStepProps {
  productId: string;
  reportType: "safe" | "reaction" | undefined;
}

export function ThankYouStep({ productId, reportType }: ThankYouStepProps) {
  const message =
    reportType === "safe"
      ? "Your report helps others with allergies feel confident about safe food choices."
      : "Your report helps others avoid potential allergic reactions.";

  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
        <CheckCircledIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
      </div>

      <h2 className="mb-2 text-2xl font-bold">Thank You!</h2>

      <Text variant="muted" className="mb-4 max-w-md">
        {message}
      </Text>

      <Button asChild size="lg">
        <Link href={`/product/${productId}`}>View Product</Link>
      </Button>
    </div>
  );
}
