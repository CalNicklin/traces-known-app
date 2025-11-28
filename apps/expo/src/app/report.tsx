"use client";

import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";

import type { RouterInputs } from "~/utils/api";
import { trpc } from "~/utils/api";

const SEVERITY_OPTIONS: RouterInputs["report"]["create"]["severity"][] = [
  "LOW",
  "MODERATE",
  "HIGH",
];

export default function ReportScreen() {
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [severity, setSeverity] =
    useState<RouterInputs["report"]["create"]["severity"]>("LOW");
  const [comment, setComment] = useState("");

  const searchOptions = trpc.product.search.queryOptions({
    query,
    page: 1,
    limit: 10,
  });
  const searchQuery = useQuery({
    ...searchOptions,
    enabled: query.length > 2,
  });

  const mutation = useMutation(
    trpc.report.create.mutationOptions({
      onSuccess: () => {
        Alert.alert("Report submitted", "Thanks for helping the community!");
        setSelectedProduct(null);
        setComment("");
        setQuery("");
      },
      onError: () => {
        Alert.alert("Error", "Unable to submit report right now.");
      },
    }),
  );

  const canSubmit = Boolean(selectedProduct);

  return (
    <SafeAreaView className="bg-background">
      <Stack.Screen options={{ title: "Report Reaction" }} />
      <View className="h-full w-full gap-4 bg-background p-4">
        <Text className="text-lg font-semibold text-foreground">
          Pick a product
        </Text>
        <TextInput
          className="rounded-2xl border border-input bg-card px-4 py-3 text-foreground"
          placeholder="Search product or brand"
          value={query}
          onChangeText={setQuery}
        />

        {selectedProduct ? (
          <View className="rounded-2xl border border-primary/40 bg-primary/10 p-4">
            <Text className="text-sm uppercase text-primary">Selected</Text>
            <Text className="text-lg font-semibold text-foreground">
              {selectedProduct.name}
            </Text>
          </View>
        ) : null}

        {query.length > 2 ? (
          <FlatList
            data={searchQuery.data ?? []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                className="mb-2 rounded-2xl border border-muted bg-card p-3"
                onPress={() => {
                  setSelectedProduct({ id: item.id, name: item.name });
                  setQuery(item.name);
                }}
              >
                <Text className="font-semibold text-foreground">
                  {item.name}
                </Text>
                {item.barcode ? (
                  <Text className="text-xs text-muted-foreground">
                    {item.barcode}
                  </Text>
                ) : null}
              </Pressable>
            )}
          />
        ) : null}

        <Text className="text-lg font-semibold text-foreground">
          Severity
        </Text>
        <View className="flex-row gap-2">
          {SEVERITY_OPTIONS.map((option) => (
            <Pressable
              key={option}
              className={`flex-1 rounded-2xl border p-3 ${severity === option ? "border-primary bg-primary/10" : "border-muted bg-card"}`}
              onPress={() => setSeverity(option)}
            >
              <Text
                className={`text-center text-sm font-semibold ${severity === option ? "text-primary" : "text-foreground"}`}
              >
                {option}
              </Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          className="min-h-[120px] rounded-2xl border border-input bg-card px-4 py-3 text-foreground"
          placeholder="Describe the reaction..."
          multiline
          value={comment}
          onChangeText={setComment}
        />

        <Pressable
          className={`rounded-2xl p-4 ${canSubmit ? "bg-primary" : "bg-muted"}`}
          disabled={!canSubmit || mutation.isPending}
          onPress={() =>
            selectedProduct &&
            mutation.mutate({
              productId: selectedProduct.id,
              severity,
              comment,
            })
          }
        >
          <Text className="text-center text-lg font-semibold text-white">
            {mutation.isPending ? "Submitting..." : "Submit report"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

