import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { authHeader, createEmployee, createTestApp, login, seedOrg } from "../helpers";

describe("chat", () => {
  let app: FastifyInstance;
  let org: Awaited<ReturnType<typeof seedOrg>>;

  beforeAll(async () => {
    app = await createTestApp();
    org = await seedOrg(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it("any org member is a valid chat contact, regardless of reporting line", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/chat/contacts", headers: authHeader(org.employee) });
    expect(res.statusCode).toBe(200);
    const ids = JSON.parse(res.body).data.map((c: { id: string }) => c.id);
    expect(ids).toContain(org.admin.user.id);
    expect(ids).toContain(org.manager.user.id);
  });

  it("creating the same DIRECT conversation twice reuses the existing one", async () => {
    const first = JSON.parse(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/chat/conversations",
          headers: authHeader(org.manager),
          payload: { type: "DIRECT", participantId: org.employee.user.id },
        })
      ).body,
    ).data;

    const second = JSON.parse(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/chat/conversations",
          headers: authHeader(org.manager),
          payload: { type: "DIRECT", participantId: org.employee.user.id },
        })
      ).body,
    ).data;

    expect(second.id).toBe(first.id);
  });

  it("sending a message updates the recipient's unread count and marking read clears it", async () => {
    const convo = JSON.parse(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/chat/conversations",
          headers: authHeader(org.admin),
          payload: { type: "DIRECT", participantId: org.employee.user.id },
        })
      ).body,
    ).data;

    await app.inject({
      method: "POST",
      url: `/api/v1/chat/conversations/${convo.id}/messages`,
      headers: authHeader(org.admin),
      payload: { body: "Hello there" },
    });

    const unreadBefore = JSON.parse(
      (await app.inject({ method: "GET", url: "/api/v1/chat/unread-count", headers: authHeader(org.employee) })).body,
    ).data.count;
    expect(unreadBefore).toBeGreaterThan(0);

    await app.inject({ method: "POST", url: `/api/v1/chat/conversations/${convo.id}/read`, headers: authHeader(org.employee) });

    const unreadAfter = JSON.parse(
      (await app.inject({ method: "GET", url: "/api/v1/chat/unread-count", headers: authHeader(org.employee) })).body,
    ).data.count;
    expect(unreadAfter).toBe(0);
  });

  it("a group conversation is only visible to its participants — a non-member gets 404, not a data leak", async () => {
    const outsider = await createEmployee(app, org.admin, { managerId: org.manager.user.id });
    const outsiderSession = await login(app, outsider.email, "TestPass@123");

    const group = JSON.parse(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/chat/conversations",
          headers: authHeader(org.manager),
          payload: { type: "GROUP", name: "Project Team", participantIds: [org.employee.user.id] },
        })
      ).body,
    ).data;

    await app.inject({
      method: "POST",
      url: `/api/v1/chat/conversations/${group.id}/messages`,
      headers: authHeader(org.manager),
      payload: { body: "Welcome to the group" },
    });

    const asMember = await app.inject({
      method: "GET",
      url: `/api/v1/chat/conversations/${group.id}/messages`,
      headers: authHeader(org.employee),
    });
    expect(asMember.statusCode).toBe(200);

    const asOutsider = await app.inject({
      method: "GET",
      url: `/api/v1/chat/conversations/${group.id}/messages`,
      headers: authHeader(outsiderSession),
    });
    expect(asOutsider.statusCode).toBe(404);
  });

  it("leaving a group removes access, and re-added participants regain it", async () => {
    const member = await createEmployee(app, org.admin, { managerId: org.manager.user.id });
    const memberSession = await login(app, member.email, "TestPass@123");

    const group = JSON.parse(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/chat/conversations",
          headers: authHeader(org.manager),
          payload: { type: "GROUP", name: "Temp Group", participantIds: [member.id] },
        })
      ).body,
    ).data;

    const leave = await app.inject({ method: "POST", url: `/api/v1/chat/conversations/${group.id}/leave`, headers: authHeader(memberSession) });
    expect(leave.statusCode).toBe(200);

    const afterLeave = await app.inject({
      method: "GET",
      url: `/api/v1/chat/conversations/${group.id}/messages`,
      headers: authHeader(memberSession),
    });
    expect(afterLeave.statusCode).toBe(404);

    const readd = await app.inject({
      method: "POST",
      url: `/api/v1/chat/conversations/${group.id}/participants`,
      headers: authHeader(org.manager),
      payload: { participantIds: [member.id] },
    });
    expect(readd.statusCode).toBe(200);

    const afterReadd = await app.inject({
      method: "GET",
      url: `/api/v1/chat/conversations/${group.id}/messages`,
      headers: authHeader(memberSession),
    });
    expect(afterReadd.statusCode).toBe(200);
  });

  it("cannot add participants to or leave a DIRECT conversation", async () => {
    const convo = JSON.parse(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/chat/conversations",
          headers: authHeader(org.admin),
          payload: { type: "DIRECT", participantId: org.manager.user.id },
        })
      ).body,
    ).data;

    const addRes = await app.inject({
      method: "POST",
      url: `/api/v1/chat/conversations/${convo.id}/participants`,
      headers: authHeader(org.admin),
      payload: { participantIds: [org.employee.user.id] },
    });
    expect(addRes.statusCode).toBe(400);

    const leaveRes = await app.inject({ method: "POST", url: `/api/v1/chat/conversations/${convo.id}/leave`, headers: authHeader(org.admin) });
    expect(leaveRes.statusCode).toBe(400);
  });
});
