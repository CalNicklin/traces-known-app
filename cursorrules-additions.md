# Suggested Additions to .cursorrules

## 1. Add after line 32 (end of "MCP Workflow (REQUIRED)" section):

```
4. **After writing code**: Always run `nextjs_call` with `get_errors` to verify no runtime errors before considering work complete
```

---

## 2. Add after line 79 (after "Database schema name is `app`" line):

```
### Adding New Database Tables (IMPORTANT)

When creating a new schema file in `packages/db/src/schema/`:

1. **Create the schema file** (e.g., `my-table-schema.ts`)
2. **Export from index.ts** - Add `export * from "./my-table-schema";` to `packages/db/src/schema/index.ts`
3. **Register in client.ts** - Add import AND spread in schema object in `packages/db/src/client.ts`:
   ```ts
   import * as myTableSchema from "./schema/my-table-schema";
   // ...
   export const db = drizzle(client, {
     schema: {
       ...myTableSchema,  // ADD THIS
       ...relations,
     },
   });
   ```
4. **Add relations** - Update `packages/db/src/schema/relations.ts` with new table relations
5. **Apply migration** - Use Supabase MCP to create tables and RLS policies

**Forgetting step 3 causes `Cannot read properties of undefined (reading 'findMany')` errors.**

### Hydration Safety

Use `formatDate()` from `~/lib/user` instead of `toLocaleDateString()` to avoid server/client hydration mismatches:

```tsx
// ❌ Causes hydration mismatch
{new Date(date).toLocaleDateString()}

// ✅ Consistent across server and client  
import { formatDate } from "~/lib/user";
{formatDate(date)}
```
```

---

## Summary of Issues These Prevent

1. **client.ts registration** - We forgot to add new schema imports to the Drizzle client, causing "Cannot read properties of undefined" errors
2. **Date hydration** - `toLocaleDateString()` produces different output on server vs client, causing React hydration mismatches
3. **Error checking** - Using Next.js MCP `get_errors` after implementation catches runtime issues early
