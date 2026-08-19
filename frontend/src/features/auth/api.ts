import { api } from "../../lib/api";
import type { AuthSession, LoginPayload, RegisterOrgPayload } from "./types";

interface Envelope<T> {
  success: boolean;
  data: T;
  error: null;
}

export async function login(payload: LoginPayload): Promise<AuthSession> {
  const res = await api.post<Envelope<AuthSession>>("/auth/login", payload);
  return res.data.data;
}

export async function registerOrg(payload: RegisterOrgPayload): Promise<AuthSession> {
  const res = await api.post<Envelope<AuthSession>>("/auth/register-org", payload);
  return res.data.data;
}

export async function refreshSession(): Promise<AuthSession | null> {
  try {
    const res = await api.post<Envelope<AuthSession>>("/auth/refresh");
    return res.data.data;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post("/auth/forgot-password", { email });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await api.post("/auth/reset-password", { token, newPassword });
}
