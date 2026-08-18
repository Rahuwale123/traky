import { useState } from "react";
import { AppShell } from "../../../app/layout/AppShell";
import { PageHeader } from "../../../app/layout/PageHeader";
import { employeeNavItems } from "../../../app/nav";
import { Card } from "../../../components/ui/Card";
import { EmptyState } from "../../../components/ui/Table";
import { LayersIcon } from "../../../components/ui/icons";
import { useProjects } from "../../projects/hooks";
import { useMyTasks, useUpdateTaskStatus } from "../hooks";
import { taskStatusValues, taskStatusLabels } from "../constants";
import { TaskCard } from "./TaskCard";
import { EmployeeTaskModal } from "./EmployeeTaskModal";
import type { Task, TaskStatus } from "../types";

export function MyTasksPage() {
  const myTasks = useMyTasks({ pageSize: 100 });
  const projects = useProjects({ pageSize: 100 });
  const updateStatus = useUpdateTaskStatus("my-tasks");

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const items = myTasks.data?.items ?? [];
  const projectById = new Map((projects.data?.items ?? []).map((p) => [p.id, p]));

  const byProject = new Map<string, Task[]>();
  items.forEach((t) => byProject.set(t.projectId, [...(byProject.get(t.projectId) ?? []), t]));

  const currentTask = activeTask ? (items.find((t) => t.id === activeTask.id) ?? activeTask) : null;

  return (
    <AppShell navItems={employeeNavItems}>
      <PageHeader crumbs={["Home", "My Tasks"]} title="My Tasks" />

      {byProject.size === 0 ? (
        <Card>
          <EmptyState message="No tasks assigned to you yet." />
        </Card>
      ) : null}

      <div className="flex flex-col gap-6">
        {Array.from(byProject.entries()).map(([projectId, projectTasks]) => {
          const columns: Record<TaskStatus, Task[]> = {
            TODO: projectTasks.filter((t) => t.status === "TODO"),
            IN_PROGRESS: projectTasks.filter((t) => t.status === "IN_PROGRESS"),
            REVIEW: projectTasks.filter((t) => t.status === "REVIEW"),
            DONE: projectTasks.filter((t) => t.status === "DONE"),
          };

          return (
            <Card key={projectId}>
              <div className="flex items-center gap-3.5 border-b border-black/5 pb-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <LayersIcon width={20} height={20} />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-extrabold tracking-tight text-ink">
                    {projectById.get(projectId)?.name ?? "Project"}
                  </h2>
                  <p className="text-sm text-muted">
                    {projectTasks.length} task{projectTasks.length === 1 ? "" : "s"} assigned to you
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-4">
                {taskStatusValues.map((status) => (
                  <div
                    key={status}
                    className="flex min-h-[520px] flex-col gap-3 rounded-3xl bg-black/[0.025] p-4"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (draggingId) {
                        updateStatus.mutate({ id: draggingId, status });
                        setDraggingId(null);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-sm font-bold text-ink-soft">{taskStatusLabels[status]}</h3>
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-muted">
                        {columns[status].length}
                      </span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {columns[status].map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          showAssignee={false}
                          onClick={() => setActiveTask(task)}
                          draggable
                          onDragStart={() => setDraggingId(task.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      <EmployeeTaskModal task={currentTask} onClose={() => setActiveTask(null)} />
    </AppShell>
  );
}
