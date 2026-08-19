import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { authHeader, createEmployee, createManager, createTestApp, login, seedOrg } from "../helpers";

describe("within-org RBAC boundaries", () => {
  let app: FastifyInstance;
  let org: Awaited<ReturnType<typeof seedOrg>>;

  beforeAll(async () => {
    app = await createTestApp();
    org = await seedOrg(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it("employee is blocked from admin-only endpoints", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/users?pageSize=5", headers: authHeader(org.employee) });
    expect(res.statusCode).toBe(403);
  });

  it("employee is blocked from manager-only endpoints", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/users/my-team", headers: authHeader(org.employee) });
    expect(res.statusCode).toBe(403);
  });

  it("manager is blocked from admin-only endpoints", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/member-requests", headers: authHeader(org.manager) });
    // Managers CAN list their own member requests — this route is ADMIN+MANAGER.
    // Use a route that's genuinely ADMIN-only instead.
    expect(res.statusCode).toBe(200);

    const adminOnly = await app.inject({ method: "GET", url: "/api/v1/users?pageSize=5", headers: authHeader(org.manager) });
    expect(adminOnly.statusCode).toBe(403);
  });

  it("an unrelated manager cannot see another manager's team member via getById", async () => {
    const otherManagerUser = await createManager(app, org.admin);
    const otherManagerSession = await login(app, otherManagerUser.email, "TestPass@123");

    // getById is ADMIN-only by design (managers use /my-team instead) — confirm
    // a manager can't reach it at all, regardless of whose employee it is.
    const res = await app.inject({
      method: "GET",
      url: `/api/v1/users/${org.employee.user.id}`,
      headers: authHeader(otherManagerSession),
    });
    expect(res.statusCode).toBe(403);
  });

  it("a manager's /my-team only returns their own reports, not another manager's", async () => {
    const otherManagerUser = await createManager(app, org.admin);
    const otherManagerSession = await login(app, otherManagerUser.email, "TestPass@123");
    const otherEmployeeUser = await createEmployee(app, org.admin, { managerId: otherManagerUser.id });

    const res = await app.inject({ method: "GET", url: "/api/v1/users/my-team?pageSize=100", headers: authHeader(otherManagerSession) });
    const ids = JSON.parse(res.body).data.items.map((u: { id: string }) => u.id);
    expect(ids).toContain(otherEmployeeUser.id);
    expect(ids).not.toContain(org.employee.user.id);
  });

  it("an employee can only update the status of tasks assigned to them", async () => {
    const project = JSON.parse(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/projects",
          headers: authHeader(org.manager),
          payload: { name: "RBAC Test Project" },
        })
      ).body,
    ).data;
    const unassignedTask = JSON.parse(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/tasks",
          headers: authHeader(org.manager),
          payload: { projectId: project.id, title: "Not assigned to this employee" },
        })
      ).body,
    ).data;

    const res = await app.inject({
      method: "PATCH",
      url: `/api/v1/tasks/${unassignedTask.id}/status`,
      headers: authHeader(org.employee),
      payload: { status: "IN_PROGRESS" },
    });
    expect(res.statusCode).toBe(403);
  });

  it("only the owning manager can delete a task, not another manager in the same org", async () => {
    const project = JSON.parse(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/projects",
          headers: authHeader(org.manager),
          payload: { name: "Owned By Manager 1" },
        })
      ).body,
    ).data;
    const task = JSON.parse(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/tasks",
          headers: authHeader(org.manager),
          payload: { projectId: project.id, title: "Task" },
        })
      ).body,
    ).data;

    const otherManagerUser = await createManager(app, org.admin);
    const otherManagerSession = await login(app, otherManagerUser.email, "TestPass@123");

    const res = await app.inject({
      method: "DELETE",
      url: `/api/v1/tasks/${task.id}`,
      headers: authHeader(otherManagerSession),
    });
    // Same-org peer: existence isn't hidden (unlike cross-org, which 404s),
    // but acting on a project you don't own is still forbidden.
    expect(res.statusCode).toBe(403);
  });
});
