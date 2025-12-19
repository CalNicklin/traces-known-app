# Investigation: Community Reports Bug

## Problem Statement

1. User reports should appear in the "Community Reports" section on product pages
2. Instead, report content appears in the "Allergen Warning" section
3. Community Reports section shows nothing

## Status: ✅ RESOLVED

**Date:** 2024-12-19

---

## Root Cause Analysis

### Database Query Results

```sql
SELECT * FROM app.report LIMIT 10;
-- Result: [] (EMPTY - no reports exist)

SELECT id, name, allergen_warning FROM app.product WHERE allergen_warning IS NOT NULL;
-- Result: Product "Lindt 70% dark chocolate" has allergen_warning containing user reaction text

SELECT p.id, p.name, p.allergen_warning, COUNT(r.id) as report_count...
-- Result: report_count = 0 for the product with allergen_warning
```

### Findings

**Issue 1: UX Confusion (Primary Cause)**

- Users were entering personal allergy reactions into the `allergenWarning` field when adding products
- The field label "Allergen Warning" was misleading—users interpreted it as where to share their experience
- No actual `Report` records were ever created

**Issue 2: Duplicate Relations (Code Quality)**

- `Report` table had relations defined in BOTH `report-schema.ts` AND `relations.ts`
- `Allergen` table had same issue
- Drizzle requires ONE `relations()` call per table; behavior with duplicates is undefined

---

## Intended Data Model

Per Q's clarification, product pages should show THREE things:

1. **Allergen Warning** - manufacturer's label from the packet (`Product.allergenWarning`)
2. **AI Summary** - generated from community reports (future feature)
3. **Community Reports** - individual user reports (`Report` table)

---

## Resolution

### Fix 1: Consolidated Relations

Removed duplicate relation definitions from individual schema files. All relations now defined in `relations.ts`:

**Files changed:**

- `packages/db/src/schema/relations.ts` - Now contains ALL relation definitions
- `packages/db/src/schema/report-schema.ts` - Removed `ReportRelations`, `ReportAllergenRelations`
- `packages/db/src/schema/allergen-schema.ts` - Removed `AllergenRelations`, `UserAllergenRelations`

### Fix 2: Clarified AddProductForm UX

Updated `apps/nextjs/src/app/_components/add-product-form.tsx`:

- Renamed field label: "Allergen Warning" → "Package Allergen Warning"
- Added FormDescription: "Copy the allergen statement from the product packaging. For personal allergy experiences, submit a report after adding the product."

---

## Future Work: AI Summary Schema

```ts
// packages/db/src/schema/product-summary-schema.ts
export const ProductSummary = appSchema.table("product_summary", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  productId: t
    .uuid()
    .notNull()
    .references(() => Product.id, { onDelete: "cascade" }),
  summary: t.text().notNull(), // AI-generated summary
  reportCount: t.integer().notNull(), // Reports included in summary
  riskAssessment: t.varchar({ length: 50 }), // AI-determined risk
  generatedAt: t.timestamp().notNull(),
  modelVersion: t.varchar({ length: 100 }),
  createdAt: t.timestamp().defaultNow().notNull(),
}));
```

---

## Files Modified

1. `packages/db/src/schema/relations.ts` - Consolidated all relations
2. `packages/db/src/schema/report-schema.ts` - Removed duplicate relations
3. `packages/db/src/schema/allergen-schema.ts` - Removed duplicate relations
4. `apps/nextjs/src/app/_components/add-product-form.tsx` - Clarified allergenWarning field

