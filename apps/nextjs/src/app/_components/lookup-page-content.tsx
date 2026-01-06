"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import type { mapOpenFoodFactsToProductForm } from "@acme/external-services/open-food-facts";
import { Card, CardContent } from "@acme/ui";

import { BarcodeScannerDialog } from "./barcode-scanner-dialog";
import { NewProductDialog } from "./new-product-dialog";
import { useBarcodeLookup } from "./use-barcode-lookup";

interface LookupPageContentProps {
  isLoggedIn: boolean;
}

type OffProductData = ReturnType<typeof mapOpenFoodFactsToProductForm>;

export function LookupPageContent({ isLoggedIn }: LookupPageContentProps) {
  const router = useRouter();
  const [showNewProductDialog, setShowNewProductDialog] = useState(false);
  const [offProductData, setOffProductData] = useState<OffProductData | null>(
    null,
  );

  const handleProductFound = useCallback(
    (productId: string) => {
      router.push(`/product/${productId}`);
    },
    [router],
  );

  const handleOpenFoodFactsData = useCallback((mappedData: OffProductData) => {
    // Product found in Open Food Facts but not in our database
    // Store the data and show confirmation dialog
    setOffProductData(mappedData);
    setShowNewProductDialog(true);
  }, []);

  const { isLookingUp, handleBarcodeLookup } = useBarcodeLookup({
    onProductFound: handleProductFound,
    onOpenFoodFactsData: handleOpenFoodFactsData,
  });

  const handleBarcodeDetected = useCallback(
    (barcode: string) => {
      // Pass barcode directly to avoid state timing issues
      handleBarcodeLookup(barcode);
    },
    [handleBarcodeLookup],
  );

  if (!isLoggedIn) {
    return null;
  }

  return (
    <>
      <Card className="bg-muted/50">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p className="text-sm text-muted-foreground">
            Scan a product barcode to look it up instantly
          </p>
          <BarcodeScannerDialog
            onDetected={handleBarcodeDetected}
            disabled={isLookingUp}
          />
        </CardContent>
      </Card>

      <NewProductDialog
        open={showNewProductDialog}
        onOpenChange={setShowNewProductDialog}
        productName={offProductData?.name}
        barcode={offProductData?.barcode ?? ""}
      />
    </>
  );
}
