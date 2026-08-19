import { useState } from "react";
import { AppShell } from "../../../app/layout/AppShell";
import { PageHeader } from "../../../app/layout/PageHeader";
import { adminNavItems } from "../../../app/nav";
import { Card } from "../../../components/ui/Card";
import { Avatar } from "../../../components/ui/Avatar";
import { Badge } from "../../../components/ui/Badge";
import { Select } from "../../../components/ui/Select";
import { EmptyState, TBody, THead, Table, Td, Th, Tr } from "../../../components/ui/Table";
import { relativeTime } from "../../../lib/utils";
import { useActivities } from "../hooks";
import { describeActivity, ENTITY_TYPE_LABELS } from "../describe";

export function ActivityLogPage() {
  const [entityType, setEntityType] = useState("");
  const activities = useActivities({ entityType: entityType || undefined, pageSize: 100 });
  const items = activities.data?.items ?? [];

  return (
    <AppShell navItems={adminNavItems}>
      <PageHeader crumbs={["Home", "Activity Log"]} title="Activity Log" />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-ink">Who did what</h2>
            <p className="mt-1 text-sm text-muted">A record of member, project, task, and settings changes across your organization.</p>
          </div>
          <Select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="w-auto min-w-[160px]">
            <option value="">Everything</option>
            {Object.entries(ENTITY_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-5">
          <Table>
            <THead>
              <Tr>
                <Th>Actor</Th>
                <Th>Activity</Th>
                <Th>When</Th>
              </Tr>
            </THead>
            <TBody>
              {items.map((activity) => (
                <Tr key={activity.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={activity.actorName} size={28} />
                      <span className="font-semibold">{activity.actorName}</span>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Badge tone="neutral">{ENTITY_TYPE_LABELS[activity.entityType] ?? activity.entityType}</Badge>
                      <span className="text-ink">{describeActivity(activity)}</span>
                    </div>
                  </Td>
                  <Td className="whitespace-nowrap text-muted">{relativeTime(activity.createdAt)}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
          {items.length === 0 ? <EmptyState message="No activity recorded yet." /> : null}
          {activities.data && activities.data.pagination.total > items.length ? (
            <p className="mt-3 text-xs text-muted">
              Showing {items.length} of {activities.data.pagination.total} — narrow the filter to see more specific
              activity.
            </p>
          ) : null}
        </div>
      </Card>
    </AppShell>
  );
}
