export type AttendanceStatus = "PUNCHED_IN" | "PUNCHED_OUT";

export interface AttendanceLog {
  id: string;
  organizationId: string;
  userId: string;
  status: AttendanceStatus;
  punchInAt: string;
  punchOutAt: string | null;
  createdAt: string;
}

export interface BreakLog {
  id: string;
  organizationId: string;
  userId: string;
  attendanceLogId: string | null;
  reason: string | null;
  startedAt: string;
  endedAt: string | null;
}

export interface TodayAttendance {
  isPunchedIn: boolean;
  isOnBreak: boolean;
  currentLog: AttendanceLog | null;
  currentBreak: BreakLog | null;
  totalMinutesToday: number;
  totalBreakMinutesToday: number;
  logs: AttendanceLog[];
  breaks: BreakLog[];
}

export interface PersonAttendanceStatus {
  id: string;
  fullName: string;
  role: "MANAGER" | "EMPLOYEE";
  isPunchedIn: boolean;
  hasPunchedToday: boolean;
}

export interface AttendanceTodaySummary {
  totalPeople: number;
  punchedInCount: number;
  rate: number;
  people: PersonAttendanceStatus[];
}

export interface ListAttendanceParams {
  userId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}
