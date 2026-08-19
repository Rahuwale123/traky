import { api } from "../../lib/api";
import type { Paginated } from "../admin/types";
import type { Activity, ListActivitiesParams } from "./types";

interface Envelope<T> {
  success: boolean;
  data: T;
}

export async function fetchActivities(params: ListActivitiesParams = {}): Promise<Paginated<Activity>> {
  const res = await api.get<Envelope<Paginated<Activity>>>("/activities", { params });
  return res.data.data;
}
