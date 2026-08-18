import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../../../app/layout/AppShell";
import { PageHeader } from "../../../app/layout/PageHeader";
import { adminNavItems } from "../../../app/nav";
import { Button } from "../../../components/ui/Button";
import { Avatar } from "../../../components/ui/Avatar";
import { Badge } from "../../../components/ui/Badge";
import { EmptyState, TBody, THead, Table, Td, Th, Tr } from "../../../components/ui/Table";
import { PlusIcon } from "../../../components/ui/icons";
import { useAssignManager, useDesignations, useUsers } from "../hooks";
import { CreateManagerModal } from "./CreateManagerModal";
import { CreateEmployeeModal } from "./CreateEmployeeModal";
import type { OrgUser } from "../types";

export function AdminTeamPage() {
  const navigate = useNavigate();
  const [managerModalOpen, setManagerModalOpen] = useState(false);
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);

  const managers = useUsers({ role: "MANAGER", pageSize: 100 });
  const employees = useUsers({ role: "EMPLOYEE", pageSize: 100 });
  const designations = useDesignations();
  const assignManager = useAssignManager();

  const managerNameById = new Map((managers.data?.items ?? []).map((m) => [m.id, m.fullName]));
  const designationNameById = new Map((designations.data ?? []).map((d) => [d.id, d.name]));

  return (
    <AppShell navItems={adminNavItems}>
      <PageHeader
        crumbs={["Home", "Team"]}
        title="Team"
        actions={
          <>
            <Button variant="secondary" size="sm" icon={<PlusIcon width={14} height={14} />} onClick={() => setManagerModalOpen(true)}>
              New Manager
            </Button>
            <Button size="sm" icon={<PlusIcon width={14} height={14} />} onClick={() => setEmployeeModalOpen(true)}>
              New Employee
            </Button>
          </>
        }
      />

      <section className="rounded-3xl border border-black/5 bg-white p-6">
        <h2 className="mb-4 text-lg font-bold text-ink">Managers</h2>
        <Table>
          <THead>
            <Tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Designation</Th>
              <Th>Status</Th>
              <Th>Joined</Th>
            </Tr>
          </THead>
          <TBody>
            {(managers.data?.items ?? []).map((m) => (
              <Tr key={m.id} className="cursor-pointer" onClick={() => navigate(`/admin/team/${m.id}`)}>
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
                <Td className="text-muted">{new Date(m.createdAt).toLocaleDateString()}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
        {managers.data?.items.length === 0 ? <EmptyState message="No managers yet." /> : null}
      </section>

      <section className="mt-6 rounded-3xl border border-black/5 bg-white p-6">
        <h2 className="mb-4 text-lg font-bold text-ink">Employees</h2>
        <Table>
          <THead>
            <Tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Designation</Th>
              <Th>Manager</Th>
              <Th>Status</Th>
            </Tr>
          </THead>
          <TBody>
            {(employees.data?.items ?? []).map((e) => (
              <EmployeeRow
                key={e.id}
                employee={e}
                managerNameById={managerNameById}
                managerOptions={managers.data?.items ?? []}
                designationName={e.designationId ? designationNameById.get(e.designationId) : undefined}
                onReassign={(managerId) => assignManager.mutate({ userId: e.id, managerId })}
                onOpen={() => navigate(`/admin/team/${e.id}`)}
              />
            ))}
          </TBody>
        </Table>
        {employees.data?.items.length === 0 ? <EmptyState message="No employees yet." /> : null}
      </section>

      <CreateManagerModal isOpen={managerModalOpen} onClose={() => setManagerModalOpen(false)} />
      <CreateEmployeeModal isOpen={employeeModalOpen} onClose={() => setEmployeeModalOpen(false)} />
    </AppShell>
  );
}

function EmployeeRow({
  employee,
  managerNameById,
  managerOptions,
  designationName,
  onReassign,
  onOpen,
}: {
  employee: OrgUser;
  managerNameById: Map<string, string>;
  managerOptions: OrgUser[];
  designationName: string | undefined;
  onReassign: (managerId: string) => void;
  onOpen: () => void;
}) {
  return (
    <Tr className="cursor-pointer" onClick={onOpen}>
      <Td>
        <div className="flex items-center gap-3">
          <Avatar name={employee.fullName} />
          <span className="font-semibold">{employee.fullName}</span>
        </div>
      </Td>
      <Td className="text-muted">{employee.email}</Td>
      <Td className="text-muted">{designationName ?? "—"}</Td>
      <Td onClick={(e) => e.stopPropagation()}>
        <select
          className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm"
          value={employee.managerId ?? ""}
          onChange={(e) => e.target.value && onReassign(e.target.value)}
        >
          <option value="" disabled>
            {employee.managerId ? managerNameById.get(employee.managerId) ?? "Unknown" : "Unassigned"}
          </option>
          {managerOptions.map((m) => (
            <option key={m.id} value={m.id}>
              {m.fullName}
            </option>
          ))}
        </select>
      </Td>
      <Td>
        <Badge tone={employee.isActive ? "lavender" : "rose"}>{employee.isActive ? "Active" : "Inactive"}</Badge>
      </Td>
    </Tr>
  );
}
