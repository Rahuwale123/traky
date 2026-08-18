import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createMemberRequest, listMemberRequests, respondMemberRequest } from "./api";
import type { CreateMemberRequestPayload, ListMemberRequestsParams, RespondMemberRequestPayload } from "./types";

export function useMemberRequests(params: ListMemberRequestsParams = {}) {
  return useQuery({ queryKey: ["member-requests", params], queryFn: () => listMemberRequests(params) });
}

export function useCreateMemberRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMemberRequestPayload) => createMemberRequest(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["member-requests"] }),
  });
}

export function useRespondMemberRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RespondMemberRequestPayload }) =>
      respondMemberRequest(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["member-requests"] }),
  });
}
