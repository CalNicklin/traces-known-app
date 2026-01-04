"use client";

import { useQuery, useSuspenseQuery } from "@tanstack/react-query";

import { Card, CardContent } from "@acme/ui";

import { useTRPC } from "~/trpc/react";
import type { AddProductFormResult } from "../add-product-form";
import { AddProductForm } from "../add-product-form";
import {
  AllergenSelectionStep,
  DetailsStep,
  ProductSelectionStep,
  ReportTypeStep,
} from "./steps";
import { useReportForm } from "./use-report-form";
import { WizardHeader } from "./wizard-header";

interface ReportFormProps {
  productId?: string;
}

export function ReportForm({ productId }: ReportFormProps) {
  const trpc = useTRPC();

  // Get all allergens for selection
  const { data: allAllergensResponse } = useSuspenseQuery(
    trpc.allergen.all.queryOptions(),
  );

  // Get user's allergens (protected route - will return empty if not logged in)
  const { data: myAllergensResponse } = useQuery(
    trpc.allergen.myAllergens.queryOptions(),
  );

  // Extract allergen data
  const allAllergens = allAllergensResponse.items;
  const allAllergensEmptyMessage = allAllergensResponse.emptyMessage;
  const myAllergens = myAllergensResponse?.items ?? [];
  const myAllergensEmptyMessage = myAllergensResponse?.emptyMessage;

  // Compute allergen lists
  const myAllergenIds = new Set(myAllergens.map((a) => a.id));
  const otherAllergens = allAllergens.filter((a) => !myAllergenIds.has(a.id));
  const hasUserAllergens = myAllergens.length > 0;

  const {
    // Form
    form,
    reportType,
    allergenIds,
    toggleAllergen,
    resetForm,

    // Wizard navigation
    currentStep,
    goBack,
    goToStep,

    // Product selection
    productSearch,
    setProductSearch,
    debouncedSearch,
    selectedProduct,
    showProductResults,
    setShowProductResults,
    searchResults,
    handleProductSelect,
    handleSearchChange,
    handleReportTypeSelect,

    // Barcode lookup
    barcodeLookup,

    // Add product modal
    showAddProductForm,
    setShowAddProductForm,
    addProductInitialData,
    setAddProductInitialData,
    handleAddProduct,
    isAddingProduct,

    // Allergen UI
    showAllAllergens,
    setShowAllAllergens,

    // Submission state
    isSubmitting,
    createdReportId,

    // Query client
    queryClient,
  } = useReportForm({ productId });

  return (
    <>
      <Card className="mx-auto w-full max-w-2xl">
        <WizardHeader currentStep={currentStep} onBack={goBack} />
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void form.handleSubmit();
            }}
            className="space-y-6"
          >
            {currentStep === "product" && (
              <ProductSelectionStep
                productSearch={productSearch}
                setProductSearch={setProductSearch}
                showProductResults={showProductResults}
                setShowProductResults={setShowProductResults}
                debouncedSearch={debouncedSearch}
                searchResults={searchResults}
                selectedProduct={selectedProduct}
                onProductSelect={handleProductSelect}
                onSearchChange={handleSearchChange}
                onAddNewProduct={() => setShowAddProductForm(true)}
                onContinue={() => goToStep("type")}
                barcodeLookup={barcodeLookup.barcodeLookup}
                setBarcodeLookup={barcodeLookup.setBarcodeLookup}
                isBarcodeLookingUp={barcodeLookup.isLookingUp}
                onBarcodeLookup={barcodeLookup.handleBarcodeLookup}
                isSubmitting={isSubmitting}
              />
            )}

            {currentStep === "type" && (
              <ReportTypeStep
                selectedProduct={selectedProduct}
                reportType={reportType}
                onSelect={handleReportTypeSelect}
              />
            )}

            {currentStep === "allergens" && (
              <AllergenSelectionStep
                reportType={reportType}
                allergenIds={allergenIds}
                toggleAllergen={toggleAllergen}
                allAllergens={allAllergens}
                allAllergensEmptyMessage={allAllergensEmptyMessage}
                myAllergens={myAllergens}
                myAllergensEmptyMessage={myAllergensEmptyMessage}
                otherAllergens={otherAllergens}
                hasUserAllergens={hasUserAllergens}
                showAllAllergens={showAllAllergens}
                setShowAllAllergens={setShowAllAllergens}
                onContinue={() => goToStep("details")}
              />
            )}

            {currentStep === "details" && (
              <DetailsStep
                form={form}
                reportType={reportType}
                allergenIds={allergenIds}
                selectedProduct={selectedProduct}
                allAllergens={allAllergens}
                isSubmitting={isSubmitting}
                createdReportId={createdReportId}
                queryClient={queryClient}
                onReset={resetForm}
              />
            )}
          </form>
        </CardContent>
      </Card>

      <AddProductModal
        isOpen={showAddProductForm}
        onClose={() => {
          setShowAddProductForm(false);
          setAddProductInitialData(undefined);
        }}
        onSubmit={handleAddProduct}
        isLoading={isAddingProduct}
        initialData={
          addProductInitialData ?? { name: productSearch, categoryIds: [] }
        }
        onProductFound={(foundProductId) => {
          queryClient
            .fetchQuery(
              trpc.product.byId.queryOptions({ id: foundProductId }),
            )
            .then((product) => {
              if (product) {
                handleProductSelect({
                  id: product.id,
                  name: product.name,
                  brand: product.brand ?? undefined,
                  barcode: product.barcode ?? undefined,
                });
                setShowAddProductForm(false);
              }
            })
            .catch(() => {
              // Error handled by toast in hook
            });
        }}
      />
    </>
  );
}

// Add Product Form Modal
function AddProductModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  initialData,
  onProductFound,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (result: AddProductFormResult) => void;
  isLoading: boolean;
  initialData?: Partial<AddProductFormResult["data"]>;
  onProductFound?: (productId: string) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto">
        <AddProductForm
          initialData={initialData}
          onSubmit={onSubmit}
          onCancel={onClose}
          isLoading={isLoading}
          onProductFound={onProductFound}
        />
      </div>
    </div>
  );
}
