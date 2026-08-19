import { useQuery } from "@tanstack/react-query";
import { fetchActivities } from "./api";
import type { ListActivitiesParams } from "./types";

export function useActivities(params: ListActivitiesParams = {}) {
  return useQuery({ queryKey: ["activities", params], queryFn: () => fetchActivities(params) });
}
