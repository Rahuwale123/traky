export interface Activity {
  id: string;
  organizationId: string;
  actorId: string | null;
  actorName: string;
  type: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface ListActivitiesParams {
  page?: number;
  pageSize?: number;
  entityType?: string;
  type?: string;
}
