"use client";

import type { z } from "zod/v4";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { ProductFormSchema } from "@acme/db/schema";
import { Card, CardContent, CardHeader, CardTitle, cn } from "@acme/ui";
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
  const { data: categories = [] } = useQuery(
    trpc.category.all.queryOptions(),
  );

  const form = useForm<ProductFormData>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      brand: initialData?.brand ?? "",
      barcode: initialData?.barcode ?? "",
      allergenWarning: initialData?.allergenWarning ?? "",
      imageUrl: initialData?.imageUrl ?? "",
      ingredients: initialData?.ingredients ?? [],
      categoryIds: initialData?.categoryIds ?? [],
      ...initialData,
    },
  });

  // Use barcode lookup hook
  const { barcodeLookup, setBarcodeLookup, isLookingUp, handleBarcodeLookup } =
    useBarcodeLookup({
      onProductFound,
      onOpenFoodFactsData: (mappedData) => {
        // Pre-populate form with Open Food Facts data
        const currentValues = form.getValues();
        form.reset({
          ...currentValues,
          ...mappedData,
          // Keep the categoryIds from the form, not from API
          categoryIds: currentValues.categoryIds,
        } as ProductFormData);
      },
    });

  const handleFilesSelect = (files: File[]) => {
    // For products, we only use the first file
    setStagedImageFile(files[0] ?? null);
  };

  const handleSubmit = (data: ProductFormData) => {
    // Clean up empty string values
    const barcode = data.barcode?.trim() ?? "";
    const brand = data.brand?.trim() ?? "";
    const imageUrl = data.imageUrl?.trim() ?? "";
    const ingredients = (data.ingredients ?? [])
      .map((ingredient) => ingredient.trim())
      .filter((ingredient) => ingredient.length > 0);

    const cleanedData: ProductFormData = {
      ...data,
      barcode: barcode === "" ? undefined : barcode,
      brand: brand === "" ? undefined : brand,
      imageUrl: imageUrl === "" ? undefined : imageUrl,
      ingredients: ingredients.length > 0 ? ingredients : undefined,
    };
    
    onSubmit({
      data: cleanedData,
      imageFile: stagedImageFile,
    });
  };

  const toggleCategory = (categoryId: string) => {
    const currentIds = form.getValues("categoryIds") ?? [];
    if (currentIds.includes(categoryId)) {
      form.setValue(
        "categoryIds",
        currentIds.filter((id) => id !== categoryId),
        { shouldValidate: true },
      );
    } else {
      form.setValue("categoryIds", [...currentIds, categoryId], {
        shouldValidate: true,
      });
    }
  };

  const selectedCategoryIds = form.watch("categoryIds") ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Product</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
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

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Organic Almond Milk" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Trader Joe's" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., 1234567890123" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Category Selection */}
            <FormField
              control={form.control}
              name="categoryIds"
              render={() => (
                <FormItem>
                  <FormLabel>Categories *</FormLabel>
                  <FormDescription>
                    Select all categories that apply to this product
                  </FormDescription>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allergenWarning"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Package Allergen Warning *</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      placeholder="e.g., Contains milk. May contain traces of nuts."
                      className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </FormControl>
                  <FormDescription>
                    Copy the allergen statement from the product packaging
                    exactly as it appears. This is required to help users with
                    allergies.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ingredients"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ingredients</FormLabel>
                  <FormControl>
                    <textarea
                      value={field.value?.join(", ") ?? ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.trim() === "") {
                          field.onChange([]);
                        } else {
                          const ingredients = value
                            .split(/[,\n]/)
                            .map((i) => i.trim())
                            .filter((i) => i.length > 0);
                          field.onChange(ingredients);
                        }
                      }}
                      placeholder="e.g., Water, Almonds, Salt, Vitamin E"
                      className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </FormControl>
                  <FormDescription>
                    Enter ingredients separated by commas or new lines
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Product"}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
