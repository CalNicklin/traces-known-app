import Image from "next/image";
import Link from "next/link";

import type { RouterOutputs } from "@acme/api";
import { Card } from "@acme/ui";

type Product = RouterOutputs["product"]["recentlyAdded"][0];

interface ProductCardMiniProps {
  product: Product;
  /** Optional badge to show on the card */
  badge?: React.ReactNode;
}

export function ProductCardMini({ product, badge }: ProductCardMiniProps) {
  return (
    <Link href={`/product/${product.id}`} className="group block flex-shrink-0">
      <Card className="h-32 w-28 overflow-hidden p-2 transition-colors hover:bg-accent sm:h-36 sm:w-32">
        <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-md bg-muted sm:h-20 sm:w-20">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
          )}
          {badge && <div className="absolute -right-1 -top-1">{badge}</div>}
        </div>
        <p className="mt-2 line-clamp-2 text-center text-xs font-medium leading-tight group-hover:text-primary">
          {product.name}
        </p>
      </Card>
    </Link>
  );
}

export function ProductCardMiniSkeleton() {
  return (
    <Card className="h-32 w-28 flex-shrink-0 p-2 sm:h-36 sm:w-32">
      <div className="mx-auto h-16 w-16 animate-pulse rounded-md bg-muted sm:h-20 sm:w-20" />
      <div className="mx-auto mt-2 h-3 w-20 animate-pulse rounded bg-muted" />
      <div className="mx-auto mt-1 h-3 w-16 animate-pulse rounded bg-muted" />
    </Card>
  );
}

