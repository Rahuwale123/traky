import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../../../app/layout/AppShell";
import { PageHeader } from "../../../app/layout/PageHeader";
import { adminNavItems } from "../../../app/nav";
import { Card, TintedCard } from "../../../components/ui/Card";
import { DateRangeFilter } from "../../../components/ui/DateRangeFilter";
import { AlertIcon, BuildingIcon, ListChecksIcon, UsersIcon } from "../../../components/ui/icons";
import { StatusStackedBar } from "../../../components/charts/StatusStackedBar";
import { ProjectProgressList } from "../../../components/charts/ProjectProgressList";
import { WorkloadBar } from "../../../components/charts/WorkloadBar";
import { useAuthStore } from "../../../stores/authStore";
import { dateRangeSubtitlePhrase, resolveDateRange, type DateRange } from "../../../lib/dateRange";
import { useOrganization, useUsers } from "../../admin/hooks";
import { useProjects } from "../../projects/hooks";
import { useTasks } from "../../tasks/hooks";
import { PunchClock } from "../../attendance/components/PunchClock";
import { countByStatus, filterTasksByRange, overdueCount, projectProgress, workloadByAssignee } from "../statsUtils";

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const org = useOrganization();
  const managers = useUsers({ role: "MANAGER", pageSize: 100 });
  const employees = useUsers({ role: "EMPLOYEE", pageSize: 100 });
  const projects = useProjects({ pageSize: 100 });
  const tasks = useTasks({ pageSize: 200 });

  const [range, setRange] = useState<DateRange>({ preset: "all" });

  const taskItems = tasks.data?.items ?? [];
  const projectItems = projects.data?.items ?? [];
  const employeeItems = employees.data?.items ?? [];
  const scopedTasks = filterTasksByRange(taskItems, resolveDateRange(range));
  const rangePhrase = dateRangeSubtitlePhrase(range);

  return (
    <AppShell navItems={adminNavItems}>
      <PageHeader crumbs={["Home", "Dashboard"]} title={`Welcome back, ${user?.fullName.split(" ")[0] ?? ""}`} />

      <div className="mb-6">
        <PunchClock />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TintedCard
          tone="lavender"
          eyebrowIcon={<BuildingIcon width={14} height={14} />}
          eyebrow="Organization"
          title={org.data?.name ?? "—"}
        />
        <TintedCard
          tone="dark"
          eyebrowIcon={<UsersIcon width={14} height={14} />}
          eyebrow="Managers"
          title={managers.data?.pagination.total ?? "—"}
        />
        <TintedCard
          tone="rose"
          eyebrowIcon={<ListChecksIcon width={14} height={14} />}
          eyebrow="Employees"
          title={employees.data?.pagination.total ?? "—"}
        />
        <TintedCard
          tone="critical"
          eyebrowIcon={<AlertIcon width={14} height={14} />}
          eyebrow="Overdue tasks"
          title={overdueCount(taskItems)}
        />
      </div>

      <div className="mt-6">
        <DateRangeFilter value={range} onChange={setRange} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="text-lg font-bold text-ink">Task status — org-wide</h2>
          <p className="mt-1 text-sm text-muted">Tasks touched {rangePhrase}, by status.</p>
          <div className="mt-5">
            <StatusStackedBar counts={countByStatus(scopedTasks)} />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-ink">Team workload</h2>
          <p className="mt-1 text-sm text-muted">Employees with the most assigned tasks {rangePhrase}.</p>
          <div className="mt-5">
            <WorkloadBar
              rows={workloadByAssignee(scopedTasks, employeeItems)}
              onRowClick={(id) => navigate(`/admin/team/${id}`)}
            />
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-lg font-bold text-ink">Project progress</h2>
        <p className="mt-1 text-sm text-muted">Share of tasks completed per project, across the org.</p>
        <div className="mt-5">
          <ProjectProgressList rows={projectProgress(projectItems, taskItems)} />
        </div>
      </Card>

      <div className="mt-6 rounded-3xl border border-black/5 bg-white p-6">
        <h2 className="text-lg font-bold text-ink">Getting started</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm text-ink-soft">
          <li>• Add managers from the Team page, then assign employees to them.</li>
          <li>• Managers create projects and assign tasks to their own team.</li>
          <li>• Employees track and update their tasks from their dashboard.</li>
        </ul>
      </div>
    </AppShell>
  );
}
