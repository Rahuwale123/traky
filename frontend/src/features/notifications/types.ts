export type NotificationType = "TASK_ASSIGNED" | "TASK_STATUS_CHANGED" | "TASK_COMMENT" | "MEMBER_ASSIGNED";

export interface AppNotification {
  id: string;
  organizationId: string;
  recipientId: string;
  actorId: string | null;
  type: NotificationType;
  title: string;
  body: string | null;
  entityType: string | null;
  entityId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface ListNotificationsParams {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
}
