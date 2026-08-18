import { useState } from "react";
import { AppShell } from "../../../app/layout/AppShell";
import { PageHeader } from "../../../app/layout/PageHeader";
import { adminNavItems, managerNavItems } from "../../../app/nav";
import { Card, TintedCard } from "../../../components/ui/Card";
import { Avatar } from "../../../components/ui/Avatar";
import { DotStatus } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Select } from "../../../components/ui/Select";
import { DateRangeFilter } from "../../../components/ui/DateRangeFilter";
import { EmptyState, TBody, THead, Table, Td, Th, Tr } from "../../../components/ui/Table";
import { DownloadIcon, NoteIcon, UsersIcon } from "../../../components/ui/icons";
import { formatDate } from "../../../lib/utils";
import { toCSV, downloadCSV } from "../../../lib/csv";
import { resolveDateRange, type DateRange } from "../../../lib/dateRange";
import { useAuthStore } from "../../../stores/authStore";
import { useMyTeam, useUsers } from "../../admin/hooks";
import { fetchAllUpdates } from "../api";
import { useUpdatesList, useUpdatesTodaySummary } from "../hooks";

export function DailyUpdatesPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";
  const navItems = isAdmin ? adminNavItems : managerNavItems;

  const orgUsers = useUsers({ pageSize: 100 }, { enabled: isAdmin });
  const myTeam = useMyTeam({ pageSize: 100 });
  const summary = useUpdatesTodaySummary();

  const [range, setRange] = useState<DateRange>({ preset: "month" });
  const [personId, setPersonId] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);

  const resolved = resolveDateRange(range);
  const filterParams = {
    userId: personId || undefined,
    startDate: resolved?.start,
    endDate: resolved?.end,
  };
  const log = useUpdatesList({ ...filterParams, pageSize: 50 });

  const nameById = new Map<string, string>();
  const people = isAdmin ? (orgUsers.data?.items ?? []) : (myTeam.data?.items ?? []);
  people.forEach((u) => nameById.set(u.id, u.fullName));
  if (!isAdmin && user) nameById.set(user.id, user.fullName);

  const filterablePeople = isAdmin
    ? people.filter((u) => u.role === "MANAGER" || u.role === "EMPLOYEE")
    : [...(user ? [{ id: user.id, fullName: user.fullName }] : []), ...people];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { rows, truncated } = await fetchAllUpdates(filterParams);
      const csv = toCSV(
        ["Name", "Date", "Summary", "Blockers", "Plan for tomorrow"],
        rows.map((r) => [
          nameById.get(r.userId) ?? "Unknown",
          formatDate(r.date),
          r.summary,
          r.blockers ?? "",
          r.planForTomorrow ?? "",
        ]),
      );
      downloadCSV(`daily-updates-${new Date().toISOString().slice(0, 10)}.csv`, csv);
      if (truncated) {
        // eslint-disable-next-line no-alert
        alert("Export capped at 2,000 rows — narrow the date range for a complete export.");
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AppShell navItems={navItems}>
      <PageHeader crumbs={["Home", "Daily Updates"]} title="Daily Updates" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TintedCard
          tone="lavender"
          eyebrowIcon={<NoteIcon width={14} height={14} />}
          eyebrow="Submission rate today"
          title={`${summary.data?.rate ?? 0}%`}
        />
        <TintedCard
          tone="dark"
          eyebrowIcon={<UsersIcon width={14} height={14} />}
          eyebrow="Submitted today"
          title={summary.data?.submittedCount ?? 0}
        />
        <TintedCard
          tone="rose"
          eyebrowIcon={<UsersIcon width={14} height={14} />}
          eyebrow="Team size"
          title={summary.data?.totalPeople ?? 0}
        />
      </div>

      <Card className="mt-6">
        <h2 className="text-lg font-bold text-ink">Today</h2>
        <p className="mt-1 text-sm text-muted">
          Who's filed their EOD update {isAdmin ? "across the org" : "on your team"} today.
        </p>
        <div className="mt-5">
          <Table>
            <THead>
              <Tr>
                <Th>Name</Th>
                <Th>Role</Th>
                <Th>Status</Th>
              </Tr>
            </THead>
            <TBody>
              {(summary.data?.people ?? []).map((p) => (
                <Tr key={p.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={p.fullName} />
                      <span className="font-semibold">{p.fullName}</span>
                    </div>
                  </Td>
                  <Td className="capitalize text-muted">{p.role.toLowerCase()}</Td>
                  <Td>
                    <DotStatus color={p.hasSubmittedToday ? "#4f46e5" : "#c9c9d1"}>
                      {p.hasSubmittedToday ? "Submitted" : "Not submitted"}
                    </DotStatus>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
          {summary.data?.people.length === 0 ? <EmptyState message="No one to show yet." /> : null}
        </div>
      </Card>

      <Card className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-ink">Update log</h2>
            <p className="mt-1 text-sm text-muted">Filter by date range and person, then export to CSV.</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={<DownloadIcon width={14} height={14} />}
            isLoading={isExporting}
            onClick={handleExport}
          >
            Download CSV
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <DateRangeFilter value={range} onChange={setRange} />
          <Select value={personId} onChange={(e) => setPersonId(e.target.value)} className="w-auto min-w-[160px]">
            <option value="">Everyone</option>
            {filterablePeople.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-5 flex flex-col divide-y divide-black/5">
          {(log.data?.items ?? []).map((entry) => (
            <div key={entry.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-ink">{nameById.get(entry.userId) ?? "Unknown"}</span>
                <span className="text-xs text-muted">{formatDate(entry.date)}</span>
              </div>
              <p className="mt-1.5 text-sm text-ink-soft">{entry.summary}</p>
              {entry.blockers ? (
                <p className="mt-1 text-xs text-muted">
                  <span className="font-semibold">Blockers:</span> {entry.blockers}
                </p>
              ) : null}
              {entry.planForTomorrow ? (
                <p className="mt-1 text-xs text-muted">
                  <span className="font-semibold">Plan:</span> {entry.planForTomorrow}
                </p>
              ) : null}
            </div>
          ))}
          {log.data?.items.length === 0 ? <EmptyState message="No updates match these filters." /> : null}
        </div>
        {log.data && log.data.pagination.total > log.data.items.length ? (
          <p className="mt-3 text-xs text-muted">
            Showing {log.data.items.length} of {log.data.pagination.total} — narrow the filters or export CSV for the
            full set.
          </p>
        ) : null}
      </Card>
    </AppShell>
  );
}
