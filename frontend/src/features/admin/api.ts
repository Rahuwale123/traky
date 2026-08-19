import { api } from "../../lib/api";
import type {
  CreateEmployeePayload,
  CreateManagerPayload,
  Designation,
  ListUsersParams,
  Organization,
  OrgUser,
  Paginated,
  UpdateOrganizationPayload,
} from "./types";

interface Envelope<T> {
  success: boolean;
  data: T;
}

export async function fetchOrganization(): Promise<Organization> {
  const res = await api.get<Envelope<Organization>>("/organizations/me");
  return res.data.data;
}

export async function updateOrganization(payload: UpdateOrganizationPayload): Promise<Organization> {
  const res = await api.patch<Envelope<Organization>>("/organizations/me", payload);
  return res.data.data;
}

export async function listUsers(params: ListUsersParams): Promise<Paginated<OrgUser>> {
  const res = await api.get<Envelope<Paginated<OrgUser>>>("/users", { params });
  return res.data.data;
}

export async function fetchMyTeam(params: ListUsersParams = {}): Promise<Paginated<OrgUser>> {
  const res = await api.get<Envelope<Paginated<OrgUser>>>("/users/my-team", { params });
  return res.data.data;
}

/** ADMIN only — backend restricts GET /users/:id to admins. */
export async function fetchUser(id: string): Promise<OrgUser> {
  const res = await api.get<Envelope<OrgUser>>(`/users/${id}`);
  return res.data.data;
}

export async function createManager(payload: CreateManagerPayload): Promise<OrgUser> {
  const res = await api.post<Envelope<OrgUser>>("/users/managers", payload);
  return res.data.data;
}

export async function createEmployee(payload: CreateEmployeePayload): Promise<OrgUser> {
  const res = await api.post<Envelope<OrgUser>>("/users/employees", payload);
  return res.data.data;
}

export async function assignManager(userId: string, managerId: string): Promise<OrgUser> {
  const res = await api.patch<Envelope<OrgUser>>(`/users/${userId}/assign-manager`, { managerId });
  return res.data.data;
}

export async function updateUserActive(userId: string, isActive: boolean): Promise<OrgUser> {
  const res = await api.patch<Envelope<OrgUser>>(`/users/${userId}`, { isActive });
  return res.data.data;
}

export async function updateUserDesignation(userId: string, designationId: string | null): Promise<OrgUser> {
  const res = await api.patch<Envelope<OrgUser>>(`/users/${userId}`, { designationId });
  return res.data.data;
}

/** Platform-seeded catalog — read-only, no create/update API. */
export async function fetchDesignations(): Promise<Designation[]> {
  const res = await api.get<Envelope<Designation[]>>("/designations");
  return res.data.data;
}
