import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../../../app/layout/AppShell";
import { PageHeader } from "../../../app/layout/PageHeader";
import { adminNavItems, managerNavItems } from "../../../app/nav";
import { Card, TintedCard } from "../../../components/ui/Card";
import { Avatar } from "../../../components/ui/Avatar";
import { Badge, DotStatus } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Select } from "../../../components/ui/Select";
import { DateRangeFilter } from "../../../components/ui/DateRangeFilter";
import { EmptyState, TBody, THead, Table, Td, Th, Tr } from "../../../components/ui/Table";
import { ClockIcon, DownloadIcon, UsersIcon } from "../../../components/ui/icons";
import { formatDate, formatMinutes, formatTime } from "../../../lib/utils";
import { toCSV, downloadCSV } from "../../../lib/csv";
import { resolveDateRange, type DateRange } from "../../../lib/dateRange";
import { useAuthStore } from "../../../stores/authStore";
import { useMyTeam, useUsers } from "../../admin/hooks";
import { fetchAllAttendance } from "../api";
import { useAttendanceList, useAttendanceTodaySummary } from "../hooks";

const STATUS_COLOR = { in: "#4f46e5", out: "#8b8b96", none: "#c9c9d1" };

export function AttendancePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";
  const navItems = isAdmin ? adminNavItems : managerNavItems;
  const teamPath = isAdmin ? "/admin/team" : "/manager/team";

  const orgUsers = useUsers({ pageSize: 100 }, { enabled: isAdmin });
  const myTeam = useMyTeam({ pageSize: 100 });
  const summary = useAttendanceTodaySummary();

  const [range, setRange] = useState<DateRange>({ preset: "month" });
  const [personId, setPersonId] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);

  const resolved = resolveDateRange(range);
  const filterParams = {
    userId: personId || undefined,
    startDate: resolved?.start,
    endDate: resolved?.end,
  };
  const log = useAttendanceList({ ...filterParams, pageSize: 50 });

  const nameById = new Map<string, string>();
  const people = isAdmin ? (orgUsers.data?.items ?? []) : (myTeam.data?.items ?? []);
  people.forEach((u) => nameById.set(u.id, u.fullName));
  if (!isAdmin && user) nameById.set(user.id, user.fullName);

  const filterablePeople = isAdmin
    ? people.filter((u) => u.role === "ADMIN" || u.role === "MANAGER" || u.role === "EMPLOYEE")
    : [...(user ? [{ id: user.id, fullName: user.fullName }] : []), ...people];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { rows, truncated } = await fetchAllAttendance(filterParams);
      const csv = toCSV(
        ["Name", "Date", "Punched In", "Punched Out", "Duration (minutes)"],
        rows.map((r) => [
          nameById.get(r.userId) ?? "Unknown",
          formatDate(r.punchInAt),
          formatTime(r.punchInAt),
          r.punchOutAt ? formatTime(r.punchOutAt) : "",
          r.punchOutAt
            ? String(Math.round((new Date(r.punchOutAt).getTime() - new Date(r.punchInAt).getTime()) / 60_000))
            : "",
        ]),
      );
      downloadCSV(`attendance-${new Date().toISOString().slice(0, 10)}.csv`, csv);
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
      <PageHeader crumbs={["Home", "Attendance"]} title="Attendance" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TintedCard
          tone="lavender"
          eyebrowIcon={<ClockIcon width={14} height={14} />}
          eyebrow="Punch-in rate today"
          title={`${summary.data?.rate ?? 0}%`}
        />
        <TintedCard
          tone="dark"
          eyebrowIcon={<UsersIcon width={14} height={14} />}
          eyebrow="Punched in right now"
          title={summary.data?.people.filter((p) => p.isPunchedIn).length ?? 0}
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
          Who's punched in {isAdmin ? "across the org" : "on your team"} today.
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
                <Tr key={p.id} className="cursor-pointer" onClick={() => navigate(`${teamPath}/${p.id}`)}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={p.fullName} />
                      <span className="font-semibold">{p.fullName}</span>
                    </div>
                  </Td>
                  <Td className="capitalize text-muted">{p.role.toLowerCase()}</Td>
                  <Td>
                    <DotStatus color={p.isPunchedIn ? STATUS_COLOR.in : p.hasPunchedToday ? STATUS_COLOR.out : STATUS_COLOR.none}>
                      {p.isPunchedIn ? "Punched in" : p.hasPunchedToday ? "Punched out" : "Not punched today"}
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
            <h2 className="text-lg font-bold text-ink">Attendance log</h2>
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

        <div className="mt-5">
          <Table>
            <THead>
              <Tr>
                <Th>Name</Th>
                <Th>Date</Th>
                <Th>Punched in</Th>
                <Th>Punched out</Th>
                <Th>Duration</Th>
              </Tr>
            </THead>
            <TBody>
              {(log.data?.items ?? []).map((entry) => {
                const durationMinutes = entry.punchOutAt
                  ? Math.round((new Date(entry.punchOutAt).getTime() - new Date(entry.punchInAt).getTime()) / 60_000)
                  : null;
                return (
                  <Tr key={entry.id} className="cursor-pointer" onClick={() => navigate(`${teamPath}/${entry.userId}`)}>
                    <Td className="font-semibold">{nameById.get(entry.userId) ?? "Unknown"}</Td>
                    <Td className="text-muted">{formatDate(entry.punchInAt)}</Td>
                    <Td className="text-muted">{formatTime(entry.punchInAt)}</Td>
                    <Td className="text-muted">{entry.punchOutAt ? formatTime(entry.punchOutAt) : "—"}</Td>
                    <Td>
                      {durationMinutes !== null ? (
                        <span className="text-muted">{formatMinutes(durationMinutes)}</span>
                      ) : (
                        <Badge tone="lavender">In progress</Badge>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
          {log.data?.items.length === 0 ? <EmptyState message="No attendance records match these filters." /> : null}
          {log.data && log.data.pagination.total > log.data.items.length ? (
            <p className="mt-3 text-xs text-muted">
              Showing {log.data.items.length} of {log.data.pagination.total} — narrow the filters or export CSV for
              the full set.
            </p>
          ) : null}
        </div>
      </Card>
    </AppShell>
  );
}
