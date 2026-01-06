"use client";

import { useCallback, useState } from "react";
import { CameraIcon } from "@radix-ui/react-icons";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui";

import { BarcodeScanner } from "./barcode-scanner";

interface BarcodeScannerDialogProps {
  onDetected: (barcode: string) => void;
  disabled?: boolean;
}

export function BarcodeScannerDialog({
  onDetected,
  disabled,
}: BarcodeScannerDialogProps) {
  const [open, setOpen] = useState(false);

  const handleDetected = useCallback(
    (barcode: string) => {
      setOpen(false);
      onDetected(barcode);
    },
    [onDetected],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled} className="gap-2">
          <CameraIcon className="h-4 w-4" />
          Scan Barcode
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Barcode</DialogTitle>
          <DialogDescription>
            Point your camera at a product barcode to look it up
          </DialogDescription>
        </DialogHeader>
        {open && <BarcodeScanner onDetected={handleDetected} />}
      </DialogContent>
    </Dialog>
  );
}
