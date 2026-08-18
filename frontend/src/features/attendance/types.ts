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

export interface TodayAttendance {
  isPunchedIn: boolean;
  currentLog: AttendanceLog | null;
  totalMinutesToday: number;
  logs: AttendanceLog[];
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
