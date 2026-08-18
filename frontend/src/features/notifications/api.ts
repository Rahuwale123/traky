import { api } from "../../lib/api";
import type { Paginated } from "../admin/types";
import type { AppNotification, ListNotificationsParams } from "./types";

interface Envelope<T> {
  success: boolean;
  data: T;
}

export async function fetchNotifications(params: ListNotificationsParams): Promise<Paginated<AppNotification>> {
  const res = await api.get<Envelope<Paginated<AppNotification>>>("/notifications", { params });
  return res.data.data;
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await api.get<Envelope<{ count: number }>>("/notifications/unread-count");
  return res.data.data.count;
}

export async function markNotificationRead(id: string): Promise<AppNotification> {
  const res = await api.post<Envelope<AppNotification>>(`/notifications/${id}/read`);
  return res.data.data;
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post("/notifications/read-all");
}
