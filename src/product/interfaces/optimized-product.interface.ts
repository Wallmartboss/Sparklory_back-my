import { Product } from '../schema/product.schema';

export interface OptimizedProductResult {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
  executionTime: number;
  cacheHit: boolean;
  products: Product[];
}

export interface BulkProductResult {
  products: Product[];
  found: number;
  notFound: string[];
  executionTime: number;
  cacheHit: boolean;
}

export interface ProductProjection {
  _id: 1;
  name?: 1;
  description?: 1;
  category?: 1;
  subcategory?: 1;
  gender?: 1;
  image?: 1;
  action?: 1;
  discount?: 1;
  discountStart?: 1;
  discountEnd?: 1;
  prod_collection?: 1;
  variants?: 1;
  reviews?: 1;
  details?: 1;
  engraving?: 1;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  key: string;
}

export interface QueryOptimizationOptions {
  useCache: boolean;
  cacheTtl?: number;
  projection?: ProductProjection;
  lean?: boolean;
  populate?: string[];
}
