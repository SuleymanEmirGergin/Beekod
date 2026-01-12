/**
 * API Response Types
 * @module shared/types/api
 */

/**
 * Successful API response wrapper
 */
export type ApiResponse<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

/**
 * Error API response
 */
export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Sort parameters
 */
export interface SortParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Filter parameters
 */
export interface FilterParams {
  search?: string;
  filters?: Record<string, string | number | boolean>;
}
