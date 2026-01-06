"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

import { Button } from "@acme/ui";
import { toast } from "@acme/ui/toast";

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
  onError?: (error: string) => void;
}

type ScannerState = "initializing" | "scanning" | "error" | "permission_denied";

const SCANNER_CONFIG = {
  fps: 10,
  aspectRatio: 1.777,
  // No qrbox - we use our own custom viewfinder overlay
  formatsToSupport: [
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E,
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.ITF,
  ],
};

export function BarcodeScanner({ onDetected, onError }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ScannerState>("initializing");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const hasDetectedRef = useRef(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const isScanning = scannerRef.current.isScanning;
        if (isScanning) {
          await scannerRef.current.stop();
        }
      } catch {
        // Ignore errors when stopping
      }
    }
  }, []);

  const handleScanSuccess = useCallback(
    (decodedText: string) => {
      // Prevent multiple detections
      if (hasDetectedRef.current) return;
      hasDetectedRef.current = true;

      // Vibrate if supported (mobile)
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }

      onDetected(decodedText);
    },
    [onDetected],
  );

  const handleScanError = useCallback((_errorMessage: string) => {
    // Scan errors are expected when no barcode is in view - ignore them
  }, []);

  useEffect(() => {
    const elementId = "barcode-scanner-container";
    let mounted = true;

    const startScanner = async () => {
      if (!containerRef.current || !mounted) return;

      try {
        // Create scanner instance
        scannerRef.current = new Html5Qrcode(elementId, {
          formatsToSupport: SCANNER_CONFIG.formatsToSupport,
          verbose: false,
        });

        // Get available cameras
        const cameras = await Html5Qrcode.getCameras();

        if (cameras.length === 0) {
          throw new Error("No camera found on this device");
        }

        // Prefer back camera on mobile, otherwise use first available
        const backCamera = cameras.find(
          (camera) =>
            camera.label.toLowerCase().includes("back") ||
            camera.label.toLowerCase().includes("rear"),
        );
        const cameraId = backCamera?.id ?? cameras[0]?.id;

        if (!cameraId) {
          throw new Error("Could not find a valid camera");
        }

        if (!mounted) return;

        // Start scanning - no qrbox so library doesn't draw its own overlay
        await scannerRef.current.start(
          cameraId,
          {
            fps: SCANNER_CONFIG.fps,
            aspectRatio: SCANNER_CONFIG.aspectRatio,
          },
          handleScanSuccess,
          handleScanError,
        );

        if (mounted) {
          setState("scanning");
        }
      } catch (error) {
        if (!mounted) return;

        const errorMsg =
          error instanceof Error ? error.message : "Failed to start scanner";

        // Check for permission denied
        if (
          errorMsg.toLowerCase().includes("permission") ||
          errorMsg.toLowerCase().includes("denied") ||
          errorMsg.toLowerCase().includes("notallowederror")
        ) {
          setState("permission_denied");
          setErrorMessage(
            "Camera access denied. Please allow camera access to scan barcodes.",
          );
        } else {
          setState("error");
          setErrorMessage(errorMsg);
        }

        onError?.(errorMsg);
      }
    };

    void startScanner();

    return () => {
      mounted = false;
      void stopScanner();
    };
  }, [handleScanSuccess, handleScanError, stopScanner, onError]);

  const handleRetry = useCallback(() => {
    hasDetectedRef.current = false;
    setState("initializing");
    setErrorMessage("");

    // Force re-mount by clearing and recreating
    void stopScanner().then(() => {
      // Small delay to ensure cleanup
      setTimeout(() => {
        window.location.reload();
      }, 100);
    });
  }, [stopScanner]);

  return (
    <div className="relative w-full">
      {/* Scanner container - html5-qrcode will inject video here */}
      <div
        id="barcode-scanner-container"
        ref={containerRef}
        className="relative aspect-video w-full overflow-hidden rounded-lg bg-black [&_video]:object-cover"
      />

      {/* Viewfinder overlay - matches qrbox dimensions (280x160) */}
      {state === "scanning" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {/* Scanning window with cutout effect */}
          <div
            className="relative"
            style={{
              width: 280,
              height: 160,
              boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
            }}
          >
            {/* Corner brackets */}
            <div className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-white" />
            <div className="absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-white" />
            <div className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-white" />
            <div className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-white" />
            {/* Scanning line animation */}
            <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 animate-pulse bg-red-500/70" />
          </div>
        </div>
      )}

      {/* Loading state */}
      {state === "initializing" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center text-white">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <p className="text-sm">Starting camera...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {(state === "error" || state === "permission_denied") && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-4">
          <div className="text-center text-white">
            <p className="mb-4 text-sm">{errorMessage}</p>
            {state === "permission_denied" ? (
              <p className="text-xs text-muted-foreground">
                Check your browser settings to enable camera access.
              </p>
            ) : (
              <Button variant="secondary" size="sm" onClick={handleRetry}>
                Try Again
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      {state === "scanning" && (
        <p className="mt-3 text-center text-sm text-muted-foreground">
          Position the barcode within the frame
        </p>
      )}
    </div>
  );
}
