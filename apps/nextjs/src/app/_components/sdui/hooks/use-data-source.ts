"use client";

import { useCallback, useEffect, useState } from "react";

import type { SduiDataRequirement } from "~/types/sdui";

import { useTRPC } from "~/trpc/react";

// =============================================================================
// Types
// =============================================================================

interface DataSourceState {
  readonly data: unknown;
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly refetch: () => Promise<void>;
}

interface DataCacheEntry {
  readonly data: unknown;
  readonly fetchedAt: number;
  readonly error: Error | null;
}

// =============================================================================
// Global Cache (simple in-memory cache)
// =============================================================================

const dataCache = new Map<string, DataCacheEntry>();

function getCacheKey(requirement: SduiDataRequirement): string {
  return `${requirement.procedure}:${JSON.stringify(requirement.input ?? {})}`;
}

function isCacheValid(entry: DataCacheEntry, staleTime: number): boolean {
  return Date.now() - entry.fetchedAt < staleTime;
}

// =============================================================================
// Hook: useDataSource
// =============================================================================

/**
 * Hook for fetching data based on an SDUI data requirement.
 * Uses tRPC under the hood with caching based on staleTime.
 *
 * @param requirement - The data requirement specifying the tRPC procedure and input
 * @returns Object with data, loading state, error, and refetch function
 */
export function useDataSource(
  requirement: SduiDataRequirement | undefined,
): DataSourceState {
  const [state, setState] = useState<{
    data: unknown;
    isLoading: boolean;
    error: Error | null;
  }>({
    data: null,
    isLoading: !!requirement,
    error: null,
  });

  const trpc = useTRPC();
  const utils = trpc.useUtils();

  const fetchData = useCallback(async () => {
    if (!requirement) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }

    const cacheKey = getCacheKey(requirement);
    const cached = dataCache.get(cacheKey);

    // Return cached data if still valid
    if (cached && isCacheValid(cached, requirement.staleTime)) {
      setState({
        data: cached.data,
        isLoading: false,
        error: cached.error,
      });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      // Parse the procedure path (e.g., "product.search" -> ["product", "search"])
      const procedureParts = requirement.procedure.split(".");

      // Navigate to the procedure on the utils object
      let procedure: unknown = utils;
      for (const part of procedureParts) {
        procedure = (procedure as Record<string, unknown>)[part];
      }

      if (typeof procedure !== "object" || procedure === null) {
        throw new Error(`Invalid procedure: ${requirement.procedure}`);
      }

      const query = (procedure as { fetch: (input: unknown) => Promise<unknown> }).fetch;

      if (typeof query !== "function") {
        throw new Error(`Procedure ${requirement.procedure} is not queryable`);
      }

      const data = await query(requirement.input ?? {});

      const entry: DataCacheEntry = {
        data,
        fetchedAt: Date.now(),
        error: null,
      };

      dataCache.set(cacheKey, entry);

      setState({
        data,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      const entry: DataCacheEntry = {
        data: null,
        fetchedAt: Date.now(),
        error,
      };

      dataCache.set(cacheKey, entry);

      setState({
        data: null,
        isLoading: false,
        error,
      });
    }
  }, [requirement, utils]);

  // Fetch on mount and when requirement changes
  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Refetch on window focus if configured
  useEffect(() => {
    if (!requirement?.refetchOnWindowFocus) return;

    const handleFocus = () => {
      void fetchData();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [requirement?.refetchOnWindowFocus, fetchData]);

  return {
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetchData,
  };
}

// =============================================================================
// Hook: useDataRequirements
// =============================================================================

/**
 * Hook for fetching multiple data requirements at once.
 * Returns a map of requirement ID to data source state.
 *
 * @param requirements - Array of data requirements
 * @returns Map from requirement ID to DataSourceState
 */
export function useDataRequirements(
  requirements: readonly SduiDataRequirement[],
): Map<string, DataSourceState> {
  const [states, setStates] = useState<Map<string, DataSourceState>>(new Map());
  const trpc = useTRPC();
  const utils = trpc.useUtils();

  useEffect(() => {
    const fetchAll = async () => {
      const newStates = new Map<string, DataSourceState>();

      for (const req of requirements) {
        const cacheKey = getCacheKey(req);
        const cached = dataCache.get(cacheKey);

        if (cached && isCacheValid(cached, req.staleTime)) {
          newStates.set(req.id, {
            data: cached.data,
            isLoading: false,
            error: cached.error,
            refetch: async () => {
              // Will be replaced with actual refetch
            },
          });
          continue;
        }

        // Set loading state
        newStates.set(req.id, {
          data: null,
          isLoading: true,
          error: null,
          refetch: async () => {},
        });
      }

      setStates(new Map(newStates));

      // Fetch all requirements in parallel
      await Promise.all(
        requirements.map(async (req) => {
          try {
            const procedureParts = req.procedure.split(".");
            let procedure: unknown = utils;

            for (const part of procedureParts) {
              procedure = (procedure as Record<string, unknown>)[part];
            }

            const query = (procedure as { fetch: (input: unknown) => Promise<unknown> }).fetch;
            const data = await query(req.input ?? {});

            dataCache.set(getCacheKey(req), {
              data,
              fetchedAt: Date.now(),
              error: null,
            });

            setStates((prev) => {
              const next = new Map(prev);
              next.set(req.id, {
                data,
                isLoading: false,
                error: null,
                refetch: async () => {
                  // Trigger refetch
                },
              });
              return next;
            });
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));

            setStates((prev) => {
              const next = new Map(prev);
              next.set(req.id, {
                data: null,
                isLoading: false,
                error,
                refetch: async () => {},
              });
              return next;
            });
          }
        }),
      );
    };

    if (requirements.length > 0) {
      void fetchAll();
    }
  }, [requirements, utils]);

  return states;
}

// =============================================================================
// Utility: Clear Cache
// =============================================================================

export function clearDataCache(): void {
  dataCache.clear();
}

export function invalidateCacheForProcedure(procedure: string): void {
  for (const [key] of dataCache) {
    if (key.startsWith(`${procedure}:`)) {
      dataCache.delete(key);
    }
  }
}

