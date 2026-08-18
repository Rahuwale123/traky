import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import type { Role } from "../features/auth/types";

function dashboardPathForRole(role: Role) {
  if (role === "ADMIN") return "/admin";
  if (role === "MANAGER") return "/manager";
  return "/employee";
}

export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const user = useAuthStore((s) => s.user);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={dashboardPathForRole(user.role)} replace />;

  return <>{children}</>;
}
