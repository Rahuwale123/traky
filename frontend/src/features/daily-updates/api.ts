import { api } from "../../lib/api";
import type { Paginated } from "../admin/types";
import type {
  DailyUpdate,
  DailyUpdateTodaySummary,
  ListDailyUpdatesParams,
  UpsertTodayUpdatePayload,
} from "./types";

interface Envelope<T> {
  success: boolean;
  data: T;
}

export async function upsertTodayUpdate(payload: UpsertTodayUpdatePayload): Promise<DailyUpdate> {
  const res = await api.put<Envelope<DailyUpdate>>("/daily-updates/today", payload);
  return res.data.data;
}

export async function fetchTodayUpdate(): Promise<DailyUpdate | null> {
  const res = await api.get<Envelope<DailyUpdate | null>>("/daily-updates/today");
  return res.data.data;
}

export async function fetchMyUpdateHistory(params: ListDailyUpdatesParams): Promise<Paginated<DailyUpdate>> {
  const res = await api.get<Envelope<Paginated<DailyUpdate>>>("/daily-updates/me", { params });
  return res.data.data;
}

export async function fetchUpdatesList(params: ListDailyUpdatesParams): Promise<Paginated<DailyUpdate>> {
  const res = await api.get<Envelope<Paginated<DailyUpdate>>>("/daily-updates", { params });
  return res.data.data;
}

export async function fetchUpdatesTodaySummary(): Promise<DailyUpdateTodaySummary> {
  const res = await api.get<Envelope<DailyUpdateTodaySummary>>("/daily-updates/today-summary");
  return res.data.data;
}

const EXPORT_PAGE_SIZE = 100;
const EXPORT_MAX_PAGES = 20;

export async function fetchAllUpdates(
  params: Omit<ListDailyUpdatesParams, "page" | "pageSize">,
): Promise<{ rows: DailyUpdate[]; truncated: boolean }> {
  const rows: DailyUpdate[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const result = await fetchUpdatesList({ ...params, page, pageSize: EXPORT_PAGE_SIZE });
    rows.push(...result.items);
    totalPages = result.pagination.totalPages;
    page += 1;
  } while (page <= totalPages && page <= EXPORT_MAX_PAGES);

  return { rows, truncated: totalPages > EXPORT_MAX_PAGES };
}
