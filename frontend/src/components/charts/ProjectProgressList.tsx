import { ProgressMeter } from "./ProgressMeter";
import type { Project } from "../../features/projects/types";

interface ProjectProgressRow {
  project: Project;
  done: number;
  total: number;
}

export function ProjectProgressList({ rows }: { rows: ProjectProgressRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">No projects yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {rows.map(({ project, done, total }) => (
        <div key={project.id} className="flex items-center gap-4">
          <span className="w-40 shrink-0 truncate text-sm font-medium text-ink">{project.name}</span>
          <div className="flex-1">
            <ProgressMeter done={done} total={total} />
          </div>
        </div>
      ))}
    </div>
  );
}
