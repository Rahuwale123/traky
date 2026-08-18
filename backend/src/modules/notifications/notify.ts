import { eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { notifications, users } from "../../db/schema/index";

export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_STATUS_CHANGED"
  | "TASK_COMMENT"
  | "MEMBER_ASSIGNED"
  | "MEMBER_REQUEST_CREATED"
  | "MEMBER_REQUEST_RESPONDED";

interface NotifyParams {
  organizationId: string;
  recipientId: string;
  actorId: string;
  type: NotificationType;
  title: string;
  body?: string;
  entityType?: string;
  entityId?: string;
}

export async function getActorName(db: Database, userId: string): Promise<string> {
  const actor = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { fullName: true } });
  return actor?.fullName ?? "Someone";
}

/** Fire-and-forget style helper — callers await it, but a notification is never load-bearing for the primary action. */
export async function notify(db: Database, params: NotifyParams) {
  if (params.recipientId === params.actorId) return; // never notify yourself

  await db.insert(notifications).values({
    organizationId: params.organizationId,
    recipientId: params.recipientId,
    actorId: params.actorId,
    type: params.type,
    title: params.title,
    body: params.body ?? null,
    entityType: params.entityType ?? null,
    entityId: params.entityId ?? null,
  });
}
