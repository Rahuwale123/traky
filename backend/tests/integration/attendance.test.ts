import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { authHeader, createTestApp, seedOrg } from "../helpers";

describe("attendance", () => {
  let app: FastifyInstance;
  let org: Awaited<ReturnType<typeof seedOrg>>;

  beforeAll(async () => {
    app = await createTestApp();
    org = await seedOrg(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it("punch-in, break, and punch-out follow the expected state machine", async () => {
    const punchIn = await app.inject({ method: "POST", url: "/api/v1/attendance/punch-in", headers: authHeader(org.employee) });
    expect(punchIn.statusCode).toBe(201);

    // Can't punch in again while already punched in.
    const doublePunchIn = await app.inject({ method: "POST", url: "/api/v1/attendance/punch-in", headers: authHeader(org.employee) });
    expect(doublePunchIn.statusCode).toBe(409);

    const startBreak = await app.inject({
      method: "POST",
      url: "/api/v1/attendance/break/start",
      headers: authHeader(org.employee),
      payload: {},
    });
    expect(startBreak.statusCode).toBe(201);

    // Can't start a second concurrent break.
    const doubleBreak = await app.inject({
      method: "POST",
      url: "/api/v1/attendance/break/start",
      headers: authHeader(org.employee),
      payload: {},
    });
    expect(doubleBreak.statusCode).toBe(409);

    const endBreak = await app.inject({ method: "POST", url: "/api/v1/attendance/break/end", headers: authHeader(org.employee) });
    expect(endBreak.statusCode).toBe(200);

    // Can't end a break that isn't open.
    const doubleEndBreak = await app.inject({ method: "POST", url: "/api/v1/attendance/break/end", headers: authHeader(org.employee) });
    expect(doubleEndBreak.statusCode).toBe(400);

    const punchOut = await app.inject({ method: "POST", url: "/api/v1/attendance/punch-out", headers: authHeader(org.employee) });
    expect(punchOut.statusCode).toBe(200);

    // Can't punch out again without punching in first.
    const doublePunchOut = await app.inject({ method: "POST", url: "/api/v1/attendance/punch-out", headers: authHeader(org.employee) });
    expect(doublePunchOut.statusCode).toBe(400);
  });

  it("punching out auto-closes a dangling open break", async () => {
    await app.inject({ method: "POST", url: "/api/v1/attendance/punch-in", headers: authHeader(org.manager) });
    await app.inject({ method: "POST", url: "/api/v1/attendance/break/start", headers: authHeader(org.manager), payload: {} });

    const punchOut = await app.inject({ method: "POST", url: "/api/v1/attendance/punch-out", headers: authHeader(org.manager) });
    expect(punchOut.statusCode).toBe(200);

    const today = JSON.parse((await app.inject({ method: "GET", url: "/api/v1/attendance/today", headers: authHeader(org.manager) })).body).data;
    expect(today.isOnBreak).toBe(false);
    expect(today.breaks[0].endedAt).not.toBeNull();
  });

  it("admins can punch in and show up in their own org-wide today-summary", async () => {
    const punchIn = await app.inject({ method: "POST", url: "/api/v1/attendance/punch-in", headers: authHeader(org.admin) });
    expect(punchIn.statusCode).toBe(201);

    const summary = JSON.parse(
      (await app.inject({ method: "GET", url: "/api/v1/attendance/today-summary", headers: authHeader(org.admin) })).body,
    ).data;
    const adminEntry = summary.people.find((p: { id: string }) => p.id === org.admin.user.id);
    expect(adminEntry).toBeDefined();
    expect(adminEntry.isPunchedIn).toBe(true);

    await app.inject({ method: "POST", url: "/api/v1/attendance/punch-out", headers: authHeader(org.admin) });
  });

  it("date-filtered attendance queries route through the org's configured timezone", async () => {
    // The DST/offset boundary math itself is exhaustively covered with fixed
    // dates in tests/unit/timezone.test.ts — this just confirms the attendance
    // module actually wires the org's timezone into its date-range queries,
    // using two zones on opposite sides of UTC so at least one of them must
    // disagree with a naive server-local interpretation of "today".
    const punchIn = JSON.parse(
      (await app.inject({ method: "POST", url: "/api/v1/attendance/punch-in", headers: authHeader(org.employee) })).body,
    ).data;
    await app.inject({ method: "POST", url: "/api/v1/attendance/punch-out", headers: authHeader(org.employee) });

    const punchInInstant = new Date(punchIn.punchInAt);
    const dateInZone = (tz: string) =>
      new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(
        punchInInstant,
      );

    for (const timezone of ["Pacific/Kiritimati", "Etc/GMT+12"]) {
      await app.inject({
        method: "PATCH",
        url: "/api/v1/organizations/me",
        headers: authHeader(org.admin),
        payload: { timezone },
      });

      const res = await app.inject({
        method: "GET",
        url: `/api/v1/attendance?date=${dateInZone(timezone)}&userId=${org.employee.user.id}`,
        headers: authHeader(org.admin),
      });
      expect(JSON.parse(res.body).data.pagination.total).toBeGreaterThan(0);
    }

    await app.inject({
      method: "PATCH",
      url: "/api/v1/organizations/me",
      headers: authHeader(org.admin),
      payload: { timezone: "UTC" },
    });
  });
});
