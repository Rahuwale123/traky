import { useEffect, useState, type FormEvent } from "react";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Textarea } from "../../../components/ui/Textarea";
import { NoteIcon } from "../../../components/ui/icons";
import { getApiErrorMessage } from "../../../lib/api";
import { useTodayUpdate, useUpsertTodayUpdate } from "../hooks";

export function EodUpdateWidget() {
  const today = useTodayUpdate();
  const upsert = useUpsertTodayUpdate();

  const [isEditing, setIsEditing] = useState(false);
  const [summary, setSummary] = useState("");
  const [blockers, setBlockers] = useState("");
  const [planForTomorrow, setPlanForTomorrow] = useState("");

  const hasSubmitted = Boolean(today.data);

  useEffect(() => {
    if (today.data) {
      setSummary(today.data.summary);
      setBlockers(today.data.blockers ?? "");
      setPlanForTomorrow(today.data.planForTomorrow ?? "");
    }
  }, [today.data]);

  const showForm = !hasSubmitted || isEditing;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) return;
    upsert.mutate(
      { summary: summary.trim(), blockers: blockers.trim() || null, planForTomorrow: planForTomorrow.trim() || null },
      { onSuccess: () => setIsEditing(false) },
    );
  };

  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${hasSubmitted ? "bg-accent/10 text-accent" : "bg-black/5 text-muted"}`}
          >
            <NoteIcon width={20} height={20} />
          </span>
          <div>
            <p className="text-sm font-bold text-ink">Today's EOD update</p>
            <p className="mt-0.5 text-xs text-muted">
              {today.isLoading ? "Loading…" : hasSubmitted ? "Submitted" : "Not submitted yet"}
            </p>
          </div>
        </div>
        {hasSubmitted && !isEditing ? (
          <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        ) : null}
      </div>

      {showForm ? (
        <form className="mt-4 flex flex-col gap-3" onSubmit={handleSubmit}>
          <Textarea
            label="What did you work on today?"
            placeholder="Summarize today's progress…"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            required
          />
          <Textarea
            label="Any blockers? (optional)"
            placeholder="Anything slowing you down…"
            rows={2}
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
          />
          <Textarea
            label="Plan for tomorrow (optional)"
            placeholder="What's next…"
            rows={2}
            value={planForTomorrow}
            onChange={(e) => setPlanForTomorrow(e.target.value)}
          />

          {upsert.isError ? (
            <p className="rounded-2xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
              {getApiErrorMessage(upsert.error, "Unable to submit update")}
            </p>
          ) : null}

          <div className="flex gap-2">
            <Button type="submit" size="sm" isLoading={upsert.isPending}>
              {hasSubmitted ? "Save changes" : "Submit update"}
            </Button>
            {hasSubmitted ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      ) : today.data ? (
        <div className="mt-4 flex flex-col gap-2 rounded-2xl bg-black/[0.025] p-4">
          <p className="text-sm text-ink">{today.data.summary}</p>
          {today.data.blockers ? (
            <p className="text-xs text-muted">
              <span className="font-semibold text-ink-soft">Blockers:</span> {today.data.blockers}
            </p>
          ) : null}
          {today.data.planForTomorrow ? (
            <p className="text-xs text-muted">
              <span className="font-semibold text-ink-soft">Tomorrow:</span> {today.data.planForTomorrow}
            </p>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
