# @acme/external-services

Type-safe, validated clients for external APIs. All services follow a consistent functional programming pattern.

## Architecture

### Base Infrastructure (`src/base/`)

- **`types.ts`**: Shared types for all external services
- **`errors.ts`**: Standardized error handling utilities
- **`client.ts`**: Base HTTP client with retry logic, timeout handling, and error recovery

### Service Implementation Pattern

Each external service follows this structure:

```
src/[service-name]/
├── schemas.ts    # Zod schemas for API responses
├── client.ts     # Service-specific client functions
└── index.ts      # Public exports
```

## Usage

### Direct Client Usage

```typescript
import { createOpenFoodFactsClient } from "@acme/external-services/open-food-facts";

const client = createOpenFoodFactsClient();

// Get product by barcode
const result = await client.getProductByBarcode("3017624010701");
if (result.success) {
  console.log(result.data.product?.product_name);
} else {
  console.error(result.error.message);
}

// Search products
const searchResult = await client.searchProducts("cereal", {
  page: 1,
  pageSize: 24,
});
```

### Via tRPC (Recommended)

```typescript
// In your tRPC router
import { createOpenFoodFactsClient } from "@acme/external-services/open-food-facts";

export const myRouter = {
  getProduct: publicProcedure
    .input(z.object({ barcode: z.string() }))
    .query(async ({ input }) => {
      const client = createOpenFoodFactsClient();
      const result = await client.getProductByBarcode(input.barcode);

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error.message,
        });
      }

      return result.data;
    }),
};
```

## Adding a New External Service

1. **Create service directory**: `src/[service-name]/`

2. **Define schemas** (`schemas.ts`):

   ```typescript
   import { z } from "zod/v4";

   export const MyServiceResponseSchema = z.object({
     // Define your schema
   });

   export type MyServiceResponse = z.infer<typeof MyServiceResponseSchema>;
   ```

3. **Create client** (`client.ts`):

   ```typescript
   import type {
     ExternalServiceConfig,
     ExternalServiceResult,
   } from "../base/types";
   import {
     createExternalServiceClient,
     parseJsonResponse,
   } from "../base/client";
   import { MyServiceResponseSchema } from "./schemas";

   const DEFAULT_CONFIG: ExternalServiceConfig = {
     baseUrl: "https://api.example.com",
     // ... other config
   };

   export function createMyServiceClient(
     config?: Partial<ExternalServiceConfig>,
   ) {
     const finalConfig = { ...DEFAULT_CONFIG, ...config };
     const { fetch } = createExternalServiceClient(finalConfig);

     return {
       async getData(
         id: string,
       ): Promise<ExternalServiceResult<MyServiceResponse>> {
         const responseResult = await fetch(`/api/data/${id}`);
         if (!responseResult.success) return responseResult;

         const jsonResult = await parseJsonResponse(responseResult.data);
         if (!jsonResult.success) return jsonResult;

         const validationResult = MyServiceResponseSchema.safeParse(
           jsonResult.data,
         );
         if (!validationResult.success) {
           return {
             success: false,
             error: {
               code: "VALIDATION_ERROR",
               message: "Invalid response structure",
               cause: validationResult.error,
             },
           };
         }

         return { success: true, data: validationResult.data };
       },
     };
   }
   ```

4. **Export** (`index.ts`):

   ```typescript
   export * from "./client";
   export * from "./schemas";
   ```

5. **Add to main index** (`src/index.ts`):
   ```typescript
   export * from "./[service-name]";
   ```

## Principles

- **Functional Programming**: All clients are factory functions, no classes
- **Type Safety**: Zod schemas for runtime validation
- **Error Handling**: Consistent result types (`{ success: boolean, data/error }`)
- **Retry Logic**: Built-in retry with exponential backoff
- **Validation**: All responses validated with Zod before returning
- **Consistency**: All services follow the same pattern
