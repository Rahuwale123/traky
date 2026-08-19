import { api } from "../../lib/api";
import type { Paginated } from "../admin/types";
import type { CreateResourcePayload, KnowledgeResource, ListResourcesParams } from "./types";

interface Envelope<T> {
  success: boolean;
  data: T;
}

export async function fetchResources(params: ListResourcesParams = {}): Promise<Paginated<KnowledgeResource>> {
  const res = await api.get<Envelope<Paginated<KnowledgeResource>>>("/knowledge", { params });
  return res.data.data;
}

export async function createResource(payload: CreateResourcePayload): Promise<KnowledgeResource> {
  const res = await api.post<Envelope<KnowledgeResource>>("/knowledge", payload);
  return res.data.data;
}

export async function approveResource(id: string): Promise<KnowledgeResource> {
  const res = await api.post<Envelope<KnowledgeResource>>(`/knowledge/${id}/approve`);
  return res.data.data;
}

export async function rejectResource(id: string, note?: string): Promise<KnowledgeResource> {
  const res = await api.post<Envelope<KnowledgeResource>>(`/knowledge/${id}/reject`, note ? { note } : {});
  return res.data.data;
}

export async function deleteResource(id: string): Promise<void> {
  await api.delete(`/knowledge/${id}`);
}
