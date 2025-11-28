import React from "react";
import {
  Pressable,
  Text,
  View,
  FlatList,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "~/utils/api";
import { authClient } from "~/utils/auth";

export default function Index() {
  const { data: session } = authClient.useSession();
  const { data: reports, refetch, isFetching } = useQuery(
    trpc.report.latest.queryOptions({ limit: 5 }),
  );

  return (
    <SafeAreaView className="bg-background">
      <Stack.Screen options={{ title: "Traces Known" }} />
      <View className="h-full w-full gap-6 bg-background p-4">
        <View className="space-y-2">
          <Text className="text-sm uppercase text-muted-foreground">
            Allergy agent
          </Text>
          <Text className="text-4xl font-bold text-foreground">
            Hey {session?.user.name ?? "friend"} 👋
          </Text>
          <Text className="text-sm text-muted-foreground">
            Search products, log your reactions, and review the community feed.
          </Text>
        </View>

        <View className="flex-row gap-3">
          <Link href="/lookup" asChild>
            <Pressable className="flex-1 rounded-2xl bg-primary p-4">
              <Text className="text-sm font-medium uppercase text-white/80">
                Lookup
              </Text>
              <Text className="text-xl font-semibold text-white">
                Is this safe?
              </Text>
            </Pressable>
          </Link>

          <Link href="/report" asChild>
            <Pressable className="flex-1 rounded-2xl bg-destructive p-4">
              <Text className="text-sm font-medium uppercase text-white/80">
                Report
              </Text>
              <Text className="text-xl font-semibold text-white">
                Log reaction
              </Text>
            </Pressable>
          </Link>
        </View>

        <View className="flex-1">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-foreground">
              Recent alerts
            </Text>
            <Link href="/lookup" asChild>
              <Pressable>
                <Text className="text-sm font-medium text-primary">
                  View all
                </Text>
              </Pressable>
            </Link>
          </View>

          <FlatList
            data={reports ?? []}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={isFetching} onRefresh={refetch} />
            }
            ListEmptyComponent={
              <View className="rounded-2xl border border-dashed border-muted p-4">
                <Text className="text-sm text-muted-foreground">
                  No reports yet. Log the first reaction from the Report tab.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <Link
                href={{
                  pathname: "/product/[id]",
                  params: { id: item.productId },
                }}
                asChild
              >
                <Pressable className="mb-3 rounded-2xl border border-muted bg-card p-4">
                  <Text className="text-base font-semibold text-foreground">
                    {item.product?.name ?? "Unknown product"}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    Severity: {item.severity}
                  </Text>
                  {item.comment ? (
                    <Text className="mt-2 text-sm text-muted-foreground">
                      “{item.comment}”
                    </Text>
                  ) : null}
                </Pressable>
              </Link>
            )}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
