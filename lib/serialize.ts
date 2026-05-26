import type { Product } from "@prisma/client";
import type { ProductDTO } from "@/types/product";

type ProductWithRelations = Product & {
  category: { slug: string; name: string };
  specs: Array<{ id: string; key: string; value: string; group: string | null; sortOrder: number }>;
  images: Array<{ id: string; url: string; pathname: string | null; alt: string | null; type: string; sortOrder: number; isMain: boolean }>;
};

export function serializeProduct(product: ProductWithRelations): ProductDTO {
  return {
    id: product.id,
    sku: product.sku,
    slug: product.slug,
    name: product.name,
    category: product.category.name,
    categorySlug: product.category.slug,
    description: product.description,
    shortDesc: product.shortDesc,
    price: product.price,
    originalPrice: product.originalPrice,
    stockStatus: product.stockStatus,
    deliveryText: product.deliveryText,
    badge: product.badge,
    rating: product.rating,
    reviewCount: product.reviewCount,
    isVisible: product.isVisible,
    isFeatured: product.isFeatured,
    sortOrder: product.sortOrder,
    specs: product.specs.map((spec) => ({
      id: spec.id,
      key: spec.key,
      value: spec.value,
      group: spec.group,
      sortOrder: spec.sortOrder
    })),
    images: product.images.map((image) => ({
      id: image.id,
      url: image.url,
      pathname: image.pathname,
      alt: image.alt,
      type: image.type,
      sortOrder: image.sortOrder,
      isMain: image.isMain
    })),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString()
  };
}
