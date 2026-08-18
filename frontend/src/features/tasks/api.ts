import { api } from "../../lib/api";
import type { Paginated } from "../admin/types";
import type { CreateTaskPayload, ListTasksParams, Task, TaskComment, TaskStatus, UpdateTaskPayload } from "./types";

interface Envelope<T> {
  success: boolean;
  data: T;
}

export async function listTasks(params: ListTasksParams): Promise<Paginated<Task>> {
  const res = await api.get<Envelope<Paginated<Task>>>("/tasks", { params });
  return res.data.data;
}

export async function listMyTasks(params: ListTasksParams): Promise<Paginated<Task>> {
  const res = await api.get<Envelope<Paginated<Task>>>("/tasks/my-tasks", { params });
  return res.data.data;
}

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  const res = await api.post<Envelope<Task>>("/tasks", payload);
  return res.data.data;
}

export async function updateTask(id: string, payload: UpdateTaskPayload): Promise<Task> {
  const res = await api.patch<Envelope<Task>>(`/tasks/${id}`, payload);
  return res.data.data;
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
  const res = await api.patch<Envelope<Task>>(`/tasks/${id}/status`, { status });
  return res.data.data;
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/tasks/${id}`);
}

export async function listComments(taskId: string): Promise<TaskComment[]> {
  const res = await api.get<Envelope<TaskComment[]>>(`/tasks/${taskId}/comments`);
  return res.data.data;
}

export async function addComment(taskId: string, body: string): Promise<TaskComment> {
  const res = await api.post<Envelope<TaskComment>>(`/tasks/${taskId}/comments`, { body });
  return res.data.data;
}
