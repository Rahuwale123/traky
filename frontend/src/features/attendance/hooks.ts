import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  endBreak,
  fetchAttendanceList,
  fetchMyHistory,
  fetchToday,
  fetchTodaySummary,
  punchIn,
  punchOut,
  startBreak,
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

export function useStartBreak() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason?: string) => startBreak(reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance-today"] }),
  });
}

export function useEndBreak() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: endBreak,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance-today"] }),
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
