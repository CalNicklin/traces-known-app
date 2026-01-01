"use client";

import type { ChangeEvent, DragEvent } from "react";
import { useCallback, useState } from "react";
import Image from "next/image";
import { Cross2Icon, ImageIcon, UploadIcon } from "@radix-ui/react-icons";

import { Button, cn } from "@acme/ui";

import { useTRPC } from "~/trpc/react";
import { useMutation } from "@tanstack/react-query";

interface UploadedImage {
  id: string;
  url: string;
  status: "uploading" | "processing" | "complete" | "error";
  progress?: number;
  error?: string;
}

interface ImageUploadProps {
  reportId: string;
  onImagesChange?: (images: UploadedImage[]) => void;
  maxImages?: number;
  className?: string;
}

export function ImageUpload({
  reportId,
  onImagesChange,
  maxImages = 5,
  className,
}: ImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const trpc = useTRPC();

  const requestUploadUrl = useMutation(
    trpc.reportImage.requestUploadUrl.mutationOptions()
  );

  const confirmUpload = useMutation(
    trpc.reportImage.confirmUpload.mutationOptions()
  );

  const updateImage = useCallback(
    (id: string, updates: Partial<UploadedImage>) => {
      setImages((prev) => {
        const updated = prev.map((img) =>
          img.id === id ? { ...img, ...updates } : img
        );
        onImagesChange?.(updated);
        return updated;
      });
    },
    [onImagesChange]
  );

  const removeImage = useCallback(
    (id: string) => {
      setImages((prev) => {
        const updated = prev.filter((img) => img.id !== id);
        onImagesChange?.(updated);
        return updated;
      });
    },
    [onImagesChange]
  );

  const uploadFile = useCallback(
    async (file: File) => {
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
          reportId,
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
    [reportId, requestUploadUrl, confirmUpload, updateImage, onImagesChange]
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remaining = maxImages - images.length;
      const toUpload = fileArray.slice(0, remaining);

      toUpload.forEach((file) => {
        void uploadFile(file);
      });
    },
    [images.length, maxImages, uploadFile]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);

      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

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
    [handleFiles]
  );

  const canAddMore = images.length < maxImages;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop zone */}
      {canAddMore && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "relative flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          )}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleInputChange}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
          <UploadIcon className="text-muted-foreground mb-2 h-8 w-8" />
          <p className="text-muted-foreground text-sm">
            Drag & drop images or click to browse
          </p>
          <p className="text-muted-foreground/60 mt-1 text-xs">
            {images.length}/{maxImages} images
          </p>
        </div>
      )}

      {/* Image previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative aspect-square overflow-hidden rounded-lg border"
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
                <div className="bg-muted flex h-full items-center justify-center">
                  <ImageIcon className="text-muted-foreground h-8 w-8" />
                </div>
              )}

              {/* Status overlay */}
              {image.status === "uploading" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-center text-white">
                    <div className="mb-1 text-sm">Uploading...</div>
                    <div className="bg-white/30 mx-auto h-1 w-16 overflow-hidden rounded-full">
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
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => removeImage(image.id)}
              >
                <Cross2Icon className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
