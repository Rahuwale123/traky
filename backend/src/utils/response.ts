import type { ApiError, ApiSuccess, PaginatedData, PaginationMeta } from "../shared/types";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../shared/constants";

export function ok<T>(data: T): ApiSuccess<T> {
  return { success: true, data, error: null };
}

export function fail(code: string, message: string, details?: unknown): ApiError {
  return { success: false, data: null, error: { code, message, details } };
}

export function paginationMeta(page: number, pageSize: number, total: number): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export function toPaginated<T>(items: T[], page: number, pageSize: number, total: number): PaginatedData<T> {
  return { items, pagination: paginationMeta(page, pageSize, total) };
}

export function normalizePagination(page?: number, pageSize?: number) {
  const safePage = page && page > 0 ? page : 1;
  const safePageSize = pageSize && pageSize > 0 ? Math.min(pageSize, MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;
  const offset = (safePage - 1) * safePageSize;
  return { page: safePage, pageSize: safePageSize, offset };
}
