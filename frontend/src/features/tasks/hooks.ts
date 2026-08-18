import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addComment,
  createTask,
  deleteTask,
  listComments,
  listMyTasks,
  listTasks,
  updateTask,
  updateTaskStatus,
} from "./api";
import type { CreateTaskPayload, ListTasksParams, TaskStatus, UpdateTaskPayload } from "./types";

export function useTasks(params: ListTasksParams = {}) {
  return useQuery({ queryKey: ["tasks", params], queryFn: () => listTasks(params) });
}

export function useMyTasks(params: ListTasksParams = {}) {
  return useQuery({ queryKey: ["my-tasks", params], queryFn: () => listMyTasks(params) });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => createTask(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTaskPayload }) => updateTask(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTaskStatus(invalidateKey: "tasks" | "my-tasks" = "tasks") {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => updateTaskStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [invalidateKey] }),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useComments(taskId: string | undefined) {
  return useQuery({
    queryKey: ["task-comments", taskId],
    queryFn: () => listComments(taskId as string),
    enabled: Boolean(taskId),
  });
}

export function useAddComment(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => addComment(taskId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["task-comments", taskId] }),
  });
}
