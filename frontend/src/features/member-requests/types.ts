export type MemberRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface MemberRequest {
  id: string;
  organizationId: string;
  managerId: string;
  designationId: string | null;
  note: string;
  status: MemberRequestStatus;
  respondedById: string | null;
  respondedAt: string | null;
  responseNote: string | null;
  createdAt: string;
}

export interface CreateMemberRequestPayload {
  designationId?: string;
  note: string;
}

export interface RespondMemberRequestPayload {
  status: "APPROVED" | "REJECTED";
  responseNote?: string;
}

export interface ListMemberRequestsParams {
  status?: MemberRequestStatus;
  page?: number;
  pageSize?: number;
}
