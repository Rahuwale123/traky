import { useNavigate } from "react-router-dom";
import { AppShell } from "../../../app/layout/AppShell";
import { PageHeader } from "../../../app/layout/PageHeader";
import { managerNavItems } from "../../../app/nav";
import { Avatar } from "../../../components/ui/Avatar";
import { Badge } from "../../../components/ui/Badge";
import { EmptyState, TBody, THead, Table, Td, Th, Tr } from "../../../components/ui/Table";
import { useDesignations, useMyTeam } from "../hooks";

export function ManagerTeamPage() {
  const team = useMyTeam({ pageSize: 100 });
  const designations = useDesignations();
  const navigate = useNavigate();

  const designationNameById = new Map((designations.data ?? []).map((d) => [d.id, d.name]));

  return (
    <AppShell navItems={managerNavItems}>
      <PageHeader crumbs={["Home", "My Team"]} title="My Team" />

      <section className="rounded-3xl border border-black/5 bg-white p-6">
        <Table>
          <THead>
            <Tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Designation</Th>
              <Th>Status</Th>
            </Tr>
          </THead>
          <TBody>
            {(team.data?.items ?? []).map((m) => (
              <Tr key={m.id} className="cursor-pointer" onClick={() => navigate(`/manager/team/${m.id}`)}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={m.fullName} />
                    <span className="font-semibold">{m.fullName}</span>
                  </div>
                </Td>
                <Td className="text-muted">{m.email}</Td>
                <Td className="text-muted">
                  {m.designationId ? designationNameById.get(m.designationId) ?? "—" : "—"}
                </Td>
                <Td>
                  <Badge tone={m.isActive ? "lavender" : "rose"}>{m.isActive ? "Active" : "Inactive"}</Badge>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
        {team.data?.items.length === 0 ? (
          <EmptyState message="No team members yet. Ask your admin to assign employees to you." />
        ) : null}
      </section>
    </AppShell>
  );
}
