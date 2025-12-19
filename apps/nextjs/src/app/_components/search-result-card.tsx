import Image from "next/image";
import Link from "next/link";

import type { RouterOutputs } from "@acme/api";
import { Badge, Card, Text } from "@acme/ui";

type SearchResultProduct = RouterOutputs["product"]["search"][0];

interface SearchResultCardProps {
  product: SearchResultProduct;
}

export function SearchResultCard({ product }: SearchResultCardProps) {
  return (
    <Link href={`/product/${product.id}`} className="group block">
      <Card className="p-4 transition-colors hover:bg-accent">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={64}
                height={64}
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <Text variant="caption">No image</Text>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-1">
            <Text
              variant="small"
              className="font-semibold text-foreground group-hover:text-primary"
            >
              {product.name}
            </Text>

            <div className="flex items-center gap-2">
              {product.barcode && (
                <Text variant="muted">Barcode: {product.barcode}</Text>
              )}
              {product.inDb && (
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800"
                >
                  <span className="mr-1 h-1.5 w-1.5 rounded-full bg-green-500"></span>
                  In Database
                </Badge>
              )}
            </div>
          </div>

          <div className="text-muted-foreground">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </Card>
    </Link>
  );
}
