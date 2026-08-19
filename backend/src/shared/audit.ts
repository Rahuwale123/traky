import type { Database } from "../db/client";
import { activities } from "../db/schema/index";

export type ActivityType =
  | "USER_CREATED"
  | "USER_DEACTIVATED"
  | "USER_REACTIVATED"
  | "USER_DESIGNATION_CHANGED"
  | "USER_MANAGER_ASSIGNED"
  | "PROJECT_CREATED"
  | "PROJECT_STATUS_CHANGED"
  | "PROJECT_DELETED"
  | "TASK_CREATED"
  | "TASK_STATUS_CHANGED"
  | "TASK_ASSIGNED"
  | "TASK_DELETED"
  | "MEMBER_REQUEST_CREATED"
  | "MEMBER_REQUEST_RESPONDED"
  | "DESIGNATION_CREATED"
  | "DESIGNATION_UPDATED"
  | "ORGANIZATION_UPDATED";

interface RecordActivityParams {
  organizationId: string;
  actorId: string;
  type: ActivityType;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

/** Admin-facing audit trail — distinct from `notify()`, which is for the affected user's own inbox. */
export async function recordActivity(db: Database, params: RecordActivityParams) {
  await db.insert(activities).values({
    organizationId: params.organizationId,
    actorId: params.actorId,
    type: params.type,
    entityType: params.entityType,
    entityId: params.entityId,
    metadata: params.metadata ?? null,
  });
}
