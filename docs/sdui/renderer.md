# SDUI Renderer & Client Runtime

The client runtime renders SDUI screens by mapping component types to React components. It handles data fetching, action invocation, and the floating overlay.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  SduiRenderer (Entry Point)                                 │
│  ├── SduiProvider (Context)                                 │
│  │   ├── Actions map                                        │
│  │   ├── Data requirements                                  │
│  │   └── Data cache                                         │
│  ├── OverlayProvider (Overlay State)                        │
│  └── CanvasRenderer                                         │
│      ├── SectionRenderer (per section)                      │
│      │   └── renderComponent (recursive)                    │
│      └── CanvasOverlay (floating input)                     │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
apps/nextjs/src/app/_components/sdui/
├── sdui-renderer.tsx      # Entry point
├── sdui-context.tsx       # React contexts
├── components/
│   └── registry.tsx       # Component type → renderer map
└── hooks/
    └── use-data-source.ts # Data fetching hook
```

## Rendering Pipeline

### 1. SduiRenderer

Entry point that:
- Wraps everything in `SduiProvider` and `OverlayProvider`
- Extracts layout props for the canvas
- Renders sections

```tsx
<SduiRenderer
  screen={screen}
  inputValue={input}
  onInputChange={setInput}
  onSendPrompt={sendPrompt}
  isSending={isSending}
  onActionError={(msg) => toast.error(msg)}
/>
```

### 2. Context Providers

**SduiProvider** manages:
- `screen` - The current screen being rendered
- `actions` - Map of action ID → action definition
- `dataRequirements` - Map of requirement ID → requirement
- `dataCache` - Cached fetch results
- `invokeAction(actionId, elementId)` - Action invocation

**OverlayProvider** manages:
- `inputValue` - Current input text
- `isSending` - Loading state
- `onInputChange` / `onSendPrompt` - Handlers

### 3. Component Registry

The registry maps `type` to renderer functions:

```tsx
const componentRenderers = {
  stack: StackRenderer,
  heading: HeadingRenderer,
  list: ListRenderer,
  // ...
};

function renderComponent(component, context) {
  const Renderer = componentRenderers[component.type];
  return <Renderer component={component} context={context} />;
}
```

### 4. Recursive Rendering

Components with children call `renderComponent` recursively:

```tsx
function StackRenderer({ component, context }) {
  return (
    <Stack {...component.props}>
      {component.children?.map((child) => (
        <Fragment key={child.id}>
          {renderComponent(child, { ...context, depth: context.depth + 1 })}
        </Fragment>
      ))}
    </Stack>
  );
}
```

## Data Fetching

### useDataSource Hook

```tsx
function useDataSource(requirement: SduiDataRequirement | undefined) {
  // Returns: { data, isLoading, error, refetch }
}
```

**Features:**
- Caches results based on `staleTime`
- Supports `refetchOnWindowFocus`
- Handles tRPC procedure calls

### Data Binding Resolution

```tsx
function resolvePath(data: unknown, path: string): unknown {
  // Supports: $.field, $.nested.field, $[0], $.array[0].field
}

function resolveBindings(props, bindings, data) {
  // Merges resolved bindings into props
}
```

## Action Model

### Screen-Level Actions

Actions are defined once at the screen level:

```json
{
  "actions": [
    {
      "id": "refresh",
      "label": "Refresh",
      "invocation": { "type": "trpc", "procedure": "product.search" }
    }
  ]
}
```

### Action Invocation

When a button or section action is triggered:

1. Look up action by ID from context
2. Determine invocation type
3. For `trpc`: POST to `/api/sdui/action`
4. For `navigate`: Use client router
5. For `prompt`: Trigger overlay prompt

```tsx
const invokeAction = async (actionId, elementId) => {
  const action = actions.get(actionId);
  
  if (action.invocation.type === "trpc") {
    const response = await fetch("/api/sdui/action", {
      method: "POST",
      body: JSON.stringify({ actionId, elementId, ... }),
    });
    // Handle response (may update sections)
  }
};
```

### Section Actions

Sections can reference actions to show action buttons:

```json
{
  "id": "results",
  "actions": ["refresh"],
  "components": [...]
}
```

## Floating Overlay

### Canvas Layout

The `Canvas` component handles overlay positioning:

- Uses `position: fixed` with `z-30`
- Responsive: full width on mobile, max-width on desktop
- Adds bottom padding to content to prevent overlap

### Focus Management

```tsx
// Auto-focus input when not sending
useEffect(() => {
  if (!isSending && inputRef.current) {
    inputRef.current.focus();
  }
}, [isSending]);

// Escape to blur
const handleKeyDown = (e) => {
  if (e.key === "Escape") inputRef.current?.blur();
};
```

### Overlay Structure

```
┌────────────────────────────────────────────┐
│ Chat Input                                  │
│ [Helper text]                              │
│ [Quick Action 1] [Quick Action 2]          │
│                              [Send Button] │
└────────────────────────────────────────────┘
```

## GenerativeCanvas

The `GenerativeCanvas` component orchestrates the agent workflow:

```tsx
function GenerativeCanvas({ userName }) {
  const [screen, setScreen] = useState<SduiScreen | null>(null);
  const [blocks, setBlocks] = useState<AgentBlock[]>([]);
  
  const sendPrompt = async (prompt) => {
    // POST to /api/agent
    // Update blocks and screen
  };
  
  return (
    <SduiRenderer
      screen={screen ?? bootstrapScreen}
      onSendPrompt={sendPrompt}
      // ...
    />
  );
}
```

## Error Handling

### Unknown Component Types

```tsx
function UnknownRenderer({ component }) {
  return (
    <div className="border border-yellow-500 bg-yellow-500/10 p-4">
      Unknown component type: {component.type}
    </div>
  );
}
```

### Data Fetch Errors

Components should handle loading and error states:

```tsx
function ListRenderer({ component }) {
  const { data, isLoading, error } = useDataSource(component.dataSource);
  
  if (isLoading) return <Skeleton />;
  if (error) return <Text tone="danger">Failed to load</Text>;
  // ...
}
```

## Testing

Run the test suite:

```bash
cd apps/nextjs
pnpm test
```

Test coverage includes:
- Builder functions (section construction)
- Component registry (type mapping)
- Data binding resolution
- Action invocation

## Performance Considerations

1. **Memoization**: Use `useMemo` for computed values
2. **Key Props**: Always use stable `id` as key
3. **Data Caching**: Respect `staleTime` to avoid refetches
4. **Lazy Loading**: Consider code-splitting for large component registries
