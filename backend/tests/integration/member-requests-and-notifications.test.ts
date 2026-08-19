import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { authHeader, createTestApp, seedOrg } from "../helpers";

describe("member requests and notifications", () => {
  let app: FastifyInstance;
  let org: Awaited<ReturnType<typeof seedOrg>>;

  beforeAll(async () => {
    app = await createTestApp();
    org = await seedOrg(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it("employee cannot create a member request — manager-only", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/member-requests",
      headers: authHeader(org.employee),
      payload: { note: "Need help" },
    });
    expect(res.statusCode).toBe(403);
  });

  it("manager creates a request, admin sees and approves it, manager gets notified", async () => {
    const create = await app.inject({
      method: "POST",
      url: "/api/v1/member-requests",
      headers: authHeader(org.manager),
      payload: { note: "Need another engineer" },
    });
    expect(create.statusCode).toBe(201);
    const request = JSON.parse(create.body).data;

    const adminList = JSON.parse((await app.inject({ method: "GET", url: "/api/v1/member-requests", headers: authHeader(org.admin) })).body).data;
    expect(adminList.items.some((r: { id: string }) => r.id === request.id)).toBe(true);

    // Another manager shouldn't see this manager's request in their own scoped list.
    const managerList = JSON.parse((await app.inject({ method: "GET", url: "/api/v1/member-requests", headers: authHeader(org.manager) })).body).data;
    expect(managerList.items.every((r: { managerId: string }) => r.managerId === org.manager.user.id)).toBe(true);

    const respond = await app.inject({
      method: "PATCH",
      url: `/api/v1/member-requests/${request.id}`,
      headers: authHeader(org.admin),
      payload: { status: "APPROVED" },
    });
    expect(respond.statusCode).toBe(200);
    expect(JSON.parse(respond.body).data.status).toBe("APPROVED");

    // Responding twice should be rejected — already decided.
    const respondAgain = await app.inject({
      method: "PATCH",
      url: `/api/v1/member-requests/${request.id}`,
      headers: authHeader(org.admin),
      payload: { status: "REJECTED" },
    });
    expect(respondAgain.statusCode).toBe(400);

    const managerNotifications = JSON.parse(
      (await app.inject({ method: "GET", url: "/api/v1/notifications?pageSize=20", headers: authHeader(org.manager) })).body,
    ).data;
    expect(managerNotifications.items.some((n: { type: string }) => n.type === "MEMBER_REQUEST_RESPONDED")).toBe(true);
  });

  it("assigning a task notifies the assignee, and mark-read / mark-all-read work", async () => {
    const project = JSON.parse(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/projects",
          headers: authHeader(org.manager),
          payload: { name: "Notification Test Project" },
        })
      ).body,
    ).data;

    await app.inject({
      method: "POST",
      url: "/api/v1/tasks",
      headers: authHeader(org.manager),
      payload: { projectId: project.id, title: "Assigned task", assigneeId: org.employee.user.id },
    });

    const unreadBefore = JSON.parse(
      (await app.inject({ method: "GET", url: "/api/v1/notifications/unread-count", headers: authHeader(org.employee) })).body,
    ).data.count;
    expect(unreadBefore).toBeGreaterThan(0);

    const list = JSON.parse(
      (await app.inject({ method: "GET", url: "/api/v1/notifications?pageSize=20", headers: authHeader(org.employee) })).body,
    ).data;
    const taskNotification = list.items.find((n: { type: string }) => n.type === "TASK_ASSIGNED");
    expect(taskNotification).toBeDefined();

    await app.inject({ method: "POST", url: `/api/v1/notifications/${taskNotification.id}/read`, headers: authHeader(org.employee) });
    await app.inject({ method: "POST", url: "/api/v1/notifications/read-all", headers: authHeader(org.employee) });

    const unreadAfter = JSON.parse(
      (await app.inject({ method: "GET", url: "/api/v1/notifications/unread-count", headers: authHeader(org.employee) })).body,
    ).data.count;
    expect(unreadAfter).toBe(0);
  });
});
