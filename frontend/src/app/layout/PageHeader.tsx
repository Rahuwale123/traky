import type { ReactNode } from "react";
import { ChevronRightIcon } from "../../components/ui/icons";

interface PageHeaderProps {
  crumbs: string[];
  title: string;
  actions?: ReactNode;
}

export function PageHeader({ crumbs, title, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-1.5 text-sm text-muted">
          {crumbs.map((crumb, i) => (
            <span key={crumb} className="flex items-center gap-1.5">
              {i > 0 ? <ChevronRightIcon /> : null}
              <span className={i === crumbs.length - 1 ? "font-medium text-ink-soft" : undefined}>{crumb}</span>
            </span>
          ))}
        </div>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
