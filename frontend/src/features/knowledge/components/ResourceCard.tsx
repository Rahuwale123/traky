import { useState } from "react";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { Textarea } from "../../../components/ui/Textarea";
import { LinkIcon } from "../../../components/ui/icons";
import { getApiErrorMessage } from "../../../lib/api";
import { relativeTime } from "../../../lib/utils";
import { useAuthStore } from "../../../stores/authStore";
import { useApproveResource, useDeleteResource, useRejectResource } from "../hooks";
import { youtubeThumbnailUrl, youtubeVideoId } from "../youtube";
import type { KnowledgeResource } from "../types";

const SCOPE_LABEL: Record<KnowledgeResource["scope"], string> = {
  GLOBAL: "Whole org",
  TEAM: "Team",
  PROJECT: "Project",
};
const SCOPE_TONE: Record<KnowledgeResource["scope"], "dark" | "violet" | "lavender"> = {
  GLOBAL: "dark",
  TEAM: "violet",
  PROJECT: "lavender",
};

function scopeDetail(resource: KnowledgeResource) {
  if (resource.scope === "TEAM") return resource.teamManagerName ? `${resource.teamManagerName}'s team` : "Team";
  if (resource.scope === "PROJECT") return resource.projectName ?? "Project";
  return "Whole org";
}

export function ResourceCard({ resource }: { resource: KnowledgeResource }) {
  const userId = useAuthStore((s) => s.user?.id);
  const role = useAuthStore((s) => s.user?.role);
  const approve = useApproveResource();
  const reject = useRejectResource();
  const deleteResource = useDeleteResource();
  const [isRejecting, setIsRejecting] = useState(false);

  const canModerate = resource.status === "PENDING" && resource.createdById !== userId && (role === "ADMIN" || role === "MANAGER");
  const canDelete = resource.createdById === userId || role === "ADMIN";
  const videoId = youtubeVideoId(resource.url);

  return (
    <div className="flex gap-4 rounded-3xl border border-black/5 bg-white p-4 shadow-soft">
      {videoId ? (
        <a href={resource.url} target="_blank" rel="noreferrer" className="shrink-0 overflow-hidden rounded-2xl">
          <img src={youtubeThumbnailUrl(videoId)} alt="" className="h-20 w-32 object-cover" />
        </a>
      ) : (
        <a
          href={resource.url}
          target="_blank"
          rel="noreferrer"
          className="flex h-20 w-32 shrink-0 items-center justify-center rounded-2xl bg-black/[0.04] text-muted"
        >
          <LinkIcon width={22} height={22} />
        </a>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <a href={resource.url} target="_blank" rel="noreferrer" className="font-semibold text-ink hover:text-accent">
            {resource.title}
          </a>
          <div className="flex items-center gap-1.5">
            <Badge tone={SCOPE_TONE[resource.scope]}>{SCOPE_LABEL[resource.scope]}</Badge>
            {resource.status === "PENDING" ? <Badge tone="neutral">Pending</Badge> : null}
            {resource.status === "REJECTED" ? <Badge tone="rose">Declined</Badge> : null}
          </div>
        </div>

        {resource.description ? <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{resource.description}</p> : null}

        <p className="mt-2 text-xs text-muted">
          Shared by {resource.createdByName} to {scopeDetail(resource)} · {relativeTime(resource.createdAt)}
        </p>

        {resource.status === "REJECTED" && resource.rejectionNote ? (
          <p className="mt-1.5 text-xs text-rose-600">Declined: {resource.rejectionNote}</p>
        ) : null}

        {canModerate || canDelete ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {canModerate ? (
              <>
                <Button size="sm" isLoading={approve.isPending} onClick={() => approve.mutate(resource.id)}>
                  Approve
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setIsRejecting(true)}>
                  Decline
                </Button>
              </>
            ) : null}
            {canDelete ? (
              <Button size="sm" variant="ghost" isLoading={deleteResource.isPending} onClick={() => deleteResource.mutate(resource.id)}>
                Remove
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <RejectModal
        isOpen={isRejecting}
        onClose={() => setIsRejecting(false)}
        onReject={(note) => reject.mutate({ id: resource.id, note }, { onSuccess: () => setIsRejecting(false) })}
        isPending={reject.isPending}
        error={reject.isError ? getApiErrorMessage(reject.error, "Unable to decline") : undefined}
      />
    </div>
  );
}

function RejectModal({
  isOpen,
  onClose,
  onReject,
  isPending,
  error,
}: {
  isOpen: boolean;
  onClose: () => void;
  onReject: (note: string | undefined) => void;
  isPending: boolean;
  error: string | undefined;
}) {
  const [note, setNote] = useState("");

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Decline resource">
      <div className="flex flex-col gap-4">
        <Textarea
          label="Note (optional)"
          placeholder="Let them know why…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        {error ? <p className="rounded-2xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" isLoading={isPending} onClick={() => onReject(note.trim() || undefined)}>
            Decline
          </Button>
        </div>
      </div>
    </Modal>
  );
}
