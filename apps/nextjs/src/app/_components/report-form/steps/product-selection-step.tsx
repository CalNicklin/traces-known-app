"use client";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Text,
} from "@acme/ui";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";

import type { ProductSearchResult } from "../types";
import { BarcodeScannerDialog } from "../../barcode-scanner-dialog";

interface ProductSelectionStepProps {
  productSearch: string;
  setProductSearch: (value: string) => void;
  showProductResults: boolean;
  setShowProductResults: (value: boolean) => void;
  debouncedSearch: string;
  searchResults: ProductSearchResult[];
  selectedProduct: ProductSearchResult | null;
  onProductSelect: (product: ProductSearchResult) => void;
  onSearchChange: (term: string) => void;
  onAddNewProduct: () => void;
  onContinue: () => void;
  // Barcode lookup
  barcodeLookup: string;
  setBarcodeLookup: (value: string) => void;
  isBarcodeLookingUp: boolean;
  onBarcodeLookup: (barcodeOverride?: string) => void;
  isSubmitting: boolean;
}

export function ProductSelectionStep({
  productSearch,
  setProductSearch,
  showProductResults,
  setShowProductResults,
  debouncedSearch,
  searchResults,
  selectedProduct,
  onProductSelect,
  onSearchChange,
  onAddNewProduct,
  onContinue,
  barcodeLookup,
  setBarcodeLookup,
  isBarcodeLookingUp,
  onBarcodeLookup,
  isSubmitting,
}: ProductSelectionStepProps) {
  const showError = !selectedProduct && productSearch.length > 0;

  return (
    <>
      {/* Barcode Lookup Section */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <label className="mb-2 block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Lookup Product by Barcode
        </label>
        <div className="flex gap-2">
          <Input
            value={barcodeLookup}
            onChange={(e) => setBarcodeLookup(e.target.value)}
            placeholder="Enter barcode (e.g., 3017624010701)"
            disabled={isBarcodeLookingUp || isSubmitting}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onBarcodeLookup();
              }
            }}
          />
          <Button
            type="button"
            onClick={() => onBarcodeLookup()}
            disabled={
              isBarcodeLookingUp || isSubmitting || !barcodeLookup.trim()
            }
          >
            {isBarcodeLookingUp ? "Looking up..." : "Lookup"}
          </Button>
          <BarcodeScannerDialog
            onDetected={(barcode) => onBarcodeLookup(barcode)}
            disabled={isBarcodeLookingUp || isSubmitting}
          />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Scan or enter a barcode to find products in the Open Food Facts
          database
        </p>
      </div>

      {/* Product Search */}
      <Field data-invalid={showError}>
        <FieldLabel>Product *</FieldLabel>
        <div className="relative">
          <Input
            placeholder="Search for a product..."
            value={productSearch}
            onChange={(e) => {
              const value = e.target.value;
              setProductSearch(value);
              setShowProductResults(value.length > 2);
              onSearchChange(value);
            }}
            onFocus={() => setShowProductResults(productSearch.length > 2)}
          />

          {showProductResults && debouncedSearch.length > 2 && (
            <div className="absolute top-full z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-background shadow-lg">
              {searchResults.length > 0 ? (
                searchResults.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => onProductSelect(product)}
                  >
                    <div>
                      <Text variant="small">{product.name}</Text>
                      {product.brand && (
                        <Text variant="caption">{product.brand}</Text>
                      )}
                      {product.barcode && (
                        <Text variant="caption">
                          Barcode: {product.barcode}
                        </Text>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-3">
                  <Text variant="muted" className="mb-2">
                    No products found for "{debouncedSearch}"
                  </Text>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      onAddNewProduct();
                      setShowProductResults(false);
                    }}
                    className="w-full"
                  >
                    Add "{debouncedSearch}" as new product
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
        <FieldDescription>
          Search by product name, brand, or barcode
        </FieldDescription>
        {showError && (
          <FieldError
            errors={["Please select a product from the search results"]}
          />
        )}
      </Field>

      {/* Selected Product Display */}
      {selectedProduct && (
        <div className="rounded-lg border bg-muted/50 p-3">
          <Text variant="small">Selected Product:</Text>
          <Text variant="muted">
            {selectedProduct.name}
            {selectedProduct.brand && ` - ${selectedProduct.brand}`}
          </Text>
          <Button type="button" className="mt-3 w-full" onClick={onContinue}>
            Continue
          </Button>
        </div>
      )}
    </>
  );
}
