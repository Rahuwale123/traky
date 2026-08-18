export type Role = "ADMIN" | "MANAGER" | "EMPLOYEE";

export interface AuthUser {
  id: string;
  organizationId: string;
  email: string;
  fullName: string;
  role: Role;
  managerId: string | null;
  designationId: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterOrgPayload {
  organizationName: string;
  adminFullName: string;
  adminEmail: string;
  adminPassword: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
}
