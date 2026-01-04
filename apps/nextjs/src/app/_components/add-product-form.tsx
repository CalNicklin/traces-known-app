"use client";

import type { z } from "zod/v4";
import { useState } from "react";
import { CheckIcon } from "@radix-ui/react-icons";
import { useForm, useStore } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";

import { ProductFormSchema } from "@acme/db/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@acme/ui";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";

import { useTRPC } from "~/trpc/react";
import { ImageUpload } from "./image-upload";
import { useBarcodeLookup } from "./use-barcode-lookup";

type ProductFormData = z.infer<typeof ProductFormSchema>;

export interface AddProductFormResult {
  data: ProductFormData;
  imageFile: File | null;
}

interface AddProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (result: AddProductFormResult) => void;
  onCancel: () => void;
  isLoading?: boolean;
  onProductFound?: (productId: string) => void;
}

export function AddProductForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  onProductFound,
}: AddProductFormProps) {
  const trpc = useTRPC();
  const [stagedImageFile, setStagedImageFile] = useState<File | null>(null);

  // Fetch categories for selection
  const { data: categories = [] } = useQuery(trpc.category.all.queryOptions());

  const form = useForm({
    defaultValues: {
      name: initialData?.name ?? "",
      brand: initialData?.brand ?? "",
      barcode: initialData?.barcode ?? "",
      allergenWarning: initialData?.allergenWarning ?? "",
      imageUrl: initialData?.imageUrl ?? "",
      ingredients: initialData?.ingredients ?? ([] as string[]),
      categoryIds: initialData?.categoryIds ?? ([] as string[]),
    },
    onSubmit: async ({ value }) => {
      // Clean up empty string values
      const barcode = value.barcode?.trim() ?? "";
      const brand = value.brand?.trim() ?? "";
      const imageUrl = value.imageUrl?.trim() ?? "";
      const ingredients = (value.ingredients ?? [])
        .map((ingredient) => ingredient.trim())
        .filter((ingredient) => ingredient.length > 0);

      const cleanedData: ProductFormData = {
        ...value,
        barcode: barcode === "" ? undefined : barcode,
        brand: brand === "" ? undefined : brand,
        imageUrl: imageUrl === "" ? undefined : imageUrl,
        ingredients: ingredients.length > 0 ? ingredients : undefined,
      };

      onSubmit({
        data: cleanedData,
        imageFile: stagedImageFile,
      });
    },
  });

  // Use barcode lookup hook
  const { barcodeLookup, setBarcodeLookup, isLookingUp, handleBarcodeLookup } =
    useBarcodeLookup({
      onProductFound,
      onOpenFoodFactsData: (mappedData) => {
        // Pre-populate form with Open Food Facts data
        if (mappedData.name) form.setFieldValue("name", mappedData.name);
        if (mappedData.brand) form.setFieldValue("brand", mappedData.brand);
        if (mappedData.barcode)
          form.setFieldValue("barcode", mappedData.barcode);
        if (mappedData.allergenWarning)
          form.setFieldValue("allergenWarning", mappedData.allergenWarning);
        if (mappedData.imageUrl)
          form.setFieldValue("imageUrl", mappedData.imageUrl);
        if (mappedData.ingredients)
          form.setFieldValue("ingredients", mappedData.ingredients);
      },
    });

  const handleFilesSelect = (files: File[]) => {
    setStagedImageFile(files[0] ?? null);
  };

  const selectedCategoryIds = useStore(
    form.store,
    (state) => state.values.categoryIds,
  );

  const toggleCategory = (categoryId: string) => {
    const currentIds = selectedCategoryIds ?? [];
    if (currentIds.includes(categoryId)) {
      form.setFieldValue(
        "categoryIds",
        currentIds.filter((id) => id !== categoryId),
      );
    } else {
      form.setFieldValue("categoryIds", [...currentIds, categoryId]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Product</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
          className="space-y-4"
        >
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
                disabled={isLookingUp || isLoading}
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
                disabled={isLookingUp || isLoading || !barcodeLookup.trim()}
              >
                {isLookingUp ? "Looking up..." : "Lookup"}
              </Button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Search Open Food Facts database to automatically fill product
              information
            </p>
          </div>

          {/* Product Name */}
          <form.Field
            name="name"
            validators={{
              onChange: ({ value }) => {
                if (!value || value.trim() === "") {
                  return "Product name is required";
                }
                return undefined;
              },
            }}
          >
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Product Name *</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g., Organic Almond Milk"
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && (
                    <FieldError errors={field.state.meta.errors as string[]} />
                  )}
                </Field>
              );
            }}
          </form.Field>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Brand */}
            <form.Field name="brand">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Brand</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g., Trader Joe's"
                  />
                </Field>
              )}
            </form.Field>

            {/* Barcode */}
            <form.Field name="barcode">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Barcode</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g., 1234567890123"
                  />
                </Field>
              )}
            </form.Field>
          </div>

          {/* Category Selection */}
          <form.Field
            name="categoryIds"
            validators={{
              onChange: ({ value }) => {
                if (!value || value.length === 0) {
                  return "Please select at least one category";
                }
                return undefined;
              },
            }}
          >
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel>Categories *</FieldLabel>
                  <FieldDescription>
                    Select all categories that apply to this product
                  </FieldDescription>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {categories.map((category) => {
                      const isSelected = selectedCategoryIds.includes(
                        category.id,
                      );
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => toggleCategory(category.id)}
                          className={cn(
                            "flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors",
                            isSelected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-input hover:bg-accent hover:text-accent-foreground",
                          )}
                        >
                          <span>{category.name}</span>
                          {isSelected && <CheckIcon className="h-4 w-4" />}
                        </button>
                      );
                    })}
                  </div>
                  {isInvalid && (
                    <FieldError errors={field.state.meta.errors as string[]} />
                  )}
                </Field>
              );
            }}
          </form.Field>

          {/* Allergen Warning */}
          <form.Field
            name="allergenWarning"
            validators={{
              onChange: ({ value }) => {
                if (!value || value.trim() === "") {
                  return "Allergen warning is required";
                }
                return undefined;
              },
            }}
          >
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    Package Allergen Warning *
                  </FieldLabel>
                  <textarea
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g., Contains milk. May contain traces of nuts."
                    className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-invalid={isInvalid}
                  />
                  <FieldDescription>
                    Copy the allergen statement from the product packaging
                    exactly as it appears. This is required to help users with
                    allergies.
                  </FieldDescription>
                  {isInvalid && (
                    <FieldError errors={field.state.meta.errors as string[]} />
                  )}
                </Field>
              );
            }}
          </form.Field>

          {/* Ingredients */}
          <form.Field name="ingredients">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Ingredients</FieldLabel>
                <textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value?.join(", ") ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.trim() === "") {
                      field.handleChange([]);
                    } else {
                      const ingredients = value
                        .split(/[,\n]/)
                        .map((i) => i.trim())
                        .filter((i) => i.length > 0);
                      field.handleChange(ingredients);
                    }
                  }}
                  placeholder="e.g., Water, Almonds, Salt, Vitamin E"
                  className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <FieldDescription>
                  Enter ingredients separated by commas or new lines
                </FieldDescription>
              </Field>
            )}
          </form.Field>

          {/* Product Image Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Product Image
            </label>
            <ImageUpload
              entityType="product"
              maxImages={1}
              onFilesSelect={handleFilesSelect}
              disabled={isLoading}
            />
            <p className="text-[0.8rem] text-muted-foreground">
              Optional: Upload a photo of the product packaging
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  disabled={isLoading || !canSubmit || isSubmitting}
                >
                  {isLoading || isSubmitting ? "Adding..." : "Add Product"}
                </Button>
              )}
            </form.Subscribe>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
