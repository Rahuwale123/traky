import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { RequireRole } from "./RequireRole";
import { LoginPage } from "../features/auth/components/LoginPage";
import { RegisterOrgPage } from "../features/auth/components/RegisterOrgPage";
import { ForgotPasswordPage } from "../features/auth/components/ForgotPasswordPage";
import { ResetPasswordPage } from "../features/auth/components/ResetPasswordPage";
import { AdminDashboardPage } from "../features/dashboard/components/AdminDashboardPage";
import { ManagerDashboardPage } from "../features/dashboard/components/ManagerDashboardPage";
import { EmployeeDashboardPage } from "../features/dashboard/components/EmployeeDashboardPage";
import { AdminTeamPage } from "../features/admin/components/AdminTeamPage";
import { AdminOrgPage } from "../features/admin/components/AdminOrgPage";
import { ManagerTeamPage } from "../features/admin/components/ManagerTeamPage";
import { ProjectListPage } from "../features/projects/components/ProjectListPage";
import { ProjectBoardPage } from "../features/projects/components/ProjectBoardPage";
import { MyTasksPage } from "../features/tasks/components/MyTasksPage";
import { AttendancePage } from "../features/attendance/components/AttendancePage";
import { MemberDetailPage } from "../features/admin/components/MemberDetailPage";
import { DailyUpdatesPage } from "../features/daily-updates/components/DailyUpdatesPage";
import { MyUpdatesPage } from "../features/daily-updates/components/MyUpdatesPage";
import { MemberRequestsPage } from "../features/member-requests/components/MemberRequestsPage";
import { ChatPage } from "../features/chat/components/ChatPage";

function HomeRedirect() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "ADMIN") return <Navigate to="/admin" replace />;
  if (user.role === "MANAGER") return <Navigate to="/manager" replace />;
  return <Navigate to="/employee" replace />;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterOrgPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route
        path="/admin"
        element={
          <RequireRole role="ADMIN">
            <AdminDashboardPage />
          </RequireRole>
        }
      />
      <Route
        path="/admin/team"
        element={
          <RequireRole role="ADMIN">
            <AdminTeamPage />
          </RequireRole>
        }
      />
      <Route
        path="/admin/team/:id"
        element={
          <RequireRole role="ADMIN">
            <MemberDetailPage />
          </RequireRole>
        }
      />
      <Route
        path="/admin/organization"
        element={
          <RequireRole role="ADMIN">
            <AdminOrgPage />
          </RequireRole>
        }
      />
      <Route
        path="/admin/attendance"
        element={
          <RequireRole role="ADMIN">
            <AttendancePage />
          </RequireRole>
        }
      />
      <Route
        path="/admin/daily-updates"
        element={
          <RequireRole role="ADMIN">
            <DailyUpdatesPage />
          </RequireRole>
        }
      />
      <Route
        path="/admin/member-requests"
        element={
          <RequireRole role="ADMIN">
            <MemberRequestsPage />
          </RequireRole>
        }
      />
      <Route
        path="/admin/chat"
        element={
          <RequireRole role="ADMIN">
            <ChatPage />
          </RequireRole>
        }
      />

      <Route
        path="/manager"
        element={
          <RequireRole role="MANAGER">
            <ManagerDashboardPage />
          </RequireRole>
        }
      />
      <Route
        path="/manager/projects"
        element={
          <RequireRole role="MANAGER">
            <ProjectListPage />
          </RequireRole>
        }
      />
      <Route
        path="/manager/projects/:id"
        element={
          <RequireRole role="MANAGER">
            <ProjectBoardPage />
          </RequireRole>
        }
      />
      <Route
        path="/manager/team"
        element={
          <RequireRole role="MANAGER">
            <ManagerTeamPage />
          </RequireRole>
        }
      />
      <Route
        path="/manager/team/:id"
        element={
          <RequireRole role="MANAGER">
            <MemberDetailPage />
          </RequireRole>
        }
      />
      <Route
        path="/manager/attendance"
        element={
          <RequireRole role="MANAGER">
            <AttendancePage />
          </RequireRole>
        }
      />
      <Route
        path="/manager/daily-updates"
        element={
          <RequireRole role="MANAGER">
            <DailyUpdatesPage />
          </RequireRole>
        }
      />
      <Route
        path="/manager/member-requests"
        element={
          <RequireRole role="MANAGER">
            <MemberRequestsPage />
          </RequireRole>
        }
      />
      <Route
        path="/manager/chat"
        element={
          <RequireRole role="MANAGER">
            <ChatPage />
          </RequireRole>
        }
      />

      <Route
        path="/employee"
        element={
          <RequireRole role="EMPLOYEE">
            <EmployeeDashboardPage />
          </RequireRole>
        }
      />
      <Route
        path="/employee/tasks"
        element={
          <RequireRole role="EMPLOYEE">
            <MyTasksPage />
          </RequireRole>
        }
      />
      <Route
        path="/employee/updates"
        element={
          <RequireRole role="EMPLOYEE">
            <MyUpdatesPage />
          </RequireRole>
        }
      />
      <Route
        path="/employee/chat"
        element={
          <RequireRole role="EMPLOYEE">
            <ChatPage />
          </RequireRole>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
