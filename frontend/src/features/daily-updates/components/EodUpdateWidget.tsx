import { useEffect, useState, type FormEvent } from "react";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { Textarea } from "../../../components/ui/Textarea";
import { NoteIcon } from "../../../components/ui/icons";
import { getApiErrorMessage } from "../../../lib/api";
import { useTodayUpdate, useUpsertTodayUpdate } from "../hooks";

export function EodUpdateWidget() {
  const today = useTodayUpdate();
  const upsert = useUpsertTodayUpdate();

  const [isOpen, setIsOpen] = useState(false);
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

  const openModal = () => {
    upsert.reset();
    setIsOpen(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) return;
    upsert.mutate(
      { summary: summary.trim(), blockers: blockers.trim() || null, planForTomorrow: planForTomorrow.trim() || null },
      { onSuccess: () => setIsOpen(false) },
    );
  };

  return (
    <>
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${hasSubmitted ? "bg-accent/10 text-accent" : "bg-black/5 text-muted"}`}
          >
            <NoteIcon width={20} height={20} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink">Today's EOD update</p>
            <p className="mt-0.5 truncate text-xs text-muted">
              {today.isLoading ? "Loading…" : hasSubmitted ? today.data!.summary : "Not submitted yet"}
            </p>
          </div>
        </div>

        <Button variant={hasSubmitted ? "secondary" : "primary"} onClick={openModal}>
          {hasSubmitted ? "Edit update" : "Submit EOD"}
        </Button>
      </Card>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Today's EOD update">
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <Textarea
            label="What did you work on today?"
            placeholder="Summarize today's progress…"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            required
            autoFocus
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

          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={upsert.isPending}>
              {hasSubmitted ? "Save changes" : "Submit update"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
