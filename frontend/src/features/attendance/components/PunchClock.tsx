import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { ClockIcon } from "../../../components/ui/icons";
import { formatMinutes, formatTime } from "../../../lib/utils";
import { getApiErrorMessage } from "../../../lib/api";
import { useTodayAttendance, usePunchIn, usePunchOut } from "../hooks";

export function PunchClock() {
  // Polls every 60s (see useTodayAttendance), which is what keeps the
  // "logged today" readout advancing while punched in — no client-side timer needed.
  const today = useTodayAttendance();
  const punchIn = usePunchIn();
  const punchOut = usePunchOut();

  const data = today.data;
  const isPunchedIn = data?.isPunchedIn ?? false;
  const loggedMinutes = data?.totalMinutesToday ?? 0;

  const mutation = isPunchedIn ? punchOut : punchIn;
  const error = punchIn.error ?? punchOut.error;

  return (
    <Card className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-full ${isPunchedIn ? "bg-accent/10 text-accent" : "bg-black/5 text-muted"}`}
        >
          <ClockIcon width={20} height={20} />
        </span>
        <div>
          <p className="text-sm font-bold text-ink">
            {isPunchedIn && data?.currentLog
              ? `Punched in at ${formatTime(data.currentLog.punchInAt)}`
              : "Not punched in yet"}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {today.isLoading ? "Loading…" : `${formatMinutes(loggedMinutes)} logged today`}
          </p>
          {error ? (
            <p className="mt-1 text-xs text-rose-600">{getApiErrorMessage(error, "Something went wrong")}</p>
          ) : null}
        </div>
      </div>

      <Button
        variant={isPunchedIn ? "dark" : "primary"}
        isLoading={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {isPunchedIn ? "Punch out" : "Punch in"}
      </Button>
    </Card>
  );
}
