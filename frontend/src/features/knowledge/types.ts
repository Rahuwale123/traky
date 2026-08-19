export type ResourceScope = "GLOBAL" | "TEAM" | "PROJECT";
export type ResourceStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface KnowledgeResource {
  id: string;
  organizationId: string;
  title: string;
  url: string;
  description: string | null;
  scope: ResourceScope;
  teamManagerId: string | null;
  teamManagerName: string | null;
  projectId: string | null;
  projectName: string | null;
  status: ResourceStatus;
  createdById: string;
  createdByName: string;
  approvedById: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  rejectionNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateResourcePayload =
  | { scope: "GLOBAL"; title: string; url: string; description?: string }
  | { scope: "TEAM"; title: string; url: string; description?: string; teamManagerId?: string }
  | { scope: "PROJECT"; title: string; url: string; description?: string; projectId: string };

export interface ListResourcesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ResourceStatus;
  scope?: ResourceScope;
  projectId?: string;
}
