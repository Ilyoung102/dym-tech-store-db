export type ProductImageDTO = {
  id?: string;
  url: string;
  pathname?: string | null;
  alt?: string | null;
  type: string;
  sortOrder: number;
  isMain: boolean;
};

export type ProductSpecDTO = {
  id?: string;
  key: string;
  value: string;
  group?: string | null;
  sortOrder: number;
};

export type ProductDTO = {
  id: string;
  sku: string;
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  description: string;
  shortDesc?: string | null;
  price: number;
  originalPrice?: number | null;
  stockStatus: string;
  deliveryText?: string | null;
  badge?: string | null;
  rating: number;
  reviewCount: number;
  isVisible: boolean;
  isFeatured: boolean;
  sortOrder: number;
  specs: ProductSpecDTO[];
  images: ProductImageDTO[];
  createdAt?: string;
  updatedAt?: string;
};

export type ProductSectionDTO = {
  title: string;
  slug: string;
  description?: string | null;
  count: number;
  items: ProductDTO[];
};

export type CartItem = ProductDTO & { qty: number };
