import { NextResponse } from "next/server";

import { and, desc, eq, isNull, sql } from "@acme/db";
import { db } from "@acme/db/client";
import { Product, ProductAISummary, Report } from "@acme/db/schema";

import { env } from "~/env";
import { summarizeReports } from "~/lib/ai/summarize-reports";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for processing multiple products

export async function GET(request: Request) {
  // Verify cron secret (Vercel sends this automatically)
  const authHeader = request.headers.get("authorization");
  if (env.CRON_SECRET && authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get products needing summarization (minReports: 1 for now to test quality)
    const productsToProcess = await getProductsToSummarize(1, 20);

    let processed = 0;
    const errors: string[] = [];

    for (const product of productsToProcess) {
      try {
        // Fetch top 20 reports for this product
        const reports = await db.query.Report.findMany({
          where: and(
            eq(Report.productId, product.id),
            isNull(Report.deletedAt),
          ),
          orderBy: [desc(Report.reportDate)],
          limit: 20,
          columns: {
            comment: true,
            reportDate: true,
          },
        });

        if (reports.length < 1) continue; // Skip if no reports

        // Generate AI summary
        const summary = await summarizeReports(
          reports,
          product.name,
          product.allergenWarning,
        );

        // Upsert the summary
        await db
          .insert(ProductAISummary)
          .values({
            productId: product.id,
            summary: summary.summary,
            riskLevel: summary.riskLevel,
            confidence: summary.confidence,
            reportCount: reports.length,
            modelVersion: "gpt-5",
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: ProductAISummary.productId,
            set: {
              summary: summary.summary,
              riskLevel: summary.riskLevel,
              confidence: summary.confidence,
              reportCount: reports.length,
              modelVersion: "gpt-5",
              updatedAt: new Date(),
            },
          });

        // Also update the product's riskLevel to match the AI summary
        await db
          .update(Product)
          .set({ riskLevel: summary.riskLevel })
          .where(eq(Product.id, product.id));

        processed++;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        errors.push(`Product ${product.id}: ${message}`);
        console.error(`Failed to summarize product ${product.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      total: productsToProcess.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function getProductsToSummarize(minReports: number, limit: number) {
  const products = await db
    .select({
      id: Product.id,
      name: Product.name,
      allergenWarning: Product.allergenWarning,
      reportCount: sql<number>`count(${Report.id})::int`,
      latestReportDate: sql<Date>`max(${Report.reportDate})`,
      latestReportUpdatedAt: sql<Date>`max(${Report.updatedAt})`,
      summaryUpdatedAt: ProductAISummary.updatedAt,
    })
    .from(Product)
    .innerJoin(Report, eq(Report.productId, Product.id))
    .leftJoin(ProductAISummary, eq(ProductAISummary.productId, Product.id))
    .where(isNull(Report.deletedAt))
    .groupBy(Product.id, ProductAISummary.updatedAt)
    .having(sql`count(${Report.id}) >= ${minReports}`)
    .orderBy(desc(sql`max(${Report.reportDate})`))
    .limit(limit);

  // Filter to products needing update:
  // - No summary yet, OR
  // - New reports added since last summary, OR
  // - Existing reports edited since last summary
  return products.filter(
    (p) =>
      !p.summaryUpdatedAt ||
      (p.latestReportDate && p.latestReportDate > p.summaryUpdatedAt) ||
      (p.latestReportUpdatedAt && p.latestReportUpdatedAt > p.summaryUpdatedAt),
  );
}
