import type { Role } from "./constants";

export interface ApiSuccess<T> {
  success: true;
  data: T;
  error: null;
}

export interface ApiError {
  success: false;
  data: null;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface AuthUserContext {
  userId: string;
  organizationId: string;
  role: Role;
  managerId: string | null;
}

declare module "fastify" {
  interface FastifyRequest {
    authUser: AuthUserContext;
  }
}
