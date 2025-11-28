"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@acme/ui";
import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";

export function AllergenPreferencesPanel() {
  const trpc = useTRPC();

  const { data: allergens } = useSuspenseQuery(
    trpc.allergen.all.queryOptions(),
  );
  const { data: mine } = useSuspenseQuery(
    trpc.allergen.mine.queryOptions(),
  );

  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    setSelected(mine.map((allergen) => allergen.id));
  }, [mine]);

  const mutation = useMutation(
    trpc.allergen.saveMine.mutationOptions({
      onSuccess: () => {
        toast.success("Saved your allergen preferences");
      },
      onError: () => {
        toast.error("Failed to save preferences");
      },
    }),
  );

  const toggleAllergen = (id: string) => {
    setSelected((prev) => {
      const next = prev.includes(id)
        ? prev.filter((value) => value !== id)
        : [...prev, id];
      mutation.mutate({ allergenIds: next });
      return next;
    });
  };

  const activeLabels = useMemo(
    () =>
      allergens
        .filter((allergen) => selected.includes(allergen.id))
        .map((allergen) => allergen.name),
    [allergens, selected],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Allergens</CardTitle>
        <p className="text-sm text-muted-foreground">
          Select the allergens you want the agent to prioritize.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeLabels.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeLabels.map((label) => (
              <Badge key={label} variant="secondary">
                {label}
              </Badge>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {allergens.map((allergen) => {
            const isSelected = selected.includes(allergen.id);
            return (
              <Button
                key={allergen.id}
                type="button"
                variant={isSelected ? "primary" : "outline"}
                className="justify-start"
                onClick={() => toggleAllergen(allergen.id)}
              >
                {allergen.name}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function AllergenPreferencesSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Allergens</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-10" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

