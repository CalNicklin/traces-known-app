import React from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useGlobalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "~/utils/api";

export default function ProductScreen() {
  const { id } = useGlobalSearchParams();

  if (!id || typeof id !== "string") {
    throw new Error("Missing product id");
  }

  const { data: detail } = useQuery(
    trpc.product.detail.queryOptions({ id }),
  );
  const { data: reports } = useQuery(
    trpc.report.byProductId.queryOptions({ productId: id }),
  );

  if (!detail) {
    return null;
  }

  const { product, stats } = detail;

  return (
    <SafeAreaView className="bg-background">
      <Stack.Screen options={{ title: product.name }} />
      <ScrollView className="h-full w-full bg-background p-4">
        <View className="space-y-3 rounded-2xl border border-muted bg-card p-4">
          <Text className="text-2xl font-bold text-foreground">
            {product.name}
          </Text>
          {product.brand ? (
            <Text className="text-sm text-muted-foreground">{product.brand}</Text>
          ) : null}
          <Text className="text-sm text-muted-foreground">
            Barcode: {product.barcode ?? "N/A"}
          </Text>
          <Text className="text-sm text-muted-foreground">
            Risk level: {product.riskLevel ?? "Unknown"}
          </Text>
          {product.allergenWarning ? (
            <Text className="text-sm text-destructive">
              {product.allergenWarning}
            </Text>
          ) : null}
        </View>

        {product.aiSummary ? (
          <View className="mt-4 space-y-2 rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <Text className="text-sm font-semibold text-primary">
              AI Risk Summary ({product.aiSummary.riskLevel})
            </Text>
            <Text className="text-sm text-foreground">
              {product.aiSummary.summary}
            </Text>
          </View>
        ) : null}

        <View className="mt-4 rounded-2xl border border-muted bg-card p-4">
          <Text className="text-lg font-semibold text-foreground">
            Stats
          </Text>
          <Text className="text-sm text-muted-foreground">
            Reports logged: {stats.totalReports}
          </Text>
          <Text className="text-sm text-muted-foreground">
            Last reported:{" "}
            {stats.lastReportedAt
              ? new Date(stats.lastReportedAt).toLocaleDateString()
              : "Never"}
          </Text>
        </View>

        <View className="mt-6 space-y-3">
          <Text className="text-lg font-semibold text-foreground">
            Community reports
          </Text>
          {(reports ?? []).map((report) => (
            <View
              key={report.id}
              className="rounded-2xl border border-muted p-4"
            >
              <Text className="text-xs text-muted-foreground">
                Severity: {report.severity}
              </Text>
              {report.comment ? (
                <Text className="text-sm text-foreground">
                  {report.comment}
                </Text>
              ) : null}
              {report.allergenIds && report.allergenIds.length > 0 ? (
                <Text className="text-xs text-destructive">
                  Allergens flagged: {report.allergenIds.length}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

