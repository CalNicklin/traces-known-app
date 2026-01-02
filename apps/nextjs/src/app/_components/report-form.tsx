"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ImageIcon,
} from "@radix-ui/react-icons";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import { z } from "zod/v4";

import { Card, CardContent, CardHeader, CardTitle, Text } from "@acme/ui";
import { Button } from "@acme/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@acme/ui/form";
import { Input } from "@acme/ui/input";
import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";
import type { AddProductFormResult } from "./add-product-form";
import { AddProductForm } from "./add-product-form";
import { ImageUpload } from "./image-upload";
import { useBarcodeLookup } from "./use-barcode-lookup";

// Form schema for report submission
const ReportFormSchema = z.object({
  productSearch: z.string().min(1, "Please search for a product"),
  productId: z.string().uuid("Please select a valid product"),
  allergenIds: z.array(z.string().uuid()).optional(),
  comment: z.string().optional(),
});

type ReportFormData = z.infer<typeof ReportFormSchema>;

interface ProductSearchResult {
  id: string;
  name: string;
  brand?: string | null;
  barcode?: string | null;
}

interface Allergen {
  id: string;
  name: string;
}

interface ReportFormProps {
  productId?: string;
}

export function ReportForm({ productId }: ReportFormProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [productSearch, setProductSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedProduct, setSelectedProduct] =
    useState<ProductSearchResult | null>(null);
  const [showProductResults, setShowProductResults] = useState(false);
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [addProductInitialData, setAddProductInitialData] = useState<
    Partial<AddProductFormResult["data"]> | undefined
  >();
  const [showAllAllergens, setShowAllAllergens] = useState(false);
  const [createdReportId, setCreatedReportId] = useState<string | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [isUploadingProductImage, setIsUploadingProductImage] = useState(false);

  // Debounced search function
  const handleSearchChange = useDebouncedCallback((term: string) => {
    setDebouncedSearch(term);
  }, 300);

  // Barcode lookup hook - handles product lookup from ReportForm
  const {
    barcodeLookup,
    setBarcodeLookup,
    isLookingUp: isBarcodeLookingUp,
    handleBarcodeLookup,
  } = useBarcodeLookup({
    onProductFound: (productId) => {
      // Product found in DB - select it
      handleProductFound(productId);
    },
    onOpenFoodFactsData: (mappedData) => {
      // Product found in Open Food Facts but not in DB
      // Open AddProductForm modal with pre-filled data
      setAddProductInitialData(mappedData);
      setShowAddProductForm(true);
    },
  });

  // Get all allergens for selection
  const { data: allAllergensResponse } = useSuspenseQuery(
    trpc.allergen.all.queryOptions(),
  );

  // Get user's allergens (protected route - will return empty if not logged in)
  const { data: myAllergensResponse } = useQuery(
    trpc.allergen.myAllergens.queryOptions(),
  );

  // Fetch pre-selected product if productId is provided
  const { data: preSelectedProduct } = useQuery({
    ...trpc.product.byId.queryOptions({ id: productId ?? "" }),
    enabled: Boolean(productId),
  });

  // Search products based on debounced input
  const { data: searchResults = [] } = useQuery({
    ...trpc.product.byName.queryOptions({ name: debouncedSearch }),
    enabled: debouncedSearch.length > 2,
  });

  // Extract allergen data and messages from responses
  const allAllergens = allAllergensResponse.items;
  const allAllergensEmptyMessage = allAllergensResponse.emptyMessage;
  const myAllergens = myAllergensResponse?.items ?? [];
  const myAllergensEmptyMessage = myAllergensResponse?.emptyMessage;

  // Compute allergen lists: user's allergens first, then others
  const myAllergenIds = new Set(myAllergens.map((a) => a.id));
  const otherAllergens = allAllergens.filter((a) => !myAllergenIds.has(a.id));
  const hasUserAllergens = myAllergens.length > 0;

  // Handle pre-selected product from URL param
  useEffect(() => {
    if (preSelectedProduct && !selectedProduct) {
      setSelectedProduct(preSelectedProduct);
    }
  }, [preSelectedProduct, selectedProduct]);

  const form = useForm<ReportFormData>({
    resolver: zodResolver(ReportFormSchema),
    defaultValues: {
      productSearch: "",
      productId: "",
      allergenIds: [],
      comment: "",
    },
  });

  const createProduct = useMutation(trpc.product.create.mutationOptions());

  const requestImageUpload = useMutation(
    trpc.image.requestUploadUrl.mutationOptions(),
  );

  const confirmImageUpload = useMutation(
    trpc.image.confirmUpload.mutationOptions(),
  );

  // Upload product image after product creation
  const uploadProductImage = async (productId: string, file: File) => {
    try {
      setIsUploadingProductImage(true);

      // 1. Get presigned URL
      const { uploadUrl, tempPath } = await requestImageUpload.mutateAsync({
        filename: file.name,
      });

      // 2. Upload to Supabase Storage
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      // 3. Confirm and process
      await confirmImageUpload.mutateAsync({
        tempPath,
        entityType: "product",
        entityId: productId,
      });

      toast.success("Product image uploaded!");
    } catch {
      toast.error("Failed to upload product image");
    } finally {
      setIsUploadingProductImage(false);
      setPendingImageFile(null);
    }
  };

  const createReport = useMutation(
    trpc.report.create.mutationOptions({
      onSuccess: (result) => {
        toast.success("Report submitted! You can now add photos.");
        // Try to extract report ID from result for image uploads
        if (result && typeof result === "object" && "id" in result) {
          const reportId = (result as { id: string }).id;
          setCreatedReportId(reportId);
        } else {
          form.reset();
          setSelectedProduct(null);
          setProductSearch("");
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

  const handleProductSelect = (product: ProductSearchResult) => {
    setSelectedProduct(product);
    setProductSearch(
      `${product.name} ${product.brand ? `- ${product.brand}` : ""}`,
    );
    form.setValue("productId", product.id);
    form.setValue("productSearch", productSearch);
    setShowProductResults(false);
  };

  const handleProductFound = (productId: string) => {
    // Product was found in DB during barcode lookup
    // Use query client to fetch the product
    queryClient
      .fetchQuery(trpc.product.byId.queryOptions({ id: productId }))
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

  const onSubmit = (data: ReportFormData) => {
    createReport.mutate({
      productId: data.productId,
      allergenIds: data.allergenIds,
      comment: data.comment,
    });
  };

  const handleAddProduct = async (result: AddProductFormResult) => {
    try {
      // Store the image file for later upload
      setPendingImageFile(result.imageFile);

      // Create the product
      const newProduct = await createProduct.mutateAsync(result.data);

      if (newProduct) {
        toast.success("Product added successfully!");

        // Select the new product
        handleProductSelect({
          id: newProduct.id,
          name: newProduct.name,
          brand: newProduct.brand ?? undefined,
          barcode: newProduct.barcode ?? undefined,
        });

        // Upload image if provided
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

  return (
    <>
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Report Allergy Reaction</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    disabled={isBarcodeLookingUp || createReport.isPending}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleBarcodeLookup();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleBarcodeLookup}
                    disabled={
                      isBarcodeLookingUp ||
                      createReport.isPending ||
                      !barcodeLookup.trim()
                    }
                  >
                    {isBarcodeLookingUp ? "Looking up..." : "Lookup"}
                  </Button>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Search Open Food Facts database to automatically find or add
                  product information
                </p>
              </div>

              {/* Product Search */}
              <FormField
                control={form.control}
                name="productSearch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          placeholder="Search for a product..."
                          value={productSearch}
                          onChange={(e) => {
                            const value = e.target.value;
                            setProductSearch(value);
                            setShowProductResults(value.length > 2);
                            field.onChange(value);
                            handleSearchChange(value);
                          }}
                          onFocus={() =>
                            setShowProductResults(productSearch.length > 2)
                          }
                        />

                        {showProductResults && debouncedSearch.length > 2 && (
                          <div className="absolute top-full z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-background shadow-lg">
                            {searchResults.length > 0 ? (
                              searchResults.map((product) => (
                                <button
                                  key={product.id}
                                  type="button"
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                                  onClick={() => handleProductSelect(product)}
                                >
                                  <div>
                                    <Text variant="small">{product.name}</Text>
                                    {product.brand && (
                                      <Text variant="caption">
                                        {product.brand}
                                      </Text>
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
                                    setShowAddProductForm(true);
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
                    </FormControl>
                    <FormDescription>
                      Search by product name, brand, or barcode
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Selected Product Display */}
              {selectedProduct && (
                <div className="rounded-lg border bg-muted/50 p-3">
                  <Text variant="small">Selected Product:</Text>
                  <Text variant="muted">
                    {selectedProduct.name}
                    {selectedProduct.brand && ` - ${selectedProduct.brand}`}
                  </Text>
                </div>
              )}

              {/* Allergen Selection */}
              <FormField
                control={form.control}
                name="allergenIds"
                render={({ field }) => {
                  const renderAllergenCheckbox = (allergen: Allergen) => (
                    <label
                      key={allergen.id}
                      className="flex cursor-pointer items-center space-x-2 rounded-md border p-2 hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        checked={field.value?.includes(allergen.id) ?? false}
                        onChange={(e) => {
                          const current = field.value ?? [];
                          if (e.target.checked) {
                            field.onChange([...current, allergen.id]);
                          } else {
                            field.onChange(
                              current.filter((id) => id !== allergen.id),
                            );
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <Text variant="muted">{allergen.name}</Text>
                    </label>
                  );

                  // Handle empty states
                  if (allAllergensEmptyMessage) {
                    return (
                      <FormItem>
                        <FormLabel>Allergens You Reacted To</FormLabel>
                        <div className="rounded-lg border border-dashed p-4 text-center">
                          <Text variant="muted">
                            {allAllergensEmptyMessage}
                          </Text>
                        </div>
                      </FormItem>
                    );
                  }

                  return (
                    <FormItem>
                      <FormLabel>Allergens You Reacted To</FormLabel>
                      <FormDescription>
                        Select all allergens that caused a reaction
                      </FormDescription>
                      <FormControl>
                        <div className="space-y-4">
                          {/* User's allergens (shown first if they have any) */}
                          {hasUserAllergens ? (
                            <div className="space-y-2">
                              <Text variant="muted" className="font-medium">
                                Your Allergens
                              </Text>
                              <div className="grid grid-cols-2 gap-2">
                                {myAllergens.map(renderAllergenCheckbox)}
                              </div>
                            </div>
                          ) : myAllergensEmptyMessage ? (
                            <div className="rounded-lg border border-dashed bg-muted/50 p-3 text-center">
                              <Text variant="muted">
                                {myAllergensEmptyMessage}
                              </Text>
                            </div>
                          ) : null}

                          {/* Show all / Other allergens */}
                          {hasUserAllergens ? (
                            <div className="space-y-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setShowAllAllergens(!showAllAllergens)
                                }
                                className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
                              >
                                {showAllAllergens ? (
                                  <>
                                    <ChevronUpIcon className="size-4" />
                                    Hide other allergens
                                  </>
                                ) : (
                                  <>
                                    <ChevronDownIcon className="size-4" />
                                    Show all allergens
                                  </>
                                )}
                              </button>
                              {showAllAllergens && (
                                <div className="grid grid-cols-2 gap-2">
                                  {otherAllergens.map(renderAllergenCheckbox)}
                                </div>
                              )}
                            </div>
                          ) : (
                            /* No user allergens - show all */
                            <div className="grid grid-cols-2 gap-2">
                              {allAllergens.map(renderAllergenCheckbox)}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              {/* Comment */}
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Comments</FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        placeholder="Describe your reaction, symptoms, or any other relevant information..."
                        className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </FormControl>
                    <FormDescription>
                      Help others by sharing details about your experience
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Image Upload Section */}
              {createdReportId ? (
                <div className="space-y-2">
                  <span className="text-sm font-medium leading-none">
                    Add Photos
                  </span>
                  <ImageUpload
                    entityType="report"
                    entityId={createdReportId}
                    maxImages={5}
                    onImagesChange={(images) => {
                      const allComplete = images.every(
                        (img) => img.status === "complete",
                      );
                      if (allComplete && images.length > 0) {
                        // All images uploaded, invalidate queries
                        void queryClient.invalidateQueries({
                          queryKey: ["image"],
                        });
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4 w-full"
                    onClick={() => {
                      setCreatedReportId(null);
                      form.reset();
                      setSelectedProduct(null);
                      setProductSearch("");
                      toast.success("Report complete!");
                    }}
                  >
                    Done Adding Images
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ImageIcon className="h-5 w-5" />
                    <Text variant="muted">
                      You can add photos after submitting your report
                    </Text>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={createReport.isPending || Boolean(createdReportId)}
              >
                {createReport.isPending ? "Submitting..." : "Submit Report"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <AddProductModal
        isOpen={showAddProductForm}
        onClose={() => {
          setShowAddProductForm(false);
          setAddProductInitialData(undefined);
        }}
        onSubmit={handleAddProduct}
        isLoading={createProduct.isPending || isUploadingProductImage}
        initialData={addProductInitialData ?? { name: productSearch, categoryIds: [] }}
        onProductFound={handleProductFound}
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
