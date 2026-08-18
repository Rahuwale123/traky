import { useState } from "react";
import { AppShell } from "../../../app/layout/AppShell";
import { PageHeader } from "../../../app/layout/PageHeader";
import { employeeNavItems } from "../../../app/nav";
import { Card, TintedCard } from "../../../components/ui/Card";
import { DateRangeFilter } from "../../../components/ui/DateRangeFilter";
import { AlertIcon, ListChecksIcon, TaskIcon } from "../../../components/ui/icons";
import { StatusStackedBar } from "../../../components/charts/StatusStackedBar";
import { UpcomingDueList } from "../../../components/charts/UpcomingDueList";
import { useAuthStore } from "../../../stores/authStore";
import { dateRangeSubtitlePhrase, resolveDateRange, type DateRange } from "../../../lib/dateRange";
import { useMyTasks } from "../../tasks/hooks";
import { PunchClock } from "../../attendance/components/PunchClock";
import { EodUpdateWidget } from "../../daily-updates/components/EodUpdateWidget";
import { countByStatus, filterTasksByRange, overdueCount } from "../statsUtils";

export function EmployeeDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const myTasks = useMyTasks({ pageSize: 100 });

  const [range, setRange] = useState<DateRange>({ preset: "all" });

  const items = myTasks.data?.items ?? [];
  const inProgress = items.filter((t) => t.status === "IN_PROGRESS").length;
  const done = items.filter((t) => t.status === "DONE").length;
  const scopedItems = filterTasksByRange(items, resolveDateRange(range));
  const rangePhrase = dateRangeSubtitlePhrase(range);

  return (
    <AppShell navItems={employeeNavItems}>
      <PageHeader crumbs={["Home", "Dashboard"]} title={`Welcome back, ${user?.fullName.split(" ")[0] ?? ""}`} />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PunchClock />
        <EodUpdateWidget />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TintedCard
          tone="lavender"
          eyebrowIcon={<ListChecksIcon width={14} height={14} />}
          eyebrow="Assigned tasks"
          title={myTasks.data?.pagination.total ?? "—"}
        />
        <TintedCard
          tone="dark"
          eyebrowIcon={<TaskIcon width={14} height={14} />}
          eyebrow="In progress"
          title={inProgress}
        />
        <TintedCard
          tone="rose"
          eyebrowIcon={<TaskIcon width={14} height={14} />}
          eyebrow="Completed"
          title={done}
        />
        <TintedCard
          tone="critical"
          eyebrowIcon={<AlertIcon width={14} height={14} />}
          eyebrow="Overdue"
          title={overdueCount(items)}
        />
      </div>

      <div className="mt-6">
        <DateRangeFilter value={range} onChange={setRange} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="text-lg font-bold text-ink">My tasks by status</h2>
          <p className="mt-1 text-sm text-muted">Tasks touched {rangePhrase}, by status.</p>
          <div className="mt-5">
            <StatusStackedBar counts={countByStatus(scopedItems)} />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-ink">Upcoming due dates</h2>
          <p className="mt-1 text-sm text-muted">Your next deadlines, soonest first.</p>
          <div className="mt-5">
            <UpcomingDueList tasks={items} />
          </div>
        </Card>
      </div>

      <div className="mt-6 rounded-3xl border border-black/5 bg-white p-6">
        <h2 className="text-lg font-bold text-ink">Getting started</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm text-ink-soft">
          <li>• Head to My Tasks to see everything assigned to you.</li>
          <li>• Move a task's status as you make progress on it.</li>
          <li>• Leave a comment on a task to keep your manager updated.</li>
        </ul>
      </div>
    </AppShell>
  );
}
