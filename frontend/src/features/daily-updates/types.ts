export interface DailyUpdate {
  id: string;
  organizationId: string;
  userId: string;
  date: string;
  summary: string;
  blockers: string | null;
  planForTomorrow: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PersonSubmissionStatus {
  id: string;
  fullName: string;
  role: "MANAGER" | "EMPLOYEE";
  hasSubmittedToday: boolean;
}

export interface DailyUpdateTodaySummary {
  totalPeople: number;
  submittedCount: number;
  rate: number;
  people: PersonSubmissionStatus[];
}

export interface UpsertTodayUpdatePayload {
  summary: string;
  blockers?: string | null;
  planForTomorrow?: string | null;
}

export interface ListDailyUpdatesParams {
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}
