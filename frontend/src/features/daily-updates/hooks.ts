import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchMyUpdateHistory,
  fetchTodayUpdate,
  fetchUpdatesList,
  fetchUpdatesTodaySummary,
  upsertTodayUpdate,
} from "./api";
import type { ListDailyUpdatesParams, UpsertTodayUpdatePayload } from "./types";

export function useTodayUpdate() {
  return useQuery({ queryKey: ["daily-update-today"], queryFn: fetchTodayUpdate });
}

export function useUpsertTodayUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertTodayUpdatePayload) => upsertTodayUpdate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-update-today"] });
      queryClient.invalidateQueries({ queryKey: ["daily-updates-today-summary"] });
      queryClient.invalidateQueries({ queryKey: ["daily-updates-history"] });
    },
  });
}

export function useMyUpdateHistory(params: ListDailyUpdatesParams = {}) {
  return useQuery({ queryKey: ["daily-updates-history", params], queryFn: () => fetchMyUpdateHistory(params) });
}

export function useUpdatesList(params: ListDailyUpdatesParams = {}) {
  return useQuery({ queryKey: ["daily-updates-list", params], queryFn: () => fetchUpdatesList(params) });
}

export function useUpdatesTodaySummary() {
  return useQuery({
    queryKey: ["daily-updates-today-summary"],
    queryFn: fetchUpdatesTodaySummary,
    refetchInterval: 60_000,
  });
}
