"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CookieIcon, CubeIcon, MixIcon, StarIcon } from "@radix-ui/react-icons";

import type { RouterOutputs } from "@acme/api";
import { cn } from "@acme/ui";

type Category = RouterOutputs["category"]["all"][0];

// Map of icon names to components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  CookieIcon,
  CubeIcon,
  MixIcon,
  StarIcon,
};

function getCategoryIcon(iconName: string | null) {
  if (!iconName) return CubeIcon;
  return iconMap[iconName] ?? CubeIcon;
}

interface CategoryChipsProps {
  categories: Category[];
  currentSlug?: string;
  title?: string;
}

export function CategoryChips({
  categories,
  currentSlug,
  title,
}: CategoryChipsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Sort categories alphabetically (API returns desc order)
  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsMouseDown(true);
    setHasDragged(false);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsMouseDown(false);
    // Reset hasDragged after a short delay to allow click events to be blocked
    setTimeout(() => setHasDragged(false), 0);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isMouseDown || !scrollRef.current) return;
      const x = e.pageX - scrollRef.current.offsetLeft;
      const distance = Math.abs(x - startX);

      // Only start dragging if moved more than 5px (distinguishes click from drag)
      if (distance > 5) {
        setHasDragged(true);
        e.preventDefault();
        const walk = (x - startX) * 1.5; // Scroll speed multiplier
        scrollRef.current.scrollLeft = scrollLeft - walk;
      }
    },
    [isMouseDown, startX, scrollLeft],
  );

  const handleMouseLeave = useCallback(() => {
    setIsMouseDown(false);
  }, []);

  if (categories.length === 0) {
    return null;
  }

  const chipsContent = (
    <div
      ref={scrollRef}
      className={cn(
        "scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-2",
        hasDragged ? "cursor-grabbing" : "cursor-grab",
      )}
      role="navigation"
      aria-label="Category navigation"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {sortedCategories.map((category) => {
        const Icon = getCategoryIcon(category.icon);
        const isActive = currentSlug ? category.slug === currentSlug : false;

        return (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-accent hover:text-accent-foreground",
              hasDragged && "pointer-events-none",
            )}
            aria-current={isActive ? "page" : undefined}
            draggable={false}
          >
            <Icon className="h-4 w-4" />
            <span>{category.name}</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-xs",
                isActive
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {category.productCount}
            </span>
          </Link>
        );
      })}
    </div>
  );

  if (title) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {chipsContent}
      </section>
    );
  }

  return chipsContent;
}

export function CategoryChipsSkeleton({ title }: { title?: string }) {
  const content = (
    <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex h-10 w-28 shrink-0 animate-pulse items-center gap-2 rounded-full bg-muted"
        />
      ))}
    </div>
  );

  if (title) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {content}
      </section>
    );
  }

  return content;
}
