import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../../../app/layout/AppShell";
import { PageHeader } from "../../../app/layout/PageHeader";
import { managerNavItems } from "../../../app/nav";
import { Card, TintedCard } from "../../../components/ui/Card";
import { DateRangeFilter } from "../../../components/ui/DateRangeFilter";
import { AlertIcon, LayersIcon, ListChecksIcon, UsersIcon } from "../../../components/ui/icons";
import { StatusStackedBar } from "../../../components/charts/StatusStackedBar";
import { ProjectProgressList } from "../../../components/charts/ProjectProgressList";
import { WorkloadBar } from "../../../components/charts/WorkloadBar";
import { useAuthStore } from "../../../stores/authStore";
import { dateRangeSubtitlePhrase, resolveDateRange, type DateRange } from "../../../lib/dateRange";
import { useMyTeam } from "../../admin/hooks";
import { useProjects } from "../../projects/hooks";
import { useTasks } from "../../tasks/hooks";
import { PunchClock } from "../../attendance/components/PunchClock";
import { EodUpdateWidget } from "../../daily-updates/components/EodUpdateWidget";
import { countByStatus, filterTasksByRange, overdueCount, projectProgress, workloadByAssignee } from "../statsUtils";

export function ManagerDashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const projects = useProjects({ pageSize: 100 });
  const tasks = useTasks({ pageSize: 200 });
  const team = useMyTeam({ pageSize: 100 });

  const [range, setRange] = useState<DateRange>({ preset: "all" });

  const taskItems = tasks.data?.items ?? [];
  const projectItems = projects.data?.items ?? [];
  const teamItems = team.data?.items ?? [];
  const scopedTasks = filterTasksByRange(taskItems, resolveDateRange(range));
  const rangePhrase = dateRangeSubtitlePhrase(range);

  return (
    <AppShell navItems={managerNavItems}>
      <PageHeader crumbs={["Home", "Dashboard"]} title={`Welcome back, ${user?.fullName.split(" ")[0] ?? ""}`} />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PunchClock />
        <EodUpdateWidget />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TintedCard
          tone="lavender"
          eyebrowIcon={<LayersIcon width={14} height={14} />}
          eyebrow="Projects"
          title={projects.data?.pagination.total ?? "—"}
        />
        <TintedCard
          tone="dark"
          eyebrowIcon={<ListChecksIcon width={14} height={14} />}
          eyebrow="Open tasks"
          title={tasks.data?.pagination.total ?? "—"}
        />
        <TintedCard
          tone="rose"
          eyebrowIcon={<UsersIcon width={14} height={14} />}
          eyebrow="Team members"
          title={team.data?.pagination.total ?? "—"}
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
          <h2 className="text-lg font-bold text-ink">Task status — your team</h2>
          <p className="mt-1 text-sm text-muted">Your team's tasks touched {rangePhrase}, by status.</p>
          <div className="mt-5">
            <StatusStackedBar counts={countByStatus(scopedTasks)} />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-ink">Team workload</h2>
          <p className="mt-1 text-sm text-muted">Who's carrying the most assigned tasks {rangePhrase}.</p>
          <div className="mt-5">
            <WorkloadBar
              rows={workloadByAssignee(scopedTasks, teamItems)}
              onRowClick={(id) => navigate(`/manager/team/${id}`)}
            />
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-lg font-bold text-ink">Project progress</h2>
        <p className="mt-1 text-sm text-muted">Share of tasks completed per project.</p>
        <div className="mt-5">
          <ProjectProgressList rows={projectProgress(projectItems, taskItems)} />
        </div>
      </Card>

      <div className="mt-6 rounded-3xl border border-black/5 bg-white p-6">
        <h2 className="text-lg font-bold text-ink">Getting started</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm text-ink-soft">
          <li>• Create a project, then open its board to add tasks.</li>
          <li>• Assign tasks to members of your own team only.</li>
          <li>• Track progress as employees move tasks across the board.</li>
        </ul>
      </div>
    </AppShell>
  );
}
