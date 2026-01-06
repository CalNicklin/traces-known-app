"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui";

interface NewProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string | undefined;
  barcode: string;
}

export function NewProductDialog({
  open,
  onOpenChange,
  productName,
  barcode,
}: NewProductDialogProps) {
  const router = useRouter();

  const handleConfirm = useCallback(() => {
    onOpenChange(false);
    router.push(`/product/new?barcode=${encodeURIComponent(barcode)}`);
  }, [router, barcode, onOpenChange]);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const displayName = productName ?? "this product";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Product Not in Database</DialogTitle>
          <DialogDescription className="space-y-3 pt-2">
            <span className="block">
              We don&apos;t have <strong>&quot;{displayName}&quot;</strong> in
              our database yet.
            </span>
            <span className="block">
              Would you like to help others with allergies by sharing your
              experience with this product?
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={handleCancel}>
            Not Now
          </Button>
          <Button onClick={handleConfirm}>Yes, I&apos;ll Help</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
