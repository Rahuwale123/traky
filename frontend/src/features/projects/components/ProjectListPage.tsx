import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../../../app/layout/AppShell";
import { PageHeader } from "../../../app/layout/PageHeader";
import { managerNavItems } from "../../../app/nav";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { EmptyState, TBody, THead, Table, Td, Th, Tr } from "../../../components/ui/Table";
import { PlusIcon } from "../../../components/ui/icons";
import { formatDate } from "../../../lib/utils";
import { useProjects } from "../hooks";
import { CreateProjectModal } from "./CreateProjectModal";
import type { ProjectStatus } from "../types";

const statusTone: Record<ProjectStatus, "lavender" | "rose" | "violet" | "neutral"> = {
  ACTIVE: "lavender",
  ON_HOLD: "rose",
  COMPLETED: "violet",
  ARCHIVED: "neutral",
};

export function ProjectListPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const projects = useProjects({ pageSize: 100 });
  const navigate = useNavigate();

  return (
    <AppShell navItems={managerNavItems}>
      <PageHeader
        crumbs={["Home", "Projects"]}
        title="Projects"
        actions={
          <Button size="sm" icon={<PlusIcon width={14} height={14} />} onClick={() => setModalOpen(true)}>
            New Project
          </Button>
        }
      />

      <section className="rounded-3xl border border-black/5 bg-white p-6">
        <Table>
          <THead>
            <Tr>
              <Th>Project</Th>
              <Th>Status</Th>
              <Th>Created</Th>
              <Th />
            </Tr>
          </THead>
          <TBody>
            {(projects.data?.items ?? []).map((p) => (
              <Tr key={p.id} className="cursor-pointer" onClick={() => navigate(`/manager/projects/${p.id}`)}>
                <Td>
                  <p className="font-semibold">{p.name}</p>
                  {p.description ? <p className="mt-0.5 text-xs text-muted">{p.description}</p> : null}
                </Td>
                <Td>
                  <Badge tone={statusTone[p.status]}>{p.status.replace("_", " ")}</Badge>
                </Td>
                <Td className="text-muted">{formatDate(p.createdAt)}</Td>
                <Td>
                  <Button variant="secondary" size="sm" onClick={() => navigate(`/manager/projects/${p.id}`)}>
                    Open board
                  </Button>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
        {projects.data?.items.length === 0 ? <EmptyState message="No projects yet. Create your first one." /> : null}
      </section>

      <CreateProjectModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </AppShell>
  );
}
