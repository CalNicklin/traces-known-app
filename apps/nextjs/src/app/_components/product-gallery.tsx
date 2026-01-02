"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { useSuspenseQuery } from "@tanstack/react-query";

import type { RouterOutputs } from "@acme/api";
import {
  AspectRatio,
  Button,
  Carousel,
  CarouselContent,
  CarouselItem,
  cn,
  Dialog,
  DialogContent,
  DialogTitle,
  Skeleton,
} from "@acme/ui";

import { useTRPC } from "~/trpc/react";

type ReportImage = RouterOutputs["image"]["reportImagesByProductId"][number];

interface ProductGalleryProps {
  productId: string;
  mainImageUrl?: string | null;
  productName: string;
  className?: string;
}

export function ProductGallery({
  productId,
  mainImageUrl,
  productName,
  className,
}: ProductGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const trpc = useTRPC();
  const { data: reportImages } = useSuspenseQuery(
    trpc.image.reportImagesByProductId.queryOptions({ productId }),
  );

  // Combine main image with report images
  const allImages = [
    ...(mainImageUrl
      ? [{ id: "main", url: mainImageUrl, isMain: true }]
      : []),
    ...(reportImages as ReportImage[]).map((img) => ({
      id: img.id,
      url: img.url,
      isMain: false,
    })),
  ];

  if (allImages.length === 0) {
    return (
      <div
        className={cn(
          "bg-muted flex aspect-square items-center justify-center rounded-lg",
          className
        )}
      >
        <span className="text-muted-foreground text-sm">No images</span>
      </div>
    );
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Main image carousel */}
      <Carousel className="w-full">
        <CarouselContent>
          {allImages.map((image, index) => (
            <CarouselItem key={image.id}>
              <AspectRatio ratio={1}>
                <Image
                  src={image.url}
                  alt={`${productName} - Image ${index + 1}`}
                  fill
                  className="cursor-pointer rounded-lg object-cover"
                  onClick={() => openLightbox(index)}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </AspectRatio>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Thumbnail grid (if more than 1 image) */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => openLightbox(index)}
              className={cn(
                "relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors",
                index === lightboxIndex
                  ? "border-primary"
                  : "border-transparent hover:border-muted-foreground/50"
              )}
            >
              <Image
                src={image.url}
                alt={`Thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
              {image.isMain && (
                <span className="bg-primary text-primary-foreground absolute bottom-0 left-0 right-0 text-center text-[10px]">
                  Main
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">Image gallery lightbox</DialogTitle>
          <div className="relative">
            {/* Navigation buttons */}
            {allImages.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-2 top-1/2 z-10 -translate-y-1/2"
                  onClick={() =>
                    setLightboxIndex(
                      (prev) => (prev - 1 + allImages.length) % allImages.length
                    )
                  }
                >
                  <ChevronLeftIcon className="h-6 w-6" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-2 top-1/2 z-10 -translate-y-1/2"
                  onClick={() =>
                    setLightboxIndex((prev) => (prev + 1) % allImages.length)
                  }
                >
                  <ChevronRightIcon className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* Current image */}
            <div className="relative aspect-square max-h-[80vh]">
              <Image
                src={allImages[lightboxIndex]?.url ?? ""}
                alt={`${productName} - Full size`}
                fill
                className="rounded-lg object-contain"
                sizes="(max-width: 768px) 100vw, 80vw"
                priority
              />
            </div>

            {/* Image counter */}
            <div className="text-muted-foreground mt-2 text-center text-sm">
              {lightboxIndex + 1} / {allImages.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ProductGallerySkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-square w-full rounded-lg" />
      <div className="flex gap-2">
        <Skeleton className="h-16 w-16 rounded-md" />
        <Skeleton className="h-16 w-16 rounded-md" />
        <Skeleton className="h-16 w-16 rounded-md" />
      </div>
    </div>
  );
}
