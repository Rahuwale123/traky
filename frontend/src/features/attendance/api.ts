import { api } from "../../lib/api";
import type { Paginated } from "../admin/types";
import type {
  AttendanceLog,
  AttendanceTodaySummary,
  BreakLog,
  ListAttendanceParams,
  TodayAttendance,
} from "./types";

interface Envelope<T> {
  success: boolean;
  data: T;
}

export async function punchIn(): Promise<AttendanceLog> {
  const res = await api.post<Envelope<AttendanceLog>>("/attendance/punch-in");
  return res.data.data;
}

export async function punchOut(): Promise<AttendanceLog> {
  const res = await api.post<Envelope<AttendanceLog>>("/attendance/punch-out");
  return res.data.data;
}

export async function fetchToday(): Promise<TodayAttendance> {
  const res = await api.get<Envelope<TodayAttendance>>("/attendance/today");
  return res.data.data;
}

export async function startBreak(reason?: string): Promise<BreakLog> {
  const res = await api.post<Envelope<BreakLog>>("/attendance/break/start", reason ? { reason } : {});
  return res.data.data;
}

export async function endBreak(): Promise<BreakLog> {
  const res = await api.post<Envelope<BreakLog>>("/attendance/break/end");
  return res.data.data;
}

export async function fetchMyHistory(params: ListAttendanceParams): Promise<Paginated<AttendanceLog>> {
  const res = await api.get<Envelope<Paginated<AttendanceLog>>>("/attendance/me", { params });
  return res.data.data;
}

export async function fetchAttendanceList(params: ListAttendanceParams): Promise<Paginated<AttendanceLog>> {
  const res = await api.get<Envelope<Paginated<AttendanceLog>>>("/attendance", { params });
  return res.data.data;
}

export async function fetchTodaySummary(): Promise<AttendanceTodaySummary> {
  const res = await api.get<Envelope<AttendanceTodaySummary>>("/attendance/today-summary");
  return res.data.data;
}

const EXPORT_PAGE_SIZE = 100;
const EXPORT_MAX_PAGES = 20; // hard cap — 2,000 rows is plenty for a CSV export

/** Fetches every page matching the filters, for CSV export. Caps at EXPORT_MAX_PAGES. */
export async function fetchAllAttendance(
  params: Omit<ListAttendanceParams, "page" | "pageSize">,
): Promise<{ rows: AttendanceLog[]; truncated: boolean }> {
  const rows: AttendanceLog[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const result = await fetchAttendanceList({ ...params, page, pageSize: EXPORT_PAGE_SIZE });
    rows.push(...result.items);
    totalPages = result.pagination.totalPages;
    page += 1;
  } while (page <= totalPages && page <= EXPORT_MAX_PAGES);

  return { rows, truncated: totalPages > EXPORT_MAX_PAGES };
}
