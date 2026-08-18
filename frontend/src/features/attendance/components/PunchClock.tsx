import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { ClockIcon } from "../../../components/ui/icons";
import { formatMinutes, formatTime } from "../../../lib/utils";
import { getApiErrorMessage } from "../../../lib/api";
import { useEndBreak, usePunchIn, usePunchOut, useStartBreak, useTodayAttendance } from "../hooks";

export function PunchClock() {
  // Polls every 60s (see useTodayAttendance), which is what keeps the
  // "logged today" readout advancing while punched in — no client-side timer needed.
  const today = useTodayAttendance();
  const punchIn = usePunchIn();
  const punchOut = usePunchOut();
  const startBreak = useStartBreak();
  const endBreak = useEndBreak();

  const data = today.data;
  const isPunchedIn = data?.isPunchedIn ?? false;
  const isOnBreak = data?.isOnBreak ?? false;
  const loggedMinutes = data?.totalMinutesToday ?? 0;
  const breakMinutes = data?.totalBreakMinutesToday ?? 0;

  const error =
    punchIn.error ?? punchOut.error ?? startBreak.error ?? endBreak.error;

  const statusText = isOnBreak
    ? data?.currentBreak
      ? `On break since ${formatTime(data.currentBreak.startedAt)}`
      : "On break"
    : isPunchedIn && data?.currentLog
      ? `Punched in at ${formatTime(data.currentLog.punchInAt)}`
      : "Not punched in yet";

  const iconTone = isOnBreak ? "bg-amber-500/10 text-amber-600" : isPunchedIn ? "bg-accent/10 text-accent" : "bg-black/5 text-muted";

  return (
    <Card className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <span className={`flex h-11 w-11 items-center justify-center rounded-full ${iconTone}`}>
          <ClockIcon width={20} height={20} />
        </span>
        <div>
          <p className="text-sm font-bold text-ink">{statusText}</p>
          <p className="mt-0.5 text-xs text-muted">
            {today.isLoading
              ? "Loading…"
              : `${formatMinutes(loggedMinutes)} logged today${breakMinutes > 0 ? ` · ${formatMinutes(breakMinutes)} on break` : ""}`}
          </p>
          {error ? (
            <p className="mt-1 text-xs text-rose-600">{getApiErrorMessage(error, "Something went wrong")}</p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!isPunchedIn ? (
          <Button variant="primary" isLoading={punchIn.isPending} onClick={() => punchIn.mutate()}>
            Punch in
          </Button>
        ) : (
          <>
            {isOnBreak ? (
              <Button variant="primary" isLoading={endBreak.isPending} onClick={() => endBreak.mutate()}>
                End break
              </Button>
            ) : (
              <Button variant="secondary" isLoading={startBreak.isPending} onClick={() => startBreak.mutate(undefined)}>
                Take a break
              </Button>
            )}
            <Button variant="dark" isLoading={punchOut.isPending} onClick={() => punchOut.mutate()}>
              Punch out
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
