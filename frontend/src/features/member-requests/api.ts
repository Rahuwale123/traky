import { api } from "../../lib/api";
import type { Paginated } from "../admin/types";
import type {
  CreateMemberRequestPayload,
  ListMemberRequestsParams,
  MemberRequest,
  RespondMemberRequestPayload,
} from "./types";

interface Envelope<T> {
  success: boolean;
  data: T;
}

export async function createMemberRequest(payload: CreateMemberRequestPayload): Promise<MemberRequest> {
  const res = await api.post<Envelope<MemberRequest>>("/member-requests", payload);
  return res.data.data;
}

export async function listMemberRequests(params: ListMemberRequestsParams): Promise<Paginated<MemberRequest>> {
  const res = await api.get<Envelope<Paginated<MemberRequest>>>("/member-requests", { params });
  return res.data.data;
}

export async function respondMemberRequest(id: string, payload: RespondMemberRequestPayload): Promise<MemberRequest> {
  const res = await api.patch<Envelope<MemberRequest>>(`/member-requests/${id}`, payload);
  return res.data.data;
}
