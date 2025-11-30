"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import type { SduiAction, SduiDataRequirement, SduiScreen } from "~/types/sdui";

// =============================================================================
// Types
// =============================================================================

type DataCache = Record<
  string,
  {
    readonly data: unknown;
    readonly error: Error | null;
    readonly isLoading: boolean;
    readonly fetchedAt: number;
  }
>;

interface SduiContextValue {
  readonly screen: SduiScreen;
  readonly actions: Map<string, SduiAction>;
  readonly dataRequirements: Map<string, SduiDataRequirement>;
  readonly dataCache: DataCache;
  readonly pendingActionId: string | null;
  readonly invokeAction: (
    actionId: string,
    elementId: string,
    formData?: Record<string, unknown>,
  ) => Promise<void>;
  readonly setDataCache: (
    requirementId: string,
    data: unknown,
    error?: Error | null,
  ) => void;
  readonly getDataForSource: (dataSourceId: string) => unknown;
  readonly isDataLoading: (dataSourceId: string) => boolean;
}

interface OverlayContextValue {
  readonly inputValue: string;
  readonly isSending: boolean;
  readonly onInputChange: (value: string) => void;
  readonly onSendPrompt: (prompt: string) => Promise<void> | void;
}

// =============================================================================
// Contexts
// =============================================================================

const SduiContext = createContext<SduiContextValue | null>(null);
const OverlayContext = createContext<OverlayContextValue | null>(null);

// =============================================================================
// Provider
// =============================================================================

interface SduiProviderProps {
  readonly screen: SduiScreen;
  readonly children: ReactNode;
  readonly onActionInvoke?: (
    actionId: string,
    elementId: string,
  ) => Promise<void>;
  readonly onActionError?: (message: string) => void;
}

export function SduiProvider({
  screen,
  children,
  onActionInvoke,
  onActionError,
}: SduiProviderProps) {
  const [dataCache, setDataCacheState] = useState<DataCache>({});
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  const actions = useMemo(
    () => new Map(screen.actions.map((action) => [action.id, action])),
    [screen.actions],
  );

  const dataRequirements = useMemo(
    () => new Map(screen.dataRequirements.map((req) => [req.id, req])),
    [screen.dataRequirements],
  );

  const setDataCache = useCallback(
    (requirementId: string, data: unknown, error: Error | null = null) => {
      setDataCacheState((prev) => ({
        ...prev,
        [requirementId]: {
          data,
          error,
          isLoading: false,
          fetchedAt: Date.now(),
        },
      }));
    },
    [],
  );

  const getDataForSource = useCallback(
    (dataSourceId: string): unknown => {
      return dataCache[dataSourceId]?.data ?? null;
    },
    [dataCache],
  );

  const isDataLoading = useCallback(
    (dataSourceId: string): boolean => {
      const cached = dataCache[dataSourceId];
      if (!cached) return true;
      return cached.isLoading;
    },
    [dataCache],
  );

  const invokeAction = useCallback(
    async (
      actionId: string,
      elementId: string,
      formData?: Record<string, unknown>,
    ) => {
      const action = actions.get(actionId);
      if (!action) {
        onActionError?.(`Action "${actionId}" not found`);
        return;
      }

      setPendingActionId(actionId);

      try {
        if (onActionInvoke) {
          await onActionInvoke(actionId, elementId);
        } else if (action.invocation.type === "trpc") {
          // Merge action input with form data (form data takes precedence)
          const mergedInput = {
            ...action.invocation.input,
            ...formData,
          };

          // Default tRPC invocation via API
          const response = await fetch("/api/sdui/action", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              actionId,
              elementId,
              procedure: action.invocation.procedure,
              input: mergedInput,
            }),
          });

          if (!response.ok) {
            throw new Error(`Action failed: ${response.statusText}`);
          }
        } else if (action.invocation.type === "navigate") {
          window.location.href = action.invocation.path;
        } else if (action.invocation.type === "prompt") {
          // Prompt invocations are handled by overlay context
          console.log("Prompt action:", action.invocation.text);
        }
      } catch (error) {
        console.error("Action invocation error:", error);
        onActionError?.(
          error instanceof Error ? error.message : "Action failed",
        );
      } finally {
        setPendingActionId(null);
      }
    },
    [actions, onActionInvoke, onActionError],
  );

  const value = useMemo<SduiContextValue>(
    () => ({
      screen,
      actions,
      dataRequirements,
      dataCache,
      pendingActionId,
      invokeAction,
      setDataCache,
      getDataForSource,
      isDataLoading,
    }),
    [
      screen,
      actions,
      dataRequirements,
      dataCache,
      pendingActionId,
      invokeAction,
      setDataCache,
      getDataForSource,
      isDataLoading,
    ],
  );

  return <SduiContext.Provider value={value}>{children}</SduiContext.Provider>;
}

// =============================================================================
// Overlay Provider
// =============================================================================

interface OverlayProviderProps extends OverlayContextValue {
  readonly children: ReactNode;
}

export function OverlayProvider({
  children,
  inputValue,
  isSending,
  onInputChange,
  onSendPrompt,
}: OverlayProviderProps) {
  const value = useMemo<OverlayContextValue>(
    () => ({ inputValue, isSending, onInputChange, onSendPrompt }),
    [inputValue, isSending, onInputChange, onSendPrompt],
  );

  return (
    <OverlayContext.Provider value={value}>{children}</OverlayContext.Provider>
  );
}

// =============================================================================
// Hooks
// =============================================================================

export function useSduiContext(): SduiContextValue {
  const context = useContext(SduiContext);
  if (!context) {
    throw new Error("useSduiContext must be used within an SduiProvider");
  }
  return context;
}

export function useOverlayContext(): OverlayContextValue {
  const context = useContext(OverlayContext);
  if (!context) {
    throw new Error("useOverlayContext must be used within an OverlayProvider");
  }
  return context;
}

export function useAction(actionId: string): {
  action: SduiAction | undefined;
  isPending: boolean;
  invoke: (elementId: string) => Promise<void>;
} {
  const { actions, pendingActionId, invokeAction } = useSduiContext();
  const action = actions.get(actionId);

  return {
    action,
    isPending: pendingActionId === actionId,
    invoke: (elementId: string) => invokeAction(actionId, elementId),
  };
}

export function useDataSource(dataSourceId: string | undefined): {
  data: unknown;
  isLoading: boolean;
  error: Error | null;
} {
  const { dataCache, isDataLoading } = useSduiContext();

  if (!dataSourceId) {
    return { data: null, isLoading: false, error: null };
  }

  const cached = dataCache[dataSourceId];

  return {
    data: cached?.data ?? null,
    isLoading: isDataLoading(dataSourceId),
    error: cached?.error ?? null,
  };
}

// =============================================================================
// Form Context (for form components to share state)
// =============================================================================

interface FormContextValue {
  readonly formData: Record<string, unknown>;
  readonly errors: Record<string, string>;
  readonly isSubmitting: boolean;
  readonly onFieldChange: (name: string, value: unknown) => void;
}

const FormContext = createContext<FormContextValue>({
  formData: {},
  errors: {},
  isSubmitting: false,
  onFieldChange: () => {
    /* noop */
  },
});

export function useFormContext(): FormContextValue {
  return useContext(FormContext);
}

export { FormContext };
