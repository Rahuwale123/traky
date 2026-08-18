import { taskStatusValues } from "../tasks/constants";
import type { Task, TaskStatus } from "../tasks/types";
import type { Project } from "../projects/types";
import type { OrgUser } from "../admin/types";
import type { WorkloadRow } from "../../components/charts/WorkloadBar";
import { isDateInRange, type ResolvedRange } from "../../lib/dateRange";

/** "Recent activity" proxy — updatedAt covers both creation and any later status/field change. */
export function filterTasksByRange(tasks: Task[], resolved: ResolvedRange | null): Task[] {
  if (!resolved) return tasks;
  return tasks.filter((t) => isDateInRange(t.updatedAt, resolved));
}

export function countByStatus(tasks: Task[]): Record<TaskStatus, number> {
  const counts = Object.fromEntries(taskStatusValues.map((s) => [s, 0])) as Record<TaskStatus, number>;
  for (const task of tasks) counts[task.status] += 1;
  return counts;
}

export function overdueCount(tasks: Task[]): number {
  const today = new Date().toISOString().slice(0, 10);
  return tasks.filter((t) => t.dueDate && t.dueDate < today && t.status !== "DONE").length;
}

export function workloadByAssignee(tasks: Task[], people: OrgUser[]): WorkloadRow[] {
  const nameById = new Map(people.map((p) => [p.id, p.fullName]));
  const counts = new Map<string, number>();
  for (const task of tasks) {
    if (!task.assigneeId || !nameById.has(task.assigneeId)) continue;
    counts.set(task.assigneeId, (counts.get(task.assigneeId) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([id, value]) => ({
    id,
    name: nameById.get(id) as string,
    value,
  }));
}

export function projectProgress(projects: Project[], tasks: Task[]) {
  return projects.map((project) => {
    const projectTasks = tasks.filter((t) => t.projectId === project.id);
    const done = projectTasks.filter((t) => t.status === "DONE").length;
    return { project, done, total: projectTasks.length };
  });
}
