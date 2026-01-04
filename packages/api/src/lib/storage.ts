import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

import { env } from "../env";

const BUCKET_NAME = "user-product-images";
const TEMP_FOLDER = "temp";

// Folder mapping for different entity types
const ENTITY_FOLDERS: Record<string, string> = {
  report: "reports",
  product: "products",
};

// Lazy initialization for Supabase client
let _supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  _supabase ??= createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return _supabase;
}

/**
 * Generate a presigned URL for direct client upload
 * This bypasses Vercel's 4.5MB body limit
 */
export async function createUploadUrl(filename: string) {
  const supabase = getSupabaseAdmin();
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).slice(2, 11);
  const extension = filename.split(".").pop() ?? "jpg";
  const tempPath = `${TEMP_FOLDER}/${timestamp}-${randomId}.${extension}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUploadUrl(tempPath);

  if (error) {
    throw new Error(`Failed to create upload URL: ${error.message}`);
  }

  return {
    uploadUrl: data.signedUrl,
    token: data.token,
    tempPath,
  };
}

/**
 * Unified image processing function:
 * 1. Download from temp location
 * 2. Optimize with Sharp
 * 3. Upload to final location based on entity type
 * 4. Delete temp file
 * 5. Return public URL
 *
 * @param tempPath - Path to the temporary uploaded file
 * @param entityType - Type of entity ("product" | "report")
 * @param entityId - ID of the entity (productId or reportId)
 */
export async function processImage(
  tempPath: string,
  entityType: "product" | "report",
  entityId: string,
): Promise<{
  url: string;
  storagePath: string;
  width: number;
  height: number;
  sizeBytes: number;
}> {
  const supabase = getSupabaseAdmin();
  const folder = ENTITY_FOLDERS[entityType] ?? "images";

  // 1. Download temp file
  const downloadResult = await supabase.storage
    .from(BUCKET_NAME)
    .download(tempPath);

  if (downloadResult.error) {
    throw new Error(`Failed to download temp file: ${downloadResult.error.message}`);
  }

  const tempFile = downloadResult.data;

  // 2. Optimize with Sharp
  const buffer = Buffer.from(await tempFile.arrayBuffer());
  const optimized = await sharp(buffer)
    .resize(1200, 1200, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toBuffer();

  // Get metadata for the optimized image
  const metadata = await sharp(optimized).metadata();
  const width = metadata.width;
  const height = metadata.height;
  const sizeBytes = optimized.length;

  // 3. Upload to final location
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).slice(2, 11);
  const finalPath = `${folder}/${entityId}/${timestamp}-${randomId}.webp`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(finalPath, optimized, {
      contentType: "image/webp",
      cacheControl: "31536000", // 1 year cache
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload optimized image: ${uploadError.message}`);
  }

  // 4. Delete temp file
  await supabase.storage.from(BUCKET_NAME).remove([tempPath]);

  // 5. Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(finalPath);

  return {
    url: urlData.publicUrl,
    storagePath: finalPath,
    width,
    height,
    sizeBytes,
  };
}

/**
 * Delete an image from storage
 */
export async function deleteImage(storagePath: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([storagePath]);

  if (error) {
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}

/**
 * Get public URL for an image
 */
export function getImageUrl(storagePath: string): string {
  const supabase = getSupabaseAdmin();
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
  return data.publicUrl;
}
