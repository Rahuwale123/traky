import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { approveResource, createResource, deleteResource, fetchResources, rejectResource } from "./api";
import type { CreateResourcePayload, ListResourcesParams } from "./types";

export function useResources(params: ListResourcesParams = {}) {
  return useQuery({ queryKey: ["knowledge", params], queryFn: () => fetchResources(params) });
}

export function useCreateResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateResourcePayload) => createResource(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["knowledge"] }),
  });
}

export function useApproveResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveResource(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["knowledge"] }),
  });
}

export function useRejectResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => rejectResource(id, note),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["knowledge"] }),
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteResource(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["knowledge"] }),
  });
}
