"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";

import { ProductFormSchema } from "@acme/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui";
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

type ProductFormData = z.infer<typeof ProductFormSchema>;

interface AddProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AddProductForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: AddProductFormProps) {
  const form = useForm<ProductFormData>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      brand: initialData?.brand ?? "",
      barcode: initialData?.barcode ?? "",
      allergenWarning: initialData?.allergenWarning ?? "",
      riskLevel: initialData?.riskLevel ?? undefined,
      imageUrl: initialData?.imageUrl ?? "",
      ingredients: initialData?.ingredients ?? [],
      ...initialData,
    },
  });

  const handleSubmit = (data: ProductFormData) => {
    // Clean up empty string values
    const cleanedData = {
      ...data,
      barcode: data.barcode || undefined,
      brand: data.brand || undefined,
      allergenWarning: data.allergenWarning || undefined,
      imageUrl: data.imageUrl || undefined,
      ingredients: data.ingredients?.filter(Boolean) || undefined,
    };
    onSubmit(cleanedData);
  };

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

            <FormField
              control={form.control}
              name="riskLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allergy Risk Level</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Select risk level...</option>
                      <option value="LOW">Low Risk</option>
                      <option value="MEDIUM">Medium Risk</option>
                      <option value="HIGH">High Risk</option>
                    </select>
                  </FormControl>
                  <FormDescription>
                    Based on allergen content and cross-contamination risk
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allergenWarning"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allergen Warning</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      placeholder="e.g., Contains milk. May contain nuts."
                      className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Image URL</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="url"
                      placeholder="https://example.com/image.jpg"
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Link to a product image
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
