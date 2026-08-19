import { afterAll, beforeAll } from "vitest";
import { sql } from "drizzle-orm";
import { db, pool } from "../src/db/client";

const TABLES = [
  "messages",
  "conversation_participants",
  "conversations",
  "member_requests",
  "notifications",
  "activities",
  "daily_updates",
  "break_logs",
  "attendance_logs",
  "task_comments",
  "tasks",
  "projects",
  "users",
  "designations",
  "organizations",
];

// Runs once per test file (each file gets an isolated module registry under
// Vitest's default isolation) — clears the slate, then each file seeds and
// shares its own fixtures across its `it()` blocks via its own beforeAll.
beforeAll(async () => {
  await db.execute(sql.raw(`TRUNCATE TABLE ${TABLES.join(", ")} RESTART IDENTITY CASCADE`));
});

afterAll(async () => {
  // Integration test files close their own app (which ends this same shared
  // pool via dbPlugin's onClose hook) — only swallow the resulting double-end,
  // since anything else here is a real teardown failure worth seeing.
  await pool.end().catch((err: Error) => {
    if (!err.message.includes("Called end on pool more than once")) throw err;
  });
});
