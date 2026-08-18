import { api } from "../../lib/api";
import type { Paginated } from "../admin/types";
import type { CreateProjectPayload, ListProjectsParams, Project, UpdateProjectPayload } from "./types";

interface Envelope<T> {
  success: boolean;
  data: T;
}

export async function listProjects(params: ListProjectsParams): Promise<Paginated<Project>> {
  const res = await api.get<Envelope<Paginated<Project>>>("/projects", { params });
  return res.data.data;
}

export async function getProject(id: string): Promise<Project> {
  const res = await api.get<Envelope<Project>>(`/projects/${id}`);
  return res.data.data;
}

export async function createProject(payload: CreateProjectPayload): Promise<Project> {
  const res = await api.post<Envelope<Project>>("/projects", payload);
  return res.data.data;
}

export async function updateProject(id: string, payload: UpdateProjectPayload): Promise<Project> {
  const res = await api.patch<Envelope<Project>>(`/projects/${id}`, payload);
  return res.data.data;
}

export async function deleteProject(id: string): Promise<void> {
  await api.delete(`/projects/${id}`);
}
