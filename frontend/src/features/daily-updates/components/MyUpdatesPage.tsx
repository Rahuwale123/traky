import { AppShell } from "../../../app/layout/AppShell";
import { PageHeader } from "../../../app/layout/PageHeader";
import { employeeNavItems } from "../../../app/nav";
import { Card } from "../../../components/ui/Card";
import { EmptyState } from "../../../components/ui/Table";
import { formatDate } from "../../../lib/utils";
import { useMyUpdateHistory } from "../hooks";
import { EodUpdateWidget } from "./EodUpdateWidget";

export function MyUpdatesPage() {
  const history = useMyUpdateHistory({ pageSize: 30 });
  const items = history.data?.items ?? [];

  return (
    <AppShell navItems={employeeNavItems}>
      <PageHeader crumbs={["Home", "My Updates"]} title="My Updates" />

      <div className="mb-6">
        <EodUpdateWidget />
      </div>

      <Card>
        <h2 className="text-lg font-bold text-ink">History</h2>
        <p className="mt-1 text-sm text-muted">Your past EOD updates, most recent first.</p>

        <div className="mt-5 flex flex-col divide-y divide-black/5">
          {items.map((entry) => (
            <div key={entry.id} className="py-4 first:pt-0 last:pb-0">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                {formatDate(entry.date)}
              </span>
              <p className="mt-1.5 text-sm text-ink">{entry.summary}</p>
              {entry.blockers ? (
                <p className="mt-1 text-xs text-muted">
                  <span className="font-semibold text-ink-soft">Blockers:</span> {entry.blockers}
                </p>
              ) : null}
              {entry.planForTomorrow ? (
                <p className="mt-1 text-xs text-muted">
                  <span className="font-semibold text-ink-soft">Plan:</span> {entry.planForTomorrow}
                </p>
              ) : null}
            </div>
          ))}
          {items.length === 0 ? <EmptyState message="No updates submitted yet." /> : null}
        </div>
      </Card>
    </AppShell>
  );
}
