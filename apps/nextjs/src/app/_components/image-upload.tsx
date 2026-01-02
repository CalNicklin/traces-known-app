"use client";

import type { ChangeEvent, DragEvent } from "react";
import { useCallback, useState } from "react";
import Image from "next/image";
import { Cross2Icon, ImageIcon, UploadIcon } from "@radix-ui/react-icons";
import { useMutation } from "@tanstack/react-query";

import { Button, cn } from "@acme/ui";

import { useTRPC } from "~/trpc/react";

interface UploadedImage {
  id: string;
  url: string;
  status: "uploading" | "processing" | "complete" | "error";
  progress?: number;
  error?: string;
}

type EntityType = "product" | "report";

interface ImageUploadProps {
  /**
   * Type of entity the image belongs to
   */
  entityType: EntityType;

  /**
   * ID of the entity (productId or reportId)
   * Required for immediate upload mode
   */
  entityId?: string;

  /**
   * Maximum number of images allowed
   * Default: 1 for products, 5 for reports
   */
  maxImages?: number;

  /**
   * Callback when images change (immediate upload mode)
   */
  onImagesChange?: (images: UploadedImage[]) => void;

  /**
   * Callback when files are selected (staged mode - when entityId is not provided)
   * Use this to collect files for upload after entity creation
   */
  onFilesSelect?: (files: File[]) => void;

  /**
   * Whether the component is disabled
   */
  disabled?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Unified image upload component for both products and reports.
 *
 * Two modes of operation:
 * 1. Immediate upload (entityId provided): Uploads immediately to storage
 * 2. Staged mode (no entityId): Collects files for later upload via onFilesSelect
 */
export function ImageUpload({
  entityType,
  entityId,
  maxImages,
  onImagesChange,
  onFilesSelect,
  disabled = false,
  className,
}: ImageUploadProps) {
  // Default maxImages based on entity type
  const effectiveMaxImages = maxImages ?? (entityType === "product" ? 1 : 5);

  const [images, setImages] = useState<UploadedImage[]>([]);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const trpc = useTRPC();

  const requestUploadUrl = useMutation(
    trpc.image.requestUploadUrl.mutationOptions(),
  );

  const confirmUpload = useMutation(trpc.image.confirmUpload.mutationOptions());

  // Check if we're in staged mode (no entityId)
  const isStaged = !entityId;

  const updateImage = useCallback(
    (id: string, updates: Partial<UploadedImage>) => {
      setImages((prev) => {
        const updated = prev.map((img) =>
          img.id === id ? { ...img, ...updates } : img,
        );
        onImagesChange?.(updated);
        return updated;
      });
    },
    [onImagesChange],
  );

  const removeImage = useCallback(
    (id: string) => {
      setImages((prev) => {
        const updated = prev.filter((img) => img.id !== id);
        onImagesChange?.(updated);
        return updated;
      });
    },
    [onImagesChange],
  );

  const removeStagedFile = useCallback(
    (index: number) => {
      setStagedFiles((prev) => {
        const updated = prev.filter((_, i) => i !== index);
        onFilesSelect?.(updated);
        return updated;
      });
    },
    [onFilesSelect],
  );

  const uploadFile = useCallback(
    async (file: File) => {
      if (!entityId) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        return;
      }

      // Validate file size (max 50MB for raw uploads)
      if (file.size > 50 * 1024 * 1024) {
        return;
      }

      const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const previewUrl = URL.createObjectURL(file);

      // Add to state with uploading status
      setImages((prev) => {
        const updated = [
          ...prev,
          {
            id: localId,
            url: previewUrl,
            status: "uploading" as const,
            progress: 0,
          },
        ];
        onImagesChange?.(updated);
        return updated;
      });

      try {
        // 1. Get presigned upload URL
        const { uploadUrl, tempPath } = await requestUploadUrl.mutateAsync({
          filename: file.name,
        });

        updateImage(localId, { progress: 20 });

        // 2. Upload directly to Supabase Storage
        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error("Upload failed");
        }

        updateImage(localId, { status: "processing", progress: 60 });

        // 3. Confirm upload and process with Sharp
        const result = await confirmUpload.mutateAsync({
          tempPath,
          entityType,
          entityId,
        });

        // 4. Update with final URL
        URL.revokeObjectURL(previewUrl);
        updateImage(localId, {
          id: result?.id ?? localId,
          url: result?.url ?? previewUrl,
          status: "complete",
          progress: 100,
        });
      } catch (error) {
        updateImage(localId, {
          status: "error",
          error: error instanceof Error ? error.message : "Upload failed",
        });
      }
    },
    [
      entityId,
      entityType,
      requestUploadUrl,
      confirmUpload,
      updateImage,
      onImagesChange,
    ],
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter(
        (f) => f.type.startsWith("image/") && f.size <= 50 * 1024 * 1024,
      );

      if (isStaged) {
        // Staged mode: collect files for later upload
        const remaining = effectiveMaxImages - stagedFiles.length;
        const toAdd = fileArray.slice(0, remaining);
        setStagedFiles((prev) => {
          const updated = [...prev, ...toAdd];
          onFilesSelect?.(updated);
          return updated;
        });
      } else {
        // Immediate upload mode
        const remaining = effectiveMaxImages - images.length;
        const toUpload = fileArray.slice(0, remaining);
        toUpload.forEach((file) => {
          void uploadFile(file);
        });
      }
    },
    [
      isStaged,
      effectiveMaxImages,
      stagedFiles.length,
      images.length,
      uploadFile,
      onFilesSelect,
    ],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);

      if (disabled) return;

      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [disabled, handleFiles],
  );

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
        e.target.value = ""; // Reset input
      }
    },
    [handleFiles],
  );

  // Determine current count and if we can add more
  const currentCount = isStaged ? stagedFiles.length : images.length;
  const canAddMore = currentCount < effectiveMaxImages;

  // Use grid for multiple images, single display for one
  const isSingleMode = effectiveMaxImages === 1;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop zone */}
      {canAddMore && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
            isSingleMode
              ? "aspect-video w-full max-w-xs"
              : "min-h-32",
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          <input
            type="file"
            accept="image/*"
            multiple={effectiveMaxImages > 1}
            onChange={handleInputChange}
            disabled={disabled}
            className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
          />
          <UploadIcon className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-center text-sm text-muted-foreground">
            Drag & drop {effectiveMaxImages > 1 ? "images" : "an image"} or
            click to browse
          </p>
          {effectiveMaxImages > 1 && (
            <p className="mt-1 text-xs text-muted-foreground/60">
              {currentCount}/{effectiveMaxImages} images
            </p>
          )}
        </div>
      )}

      {/* Staged file previews (before upload) */}
      {isStaged && stagedFiles.length > 0 && (
        <div
          className={cn(
            isSingleMode
              ? ""
              : "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4",
          )}
        >
          {stagedFiles.map((file, index) => {
            const previewUrl = URL.createObjectURL(file);
            return (
              <div
                key={`staged-${index}`}
                className={cn(
                  "group relative overflow-hidden rounded-lg border",
                  isSingleMode ? "aspect-video w-full max-w-xs" : "aspect-square",
                )}
              >
                <Image
                  src={previewUrl}
                  alt="Upload preview"
                  fill
                  className="object-cover"
                  unoptimized
                  onLoad={() => URL.revokeObjectURL(previewUrl)}
                />
                {!disabled && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-1 top-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => removeStagedFile(index)}
                  >
                    <Cross2Icon className="h-3 w-3" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Uploaded image previews (immediate mode) */}
      {!isStaged && images.length > 0 && (
        <div
          className={cn(
            isSingleMode
              ? ""
              : "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4",
          )}
        >
          {images.map((image) => (
            <div
              key={image.id}
              className={cn(
                "group relative overflow-hidden rounded-lg border",
                isSingleMode ? "aspect-video w-full max-w-xs" : "aspect-square",
              )}
            >
              {image.url ? (
                <Image
                  src={image.url}
                  alt="Upload preview"
                  fill
                  className="object-cover"
                  unoptimized={image.status !== "complete"}
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-muted">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

              {/* Status overlay */}
              {image.status === "uploading" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-center text-white">
                    <div className="mb-1 text-sm">Uploading...</div>
                    <div className="mx-auto h-1 w-16 overflow-hidden rounded-full bg-white/30">
                      <div
                        className="h-full bg-white transition-all"
                        style={{ width: `${image.progress ?? 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {image.status === "processing" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-center text-white">
                    <div className="text-sm">Processing...</div>
                  </div>
                </div>
              )}

              {image.status === "error" && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500/80">
                  <div className="px-2 text-center text-xs text-white">
                    {image.error ?? "Error"}
                  </div>
                </div>
              )}

              {/* Remove button */}
              {!disabled && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute right-1 top-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => removeImage(image.id)}
                >
                  <Cross2Icon className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Re-export types for consumers
export type { UploadedImage, EntityType, ImageUploadProps };
