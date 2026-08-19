import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignManager,
  createDesignation,
  createEmployee,
  createManager,
  fetchDesignations,
  fetchMyTeam,
  fetchOrganization,
  fetchUser,
  listUsers,
  updateDesignation,
  updateOrganization,
  updateUserActive,
  updateUserDesignation,
} from "./api";
import type {
  CreateDesignationPayload,
  CreateEmployeePayload,
  CreateManagerPayload,
  ListUsersParams,
  UpdateDesignationPayload,
  UpdateOrganizationPayload,
} from "./types";

export function useOrganization() {
  return useQuery({ queryKey: ["organization"], queryFn: fetchOrganization });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateOrganizationPayload) => updateOrganization(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["organization"] }),
  });
}

export function useUsers(params: ListUsersParams, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => listUsers(params),
    enabled: options.enabled ?? true,
  });
}

export function useMyTeam(params: ListUsersParams = {}) {
  return useQuery({ queryKey: ["my-team", params], queryFn: () => fetchMyTeam(params) });
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => fetchUser(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateManager() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateManagerPayload) => createManager(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEmployeePayload) => createEmployee(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["my-team"] });
    },
  });
}

export function useAssignManager() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, managerId }: { userId: string; managerId: string }) => assignManager(userId, managerId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUpdateUserActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) => updateUserActive(userId, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUpdateUserDesignation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, designationId }: { userId: string; designationId: string | null }) =>
      updateUserDesignation(userId, designationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["my-team"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}

/** Rarely changes — cache aggressively. Pass includeInactive for the admin management view. */
export function useDesignations(options: { includeInactive?: boolean } = {}) {
  return useQuery({
    queryKey: ["designations", options],
    queryFn: () => fetchDesignations(options),
    staleTime: 5 * 60_000,
  });
}

export function useCreateDesignation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDesignationPayload) => createDesignation(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["designations"] }),
  });
}

export function useUpdateDesignation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDesignationPayload }) => updateDesignation(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["designations"] }),
  });
}
