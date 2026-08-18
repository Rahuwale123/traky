import { useState } from "react";
import { AppShell } from "../../../app/layout/AppShell";
import { PageHeader } from "../../../app/layout/PageHeader";
import { adminNavItems, managerNavItems } from "../../../app/nav";
import { Card } from "../../../components/ui/Card";
import { Avatar } from "../../../components/ui/Avatar";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { Textarea } from "../../../components/ui/Textarea";
import { EmptyState } from "../../../components/ui/Table";
import { PlusIcon } from "../../../components/ui/icons";
import { formatDate } from "../../../lib/utils";
import { getApiErrorMessage } from "../../../lib/api";
import { useAuthStore } from "../../../stores/authStore";
import { useDesignations, useUsers } from "../../admin/hooks";
import { useMemberRequests, useRespondMemberRequest } from "../hooks";
import { RequestMemberModal } from "./RequestMemberModal";
import type { MemberRequest, MemberRequestStatus } from "../types";

const statusTone: Record<MemberRequestStatus, "lavender" | "rose" | "violet"> = {
  PENDING: "lavender",
  APPROVED: "violet",
  REJECTED: "rose",
};

export function MemberRequestsPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";
  const navItems = isAdmin ? adminNavItems : managerNavItems;

  const requests = useMemberRequests({ pageSize: 50 });
  const designations = useDesignations();
  const managers = useUsers({ role: "MANAGER", pageSize: 100 }, { enabled: isAdmin });

  const [createOpen, setCreateOpen] = useState(false);
  const [respondTarget, setRespondTarget] = useState<{ request: MemberRequest; status: "APPROVED" | "REJECTED" } | null>(
    null,
  );

  const designationNameById = new Map((designations.data ?? []).map((d) => [d.id, d.name]));
  const managerNameById = new Map((managers.data?.items ?? []).map((m) => [m.id, m.fullName]));

  const items = requests.data?.items ?? [];

  return (
    <AppShell navItems={navItems}>
      <PageHeader
        crumbs={["Home", "Requests"]}
        title={isAdmin ? "Member Requests" : "My Requests"}
        actions={
          !isAdmin ? (
            <Button size="sm" icon={<PlusIcon width={14} height={14} />} onClick={() => setCreateOpen(true)}>
              New Request
            </Button>
          ) : undefined
        }
      />

      <Card>
        <h2 className="text-lg font-bold text-ink">
          {isAdmin ? "Requests from your managers" : "Requests you've sent"}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {isAdmin
            ? "Approve or decline requests for new team members."
            : "Track the status of your requests to the admin."}
        </p>

        <div className="mt-5 flex flex-col divide-y divide-black/5">
          {items.map((req) => (
            <div key={req.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {isAdmin ? <Avatar name={managerNameById.get(req.managerId) ?? "?"} size={28} /> : null}
                  <div>
                    {isAdmin ? (
                      <p className="text-sm font-semibold text-ink">
                        {managerNameById.get(req.managerId) ?? "Unknown manager"}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted">
                      {req.designationId ? designationNameById.get(req.designationId) ?? "Any role" : "Any role"} ·{" "}
                      {formatDate(req.createdAt)}
                    </p>
                  </div>
                </div>
                <Badge tone={statusTone[req.status]}>{req.status}</Badge>
              </div>

              <p className="mt-2.5 text-sm text-ink-soft">{req.note}</p>

              {req.responseNote ? (
                <p className="mt-2 rounded-2xl bg-black/[0.025] px-3.5 py-2.5 text-xs text-muted">
                  <span className="font-semibold text-ink-soft">Admin note:</span> {req.responseNote}
                </p>
              ) : null}

              {isAdmin && req.status === "PENDING" ? (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => setRespondTarget({ request: req, status: "APPROVED" })}>
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setRespondTarget({ request: req, status: "REJECTED" })}
                  >
                    Decline
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
          {items.length === 0 ? (
            <EmptyState
              message={isAdmin ? "No requests yet." : "You haven't requested any new team members yet."}
            />
          ) : null}
        </div>
      </Card>

      <RequestMemberModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
      <RespondModal target={respondTarget} onClose={() => setRespondTarget(null)} />
    </AppShell>
  );
}

function RespondModal({
  target,
  onClose,
}: {
  target: { request: MemberRequest; status: "APPROVED" | "REJECTED" } | null;
  onClose: () => void;
}) {
  const [note, setNote] = useState("");
  const respond = useRespondMemberRequest();

  const close = () => {
    setNote("");
    respond.reset();
    onClose();
  };

  if (!target) return null;

  return (
    <Modal isOpen={Boolean(target)} onClose={close} title={target.status === "APPROVED" ? "Approve request" : "Decline request"}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-ink-soft">{target.request.note}</p>
        <Textarea
          label="Note to the manager (optional)"
          placeholder={target.status === "APPROVED" ? "e.g. Go ahead, budget approved" : "e.g. Not right now, revisit next quarter"}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {respond.isError ? (
          <p className="rounded-2xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
            {getApiErrorMessage(respond.error, "Unable to respond")}
          </p>
        ) : null}

        <Button
          className="w-full"
          variant={target.status === "APPROVED" ? "primary" : "danger"}
          isLoading={respond.isPending}
          onClick={() =>
            respond.mutate(
              { id: target.request.id, payload: { status: target.status, responseNote: note.trim() || undefined } },
              { onSuccess: close },
            )
          }
        >
          {target.status === "APPROVED" ? "Confirm approval" : "Confirm decline"}
        </Button>
      </div>
    </Modal>
  );
}
