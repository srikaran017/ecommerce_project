export interface PublicCollectionProductPrice {
  regular?: number;
  regularPrice?: number;
  sale?: number | null;
  salePrice?: number | null;
  offer?: number | null;
  effective?: number;
  effectivePrice?: number;
  discountPercentage?: number;
  onSale?: boolean;
}

export interface PublicCollectionProduct {
  id: string;
  name: string;
  slug: string;
  brand: string;
  thumbnail: string;
  price: PublicCollectionProductPrice;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  sortOrder: number;
}

export interface PublicCollectionSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isFeatured: boolean;
  sortOrder: number;
  productsCount: number;
}

export interface PublicCollectionDetail extends PublicCollectionSummary {
  products: PublicCollectionProduct[];
}

export interface CollectionsListResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  data: PublicCollectionSummary[];
}

export interface CollectionDetailResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  data: PublicCollectionDetail;
}
