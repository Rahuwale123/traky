import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAttendanceList,
  fetchMyHistory,
  fetchToday,
  fetchTodaySummary,
  punchIn,
  punchOut,
} from "./api";
import type { ListAttendanceParams } from "./types";

export function useTodayAttendance() {
  return useQuery({ queryKey: ["attendance-today"], queryFn: fetchToday, refetchInterval: 60_000 });
}

export function usePunchIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: punchIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-today"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-today-summary"] });
    },
  });
}

export function usePunchOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: punchOut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-today"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-today-summary"] });
    },
  });
}

export function useMyAttendanceHistory(params: ListAttendanceParams = {}) {
  return useQuery({ queryKey: ["attendance-history", params], queryFn: () => fetchMyHistory(params) });
}

export function useAttendanceList(params: ListAttendanceParams = {}) {
  return useQuery({ queryKey: ["attendance-list", params], queryFn: () => fetchAttendanceList(params) });
}

export function useAttendanceTodaySummary() {
  return useQuery({
    queryKey: ["attendance-today-summary"],
    queryFn: fetchTodaySummary,
    refetchInterval: 60_000,
  });
}
