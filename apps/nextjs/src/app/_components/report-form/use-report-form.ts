"use client";

import { useEffect, useState } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDebouncedCallback } from "use-debounce";

import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";
import type { AddProductFormResult } from "../add-product-form";
import { useBarcodeLookup } from "../use-barcode-lookup";
import type { ProductSearchResult, WizardStep } from "./types";

interface UseReportFormOptions {
  productId?: string;
}

export function useReportForm({ productId }: UseReportFormOptions) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Wizard step state
  const [currentStep, setCurrentStep] = useState<WizardStep>("product");

  // Product selection state
  const [productSearch, setProductSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedProduct, setSelectedProduct] =
    useState<ProductSearchResult | null>(null);
  const [showProductResults, setShowProductResults] = useState(false);

  // Add product modal state
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [addProductInitialData, setAddProductInitialData] = useState<
    Partial<AddProductFormResult["data"]> | undefined
  >();

  // Allergen UI state
  const [showAllAllergens, setShowAllAllergens] = useState(false);

  // Post-submission state
  const [createdReportId, setCreatedReportId] = useState<string | null>(null);
  const [isUploadingProductImage, setIsUploadingProductImage] = useState(false);

  // Debounced search
  const handleSearchChange = useDebouncedCallback((term: string) => {
    setDebouncedSearch(term);
  }, 300);

  // Mutations
  const createProduct = useMutation(trpc.product.create.mutationOptions());
  const requestImageUpload = useMutation(
    trpc.image.requestUploadUrl.mutationOptions(),
  );
  const confirmImageUpload = useMutation(
    trpc.image.confirmUpload.mutationOptions(),
  );

  const createReport = useMutation(
    trpc.report.create.mutationOptions({
      onSuccess: (result) => {
        toast.success("Report submitted! You can now add photos.");
        if (result && typeof result === "object" && "id" in result) {
          setCreatedReportId((result as { id: string }).id);
        } else {
          resetForm();
        }
        setShowAddProductForm(false);
      },
      onError: (err) => {
        toast.error(
          err.data?.code === "UNAUTHORIZED"
            ? "You must be logged in to submit a report"
            : "Failed to submit report",
        );
      },
    }),
  );

  // TanStack Form setup
  const form = useForm({
    defaultValues: {
      productSearch: "",
      productId: "",
      reportType: "" as "safe" | "reaction" | "",
      allergenIds: [] as string[],
      comment: "",
    },
    onSubmit: async ({ value }) => {
      if (!value.reportType || value.reportType === "") {
        toast.error("Please select a report type");
        return;
      }
      createReport.mutate({
        productId: value.productId,
        reportType: value.reportType,
        allergenIds: value.allergenIds,
        comment: value.comment,
      });
    },
  });

  // Watch values using useStore
  const reportType = useStore(
    form.store,
    (state) => state.values.reportType,
  ) as "safe" | "reaction" | "";
  const allergenIds = useStore(form.store, (state) => state.values.allergenIds);

  // Queries
  const { data: preSelectedProduct } = useQuery({
    ...trpc.product.byId.queryOptions({ id: productId ?? "" }),
    enabled: Boolean(productId),
  });

  const { data: searchResults = [] } = useQuery({
    ...trpc.product.byName.queryOptions({ name: debouncedSearch }),
    enabled: debouncedSearch.length > 2,
  });

  // Handle pre-selected product from URL param
  useEffect(() => {
    if (preSelectedProduct && !selectedProduct) {
      const displayName = `${preSelectedProduct.name}${preSelectedProduct.brand ? ` - ${preSelectedProduct.brand}` : ""}`;
      setSelectedProduct(preSelectedProduct);
      setProductSearch(displayName);
      form.setFieldValue("productId", preSelectedProduct.id);
      form.setFieldValue("productSearch", displayName);
      setCurrentStep("type");
    }
  }, [preSelectedProduct, selectedProduct, form]);

  // Handlers
  const resetForm = () => {
    form.reset();
    setSelectedProduct(null);
    setProductSearch("");
    setCurrentStep("product");
    setCreatedReportId(null);
  };

  const handleProductSelect = (product: ProductSearchResult) => {
    const displayName = `${product.name}${product.brand ? ` - ${product.brand}` : ""}`;
    setSelectedProduct(product);
    setProductSearch(displayName);
    form.setFieldValue("productId", product.id);
    form.setFieldValue("productSearch", displayName);
    setShowProductResults(false);
    setCurrentStep("type");
  };

  const handleProductFound = (foundProductId: string) => {
    queryClient
      .fetchQuery(trpc.product.byId.queryOptions({ id: foundProductId }))
      .then((product) => {
        if (product) {
          handleProductSelect({
            id: product.id,
            name: product.name,
            brand: product.brand ?? undefined,
            barcode: product.barcode ?? undefined,
          });
          setShowAddProductForm(false);
          toast.success("Product found and selected");
        }
      })
      .catch(() => {
        toast.error("Failed to load product");
      });
  };

  const handleReportTypeSelect = (type: "safe" | "reaction") => {
    form.setFieldValue("reportType", type);
    setCurrentStep("allergens");
  };

  const uploadProductImage = async (uploadProductId: string, file: File) => {
    try {
      setIsUploadingProductImage(true);
      const { uploadUrl, tempPath } = await requestImageUpload.mutateAsync({
        filename: file.name,
      });

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      await confirmImageUpload.mutateAsync({
        tempPath,
        entityType: "product",
        entityId: uploadProductId,
      });

      toast.success("Product image uploaded!");
    } catch {
      toast.error("Failed to upload product image");
    } finally {
      setIsUploadingProductImage(false);
    }
  };

  const handleAddProduct = async (result: AddProductFormResult) => {
    try {
      const newProduct = await createProduct.mutateAsync(result.data);

      if (newProduct) {
        toast.success("Product added successfully!");
        handleProductSelect({
          id: newProduct.id,
          name: newProduct.name,
          brand: newProduct.brand ?? undefined,
          barcode: newProduct.barcode ?? undefined,
        });

        if (result.imageFile) {
          await uploadProductImage(newProduct.id, result.imageFile);
        }

        setShowAddProductForm(false);
        setAddProductInitialData(undefined);
      }
    } catch (err) {
      toast.error(
        "Failed to add product: " +
          ((err as Error).message || "Unknown error"),
      );
    }
  };

  const goBack = () => {
    const stepOrder: WizardStep[] = ["product", "type", "allergens", "details"];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]!);
    }
  };

  const goToStep = (step: WizardStep) => {
    setCurrentStep(step);
  };

  const goToSuccess = () => {
    setCurrentStep("success");
  };

  // Allergen toggle handler
  const toggleAllergen = (allergenId: string) => {
    const current = allergenIds ?? [];
    if (current.includes(allergenId)) {
      form.setFieldValue(
        "allergenIds",
        current.filter((id) => id !== allergenId),
      );
    } else {
      form.setFieldValue("allergenIds", [...current, allergenId]);
    }
  };

  // Barcode lookup
  const barcodeLookup = useBarcodeLookup({
    onProductFound: handleProductFound,
    onOpenFoodFactsData: (mappedData) => {
      setAddProductInitialData(mappedData);
      setShowAddProductForm(true);
    },
  });

  return {
    // Form
    form,
    reportType: reportType === "" ? undefined : reportType,
    allergenIds,
    toggleAllergen,
    resetForm,

    // Wizard navigation
    currentStep,
    goBack,
    goToStep,
    goToSuccess,

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
    isAddingProduct: createProduct.isPending || isUploadingProductImage,

    // Allergen UI
    showAllAllergens,
    setShowAllAllergens,

    // Submission state
    isSubmitting: createReport.isPending,
    createdReportId,

    // Query client for image invalidation
    queryClient,
  };
}
