import React, { useState } from "react";
import {
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "~/utils/api";

export default function LookupScreen() {
  const [query, setQuery] = useState("");
  const searchOptions = trpc.product.search.queryOptions({
    query,
    page: 1,
    limit: 25,
  });
  const searchQuery = useQuery({
    ...searchOptions,
    enabled: query.length > 2,
  });

  return (
    <SafeAreaView className="bg-background">
      <Stack.Screen options={{ title: "Lookup" }} />
      <View className="h-full w-full gap-4 bg-background p-4">
        <Text className="text-2xl font-semibold text-foreground">
          Search products
        </Text>
        <TextInput
          className="rounded-2xl border border-input bg-card px-4 py-3 text-foreground"
          placeholder="Type a product or brand"
          value={query}
          onChangeText={setQuery}
        />

        {query.length <= 2 ? (
          <Text className="text-sm text-muted-foreground">
            Enter at least 3 characters to search.
          </Text>
        ) : (
          <FlatList
            data={searchQuery.data ?? []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Link
                href={{
                  pathname: "/product/[id]",
                  params: { id: item.id },
                }}
                asChild
              >
                <Pressable className="mb-3 rounded-2xl border border-muted bg-card p-4">
                  <Text className="text-lg font-semibold text-foreground">
                    {item.name}
                  </Text>
                  {item.barcode ? (
                    <Text className="text-xs text-muted-foreground">
                      Barcode: {item.barcode}
                    </Text>
                  ) : null}
                  <Text className="text-xs text-muted-foreground">
                    {item.inDb ? "Tracked in database" : "New entry"}
                  </Text>
                </Pressable>
              </Link>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

