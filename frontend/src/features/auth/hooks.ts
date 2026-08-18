import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { login, logout, registerOrg } from "./api";
import { useAuthStore } from "../../stores/authStore";
import type { LoginPayload, RegisterOrgPayload } from "./types";

function dashboardPathForRole(role: string) {
  if (role === "ADMIN") return "/admin";
  if (role === "MANAGER") return "/manager";
  return "/employee";
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: (session) => {
      setSession(session.user, session.accessToken);
      navigate(dashboardPathForRole(session.user.role), { replace: true });
    },
  });
}

export function useRegisterOrg() {
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: RegisterOrgPayload) => registerOrg(payload),
    onSuccess: (session) => {
      setSession(session.user, session.accessToken);
      navigate(dashboardPathForRole(session.user.role), { replace: true });
    },
  });
}

export function useLogout() {
  const clearSession = useAuthStore((s) => s.clearSession);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      clearSession();
      queryClient.clear();
      navigate("/login", { replace: true });
    },
  });
}
