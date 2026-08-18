import { useState } from "react";
import { Avatar } from "../../../components/ui/Avatar";
import { Button } from "../../../components/ui/Button";
import { useAddComment, useComments } from "../hooks";

export function CommentsPanel({
  taskId,
  authorNameById = new Map(),
}: {
  taskId: string;
  authorNameById?: Map<string, string>;
}) {
  const comments = useComments(taskId);
  const addComment = useAddComment(taskId);
  const [body, setBody] = useState("");

  return (
    <div>
      <h3 className="text-sm font-semibold text-ink-soft">Comments</h3>
      <div className="mt-3 flex max-h-48 flex-col gap-3 overflow-y-auto pr-1">
        {(comments.data ?? []).map((c) => {
          const authorName = authorNameById.get(c.authorId) ?? "Team member";
          return (
            <div key={c.id} className="flex items-start gap-2.5">
              <Avatar name={authorName} size={26} />
              <div className="min-w-0 flex-1 rounded-2xl bg-black/[0.03] px-3.5 py-2.5">
                <p className="text-xs font-semibold text-ink-soft">{authorName}</p>
                <p className="text-sm text-ink">{c.body}</p>
                <p className="mt-1 text-[11px] text-muted">{new Date(c.createdAt).toLocaleString()}</p>
              </div>
            </div>
          );
        })}
        {comments.data?.length === 0 ? <p className="text-sm text-muted">No comments yet.</p> : null}
      </div>

      <form
        className="mt-3 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!body.trim()) return;
          addComment.mutate(body, { onSuccess: () => setBody("") });
        }}
      >
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment…"
          className="flex-1 rounded-full border border-black/10 bg-white px-4 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        <Button type="submit" size="sm" isLoading={addComment.isPending}>
          Send
        </Button>
      </form>
    </div>
  );
}
