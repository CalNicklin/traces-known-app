import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { mapOpenFoodFactsToProductForm } from "@acme/external-services/open-food-facts";
import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";

interface UseBarcodeLookupOptions {
  /**
   * Callback when product is found in database
   */
  onProductFound?: (productId: string) => void;
  /**
   * Callback when product is found in Open Food Facts but not in DB
   * Receives the mapped product data ready for form pre-filling
   */
  onOpenFoodFactsData?: (
    mappedData: ReturnType<typeof mapOpenFoodFactsToProductForm>,
  ) => void;
}

/**
 * Reusable hook for barcode lookup functionality
 * Handles querying Open Food Facts and checking database
 */
export function useBarcodeLookup(options: UseBarcodeLookupOptions = {}) {
  const { onProductFound, onOpenFoodFactsData } = options;
  const trpc = useTRPC();
  const [barcodeLookup, setBarcodeLookup] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Use refs to store callbacks to avoid dependency issues
  const onProductFoundRef = useRef(onProductFound);
  const onOpenFoodFactsDataRef = useRef(onOpenFoodFactsData);

  // Update refs when callbacks change
  useEffect(() => {
    onProductFoundRef.current = onProductFound;
    onOpenFoodFactsDataRef.current = onOpenFoodFactsData;
  }, [onProductFound, onOpenFoodFactsData]);

  // Only enable queries when we have a valid barcode and lookup is active
  const trimmedBarcode = barcodeLookup.trim();
  const hasValidBarcode = trimmedBarcode.length > 0;
  const shouldQuery = hasValidBarcode && isLookingUp;

  // Use a placeholder barcode for query options when empty to ensure valid queryFn
  // The query won't run because enabled is false
  const queryBarcode = hasValidBarcode ? trimmedBarcode : "placeholder";

  // Query Open Food Facts by barcode (only when lookup is triggered)
  const {
    data: offData,
    isFetching: isFetchingOFF,
    error: offError,
  } = useQuery({
    ...trpc.external.openFoodFacts.byCode.queryOptions({
      code: queryBarcode,
    }),
    enabled: shouldQuery,
    retry: false,
  });

  // Check if product exists in DB by barcode
  const { data: existingProduct } = useQuery({
    ...trpc.product.byBarcode.queryOptions({
      barcode: queryBarcode,
    }),
    enabled: shouldQuery,
    retry: false,
  });

  // Handle Open Food Facts data fetch and product selection/pre-filling
  useEffect(() => {
    // Only process when lookup is active and queries have finished
    if (!isLookingUp || isFetchingOFF) {
      return;
    }

    // Check if product exists in DB first (this query runs in parallel)
    if (existingProduct) {
      // Product exists in DB - call onProductFound callback
      if (onProductFoundRef.current) {
        onProductFoundRef.current(existingProduct.id);
      }
      setIsLookingUp(false);
      setBarcodeLookup("");
      toast.success("Product found in database");
      return;
    }

    // Product not in DB - check if we have Open Food Facts data
    if (offData && !offError) {
      // Map Open Food Facts data and call callback
      const mappedData = mapOpenFoodFactsToProductForm(offData);
      if (onOpenFoodFactsDataRef.current) {
        onOpenFoodFactsDataRef.current(mappedData);
      }
      setIsLookingUp(false);
      toast.success("Product data loaded from Open Food Facts");
      return;
    }

    // If queries completed but no data found, handle in error effect
  }, [offData, offError, existingProduct, isLookingUp, isFetchingOFF]);

  // Handle lookup errors - only when queries have definitely completed
  useEffect(() => {
    // Only check errors when lookup is active, queries have finished, and we have a barcode
    if (!isLookingUp || isFetchingOFF || !trimmedBarcode) {
      return;
    }

    // If we already handled success in the previous effect, don't process errors
    if (existingProduct) {
      return;
    }

    if (offData?.product) {
      // Success case already handled in previous effect
      return;
    }

    if (offError) {
      // Query failed with an error
      const errorMessage =
        offError instanceof Error
          ? offError.message
          : "Failed to fetch product from Open Food Facts";
      toast.error(errorMessage);
      setIsLookingUp(false);
      setBarcodeLookup("");
      return;
    }

    // Check if Open Food Facts returned but product not found
    if (offData?.status === 0 || !offData?.product) {
      toast.error("Product not found in Open Food Facts");
      setIsLookingUp(false);
      setBarcodeLookup("");
    }
  }, [
    trimmedBarcode,
    isLookingUp,
    isFetchingOFF,
    offData,
    offError,
    existingProduct,
  ]);

  /**
   * Trigger barcode lookup.
   * @param barcodeOverride - Optional barcode to use instead of state (useful for scanner)
   */
  const handleBarcodeLookup = (barcodeOverride?: string) => {
    const barcode = (barcodeOverride ?? barcodeLookup).trim();
    if (!barcode) {
      toast.error("Please enter a barcode");
      return;
    }
    // If override provided, update state so queries use correct barcode
    if (barcodeOverride) {
      setBarcodeLookup(barcode);
    }
    setIsLookingUp(true);
  };

  return {
    barcodeLookup,
    setBarcodeLookup,
    isLookingUp,
    handleBarcodeLookup,
  };
}
