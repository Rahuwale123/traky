import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppShell } from "../../../app/layout/AppShell";
import { PageHeader } from "../../../app/layout/PageHeader";
import { managerNavItems } from "../../../app/nav";
import { Button } from "../../../components/ui/Button";
import { PlusIcon } from "../../../components/ui/icons";
import { useMyTeam } from "../../admin/hooks";
import { useProject } from "../hooks";
import { useTasks, useUpdateTask } from "../../tasks/hooks";
import { taskStatusValues, taskStatusLabels } from "../../tasks/constants";
import { TaskCard } from "../../tasks/components/TaskCard";
import { CreateTaskModal } from "../../tasks/components/CreateTaskModal";
import { TaskDetailModal } from "../../tasks/components/TaskDetailModal";
import type { Task, TaskStatus } from "../../tasks/types";

export function ProjectBoardPage() {
  const { id } = useParams<{ id: string }>();
  const project = useProject(id);
  const tasks = useTasks({ projectId: id, pageSize: 200 });
  const team = useMyTeam({ pageSize: 100 });
  const updateTask = useUpdateTask();

  const [createOpen, setCreateOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const teamById = new Map((team.data?.items ?? []).map((m) => [m.id, m]));
  const items = tasks.data?.items ?? [];

  const columns: Record<TaskStatus, Task[]> = {
    TODO: items.filter((t) => t.status === "TODO"),
    IN_PROGRESS: items.filter((t) => t.status === "IN_PROGRESS"),
    REVIEW: items.filter((t) => t.status === "REVIEW"),
    DONE: items.filter((t) => t.status === "DONE"),
  };

  const currentTask = activeTask ? (items.find((t) => t.id === activeTask.id) ?? activeTask) : null;

  return (
    <AppShell navItems={managerNavItems}>
      <PageHeader
        crumbs={["Home", "Projects", project.data?.name ?? "…"]}
        title={project.data?.name ?? "Project"}
        actions={
          <>
            <Link to="/manager/projects">
              <Button variant="secondary" size="sm">
                Back to projects
              </Button>
            </Link>
            <Button size="sm" icon={<PlusIcon width={14} height={14} />} onClick={() => setCreateOpen(true)}>
              New Task
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {taskStatusValues.map((status) => (
          <div
            key={status}
            className="flex min-h-[520px] flex-col gap-3 rounded-3xl bg-black/[0.025] p-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (draggingId) {
                updateTask.mutate({ id: draggingId, payload: { status } });
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
                  assignee={task.assigneeId ? teamById.get(task.assigneeId) : undefined}
                  onClick={() => setActiveTask(task)}
                  draggable
                  onDragStart={() => setDraggingId(task.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <CreateTaskModal isOpen={createOpen} onClose={() => setCreateOpen(false)} projectId={id as string} />
      <TaskDetailModal task={currentTask} onClose={() => setActiveTask(null)} />
    </AppShell>
  );
}
