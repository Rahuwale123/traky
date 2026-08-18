import { useParams, useNavigate } from "react-router-dom";
import { AppShell } from "../../../app/layout/AppShell";
import { PageHeader } from "../../../app/layout/PageHeader";
import { adminNavItems, managerNavItems } from "../../../app/nav";
import { Card } from "../../../components/ui/Card";
import { Avatar } from "../../../components/ui/Avatar";
import { Badge, DotStatus } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { SearchableSelect } from "../../../components/ui/SearchableSelect";
import { EmptyState, TBody, THead, Table, Td, Th, Tr } from "../../../components/ui/Table";
import { ProgressMeter } from "../../../components/charts/ProgressMeter";
import { formatDate, formatMinutes, formatTime } from "../../../lib/utils";
import { useAuthStore } from "../../../stores/authStore";
import { useDesignations, useMyTeam, useUpdateUserDesignation, useUser, useUsers } from "../hooks";
import { useProjects } from "../../projects/hooks";
import { useTasks } from "../../tasks/hooks";
import { useAttendanceList } from "../../attendance/hooks";
import type { Task, TaskPriority, TaskStatus } from "../../tasks/types";
import type { Project } from "../../projects/types";
import type { OrgUser } from "../types";

const statusTone: Record<TaskStatus, "lavender" | "rose" | "violet" | "neutral"> = {
  TODO: "neutral",
  IN_PROGRESS: "lavender",
  REVIEW: "rose",
  DONE: "violet",
};

const priorityTone: Record<TaskPriority, "lavender" | "rose" | "violet" | "neutral"> = {
  LOW: "neutral",
  MEDIUM: "lavender",
  HIGH: "rose",
  URGENT: "violet",
};

interface ProjectRow {
  project: Project;
  done: number;
  total: number;
}

function splitCurrentPast(rows: ProjectRow[]) {
  return {
    current: rows.filter((r) => r.total === 0 || r.done < r.total),
    past: rows.filter((r) => r.total > 0 && r.done === r.total),
  };
}

export function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser?.role === "ADMIN";
  const navItems = isAdmin ? adminNavItems : managerNavItems;
  const backTo = isAdmin ? "/admin/team" : "/manager/team";

  const adminUser = useUser(isAdmin ? id : undefined);
  const team = useMyTeam({ pageSize: 100 });
  const orgUsers = useUsers({ pageSize: 100 });
  const designations = useDesignations();
  const updateDesignation = useUpdateUserDesignation();
  const tasksQuery = useTasks({ pageSize: 200 });
  const projectsQuery = useProjects({ pageSize: 100 });
  const attendance = useAttendanceList({ userId: id, pageSize: 10 });

  // A manager can land on their own row (e.g. from their own attendance log) —
  // useMyTeam only returns their employees, not themselves, so fall back to the
  // logged-in user's own profile in that case.
  const selfAsMember: OrgUser | undefined =
    !isAdmin && currentUser && id === currentUser.id
      ? {
          id: currentUser.id,
          organizationId: currentUser.organizationId,
          email: currentUser.email,
          fullName: currentUser.fullName,
          role: currentUser.role,
          managerId: currentUser.managerId,
          designationId: currentUser.designationId,
          isActive: true,
          createdAt: "",
        }
      : undefined;

  const member = isAdmin ? adminUser.data : (selfAsMember ?? team.data?.items.find((m) => m.id === id));
  const isLoading = isAdmin ? adminUser.isLoading : !selfAsMember && team.isLoading;

  if (isLoading) {
    return (
      <AppShell navItems={navItems}>
        <p className="text-sm text-muted">Loading…</p>
      </AppShell>
    );
  }

  if (!member) {
    return (
      <AppShell navItems={navItems}>
        <PageHeader crumbs={["Home", "Team"]} title="Team member" />
        <EmptyState message="This person couldn't be found." />
      </AppShell>
    );
  }

  const tasks = tasksQuery.data?.items ?? [];
  const projects = projectsQuery.data?.items ?? [];
  const projectById = new Map(projects.map((p) => [p.id, p]));
  const designationName = member.designationId
    ? (designations.data ?? []).find((d) => d.id === member.designationId)?.name
    : undefined;

  let projectRows: ProjectRow[] = [];
  let recentTasks: Task[] = [];
  let directReports: { id: string; fullName: string; email: string }[] = [];

  if (member.role === "EMPLOYEE") {
    const own = tasks.filter((t) => t.assigneeId === member.id);
    const byProject = new Map<string, Task[]>();
    own.forEach((t) => byProject.set(t.projectId, [...(byProject.get(t.projectId) ?? []), t]));
    projectRows = Array.from(byProject.entries())
      .map(([projectId, projectTasks]) => {
        const project = projectById.get(projectId);
        if (!project) return null;
        return { project, done: projectTasks.filter((t) => t.status === "DONE").length, total: projectTasks.length };
      })
      .filter((r): r is ProjectRow => r !== null);
    recentTasks = [...own].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 8);
  } else if (member.role === "MANAGER") {
    const owned = projects.filter((p) => p.managerId === member.id);
    projectRows = owned.map((project) => {
      const projectTasks = tasks.filter((t) => t.projectId === project.id);
      return { project, done: projectTasks.filter((t) => t.status === "DONE").length, total: projectTasks.length };
    });
    if (isAdmin) {
      directReports = (orgUsers.data?.items ?? []).filter((u) => u.managerId === member.id);
    } else if (selfAsMember) {
      directReports = team.data?.items ?? [];
    }
  }

  const { current, past } = splitCurrentPast(projectRows);

  return (
    <AppShell navItems={navItems}>
      <PageHeader
        crumbs={["Home", "Team", member.fullName]}
        title={member.fullName}
        actions={
          <Button variant="secondary" size="sm" onClick={() => navigate(backTo)}>
            Back to team
          </Button>
        }
      />

      <Card className="flex flex-wrap items-center gap-5">
        <Avatar name={member.fullName} size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-ink">{member.fullName}</h2>
            <Badge tone={member.role === "MANAGER" ? "dark" : "lavender"}>{member.role}</Badge>
            <Badge tone={member.isActive ? "lavender" : "rose"}>{member.isActive ? "Active" : "Inactive"}</Badge>
          </div>
          {isAdmin ? (
            <div className="mt-2 max-w-xs">
              <SearchableSelect
                placeholder="Set designation…"
                options={(designations.data ?? []).map((d) => ({ id: d.id, label: d.name, group: d.category }))}
                value={member.designationId ?? undefined}
                onChange={(designationId) =>
                  updateDesignation.mutate({ userId: member.id, designationId: designationId ?? null })
                }
              />
            </div>
          ) : designationName ? (
            <p className="mt-0.5 text-sm font-medium text-ink-soft">{designationName}</p>
          ) : null}
          <p className="mt-1 text-sm text-muted">{member.email}</p>
          <p className="mt-1 text-xs text-muted">Joined {formatDate(member.createdAt)}</p>
        </div>
      </Card>

      {member.role === "MANAGER" && directReports.length > 0 ? (
        <Card className="mt-6">
          <h2 className="text-lg font-bold text-ink">Direct reports</h2>
          <p className="mt-1 text-sm text-muted">Employees managed by {member.fullName}.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {directReports.map((r) => (
              <button
                key={r.id}
                onClick={() => navigate(`${backTo}/${r.id}`)}
                className="flex items-center gap-2 rounded-full border border-black/10 py-1.5 pl-1.5 pr-3 text-sm font-medium text-ink transition-colors hover:bg-black/[0.03]"
              >
                <Avatar name={r.fullName} size={22} />
                {r.fullName}
              </button>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="text-lg font-bold text-ink">Current projects</h2>
          <p className="mt-1 text-sm text-muted">
            {member.role === "MANAGER" ? "Projects they manage, still in progress." : "Projects with open work assigned to them."}
          </p>
          <div className="mt-5 flex flex-col gap-4">
            {current.map(({ project, done, total }) => (
              <div key={project.id} className="flex items-center gap-4">
                <span className="w-36 shrink-0 truncate text-sm font-medium text-ink">{project.name}</span>
                <div className="flex-1">
                  <ProgressMeter done={done} total={total} />
                </div>
              </div>
            ))}
            {current.length === 0 ? <p className="text-sm text-muted">Nothing in progress right now.</p> : null}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-ink">Past projects</h2>
          <p className="mt-1 text-sm text-muted">
            {member.role === "MANAGER" ? "Projects where all tasks are complete." : "Projects where their work is fully complete."}
          </p>
          <div className="mt-5 flex flex-col gap-4">
            {past.map(({ project, done, total }) => (
              <div key={project.id} className="flex items-center gap-4">
                <span className="w-36 shrink-0 truncate text-sm font-medium text-ink">{project.name}</span>
                <div className="flex-1">
                  <ProgressMeter done={done} total={total} />
                </div>
              </div>
            ))}
            {past.length === 0 ? <p className="text-sm text-muted">No completed projects yet.</p> : null}
          </div>
        </Card>
      </div>

      {member.role === "EMPLOYEE" ? (
        <Card className="mt-6">
          <h2 className="text-lg font-bold text-ink">Recent tasks</h2>
          <p className="mt-1 text-sm text-muted">Their most recently updated tasks, across all projects.</p>
          <div className="mt-5">
            <Table>
              <THead>
                <Tr>
                  <Th>Task</Th>
                  <Th>Project</Th>
                  <Th>Priority</Th>
                  <Th>Status</Th>
                  <Th>Due date</Th>
                </Tr>
              </THead>
              <TBody>
                {recentTasks.map((task) => (
                  <Tr key={task.id}>
                    <Td className="font-semibold">{task.title}</Td>
                    <Td className="text-muted">{projectById.get(task.projectId)?.name ?? "—"}</Td>
                    <Td>
                      <Badge tone={priorityTone[task.priority]}>{task.priority}</Badge>
                    </Td>
                    <Td>
                      <Badge tone={statusTone[task.status]}>{task.status.replace("_", " ")}</Badge>
                    </Td>
                    <Td className="text-muted">{formatDate(task.dueDate)}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
            {recentTasks.length === 0 ? <EmptyState message="No tasks assigned yet." /> : null}
          </div>
        </Card>
      ) : null}

      <Card className="mt-6">
        <h2 className="text-lg font-bold text-ink">Recent attendance</h2>
        <p className="mt-1 text-sm text-muted">Their last 10 punch-in / punch-out events.</p>
        <div className="mt-5">
          <Table>
            <THead>
              <Tr>
                <Th>Date</Th>
                <Th>Punched in</Th>
                <Th>Punched out</Th>
                <Th>Duration</Th>
              </Tr>
            </THead>
            <TBody>
              {(attendance.data?.items ?? []).map((entry) => {
                const durationMinutes = entry.punchOutAt
                  ? Math.round((new Date(entry.punchOutAt).getTime() - new Date(entry.punchInAt).getTime()) / 60_000)
                  : null;
                return (
                  <Tr key={entry.id}>
                    <Td className="text-muted">{formatDate(entry.punchInAt)}</Td>
                    <Td className="text-muted">{formatTime(entry.punchInAt)}</Td>
                    <Td className="text-muted">{entry.punchOutAt ? formatTime(entry.punchOutAt) : "—"}</Td>
                    <Td>
                      {durationMinutes !== null ? (
                        <span className="text-muted">{formatMinutes(durationMinutes)}</span>
                      ) : (
                        <DotStatus color="#4f46e5">In progress</DotStatus>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
          {attendance.data?.items.length === 0 ? <EmptyState message="No attendance recorded yet." /> : null}
        </div>
      </Card>
    </AppShell>
  );
}
