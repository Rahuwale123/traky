import type { Role } from "../auth/types";

export interface OrgUser {
  id: string;
  organizationId: string;
  email: string;
  fullName: string;
  role: Role;
  managerId: string | null;
  designationId: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Designation {
  id: string;
  organizationId: string | null;
  name: string;
  category: string;
  isActive: boolean;
}

export interface CreateDesignationPayload {
  name: string;
  category: string;
}

export interface UpdateDesignationPayload {
  name?: string;
  category?: string;
  isActive?: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  createdAt: string;
}

export interface UpdateOrganizationPayload {
  name?: string;
  timezone?: string;
}

export interface Paginated<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateManagerPayload {
  fullName: string;
  email: string;
  password: string;
  designationId?: string;
}

export interface CreateEmployeePayload {
  fullName: string;
  email: string;
  password: string;
  managerId?: string | null;
  designationId?: string;
}

export interface ListUsersParams {
  role?: Role;
  managerId?: string;
  page?: number;
  pageSize?: number;
}
