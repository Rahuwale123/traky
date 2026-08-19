import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { authHeader, createEmployee, createManager, createTestApp, login, seedOrg } from "../helpers";

describe("knowledge base", () => {
  let app: FastifyInstance;
  let org: Awaited<ReturnType<typeof seedOrg>>;

  beforeAll(async () => {
    app = await createTestApp();
    org = await seedOrg(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it("admin's GLOBAL share is auto-approved and visible to everyone", async () => {
    const create = await app.inject({
      method: "POST",
      url: "/api/v1/knowledge",
      headers: authHeader(org.admin),
      payload: { scope: "GLOBAL", title: "Company Handbook", url: "https://example.com/handbook" },
    });
    expect(create.statusCode).toBe(201);
    const resource = JSON.parse(create.body).data;
    expect(resource.status).toBe("APPROVED");

    for (const session of [org.admin, org.manager, org.employee]) {
      const res = await app.inject({ method: "GET", url: `/api/v1/knowledge/${resource.id}`, headers: authHeader(session) });
      expect(res.statusCode).toBe(200);
    }
  });

  it("manager's TEAM share is auto-approved and visible only to their own team", async () => {
    const otherManagerUser = await createManager(app, org.admin);
    const otherManagerSession = await login(app, otherManagerUser.email, "TestPass@123");
    const otherEmployeeUser = await createEmployee(app, org.admin, { managerId: otherManagerUser.id });
    const otherEmployeeSession = await login(app, otherEmployeeUser.email, "TestPass@123");

    const create = await app.inject({
      method: "POST",
      url: "/api/v1/knowledge",
      headers: authHeader(org.manager),
      payload: { scope: "TEAM", title: "Sprint Playbook", url: "https://example.com/playbook" },
    });
    expect(create.statusCode).toBe(201);
    const resource = JSON.parse(create.body).data;
    expect(resource.status).toBe("APPROVED");
    expect(resource.teamManagerId).toBe(org.manager.user.id);

    const asOwnEmployee = await app.inject({ method: "GET", url: `/api/v1/knowledge/${resource.id}`, headers: authHeader(org.employee) });
    expect(asOwnEmployee.statusCode).toBe(200);

    const asOtherEmployee = await app.inject({ method: "GET", url: `/api/v1/knowledge/${resource.id}`, headers: authHeader(otherEmployeeSession) });
    expect(asOtherEmployee.statusCode).toBe(404);

    const asOtherManager = await app.inject({ method: "GET", url: `/api/v1/knowledge/${resource.id}`, headers: authHeader(otherManagerSession) });
    expect(asOtherManager.statusCode).toBe(404);

    // Admin sees every team's resources regardless.
    const asAdmin = await app.inject({ method: "GET", url: `/api/v1/knowledge/${resource.id}`, headers: authHeader(org.admin) });
    expect(asAdmin.statusCode).toBe(200);
  });

  it("employee's share is PENDING, invisible to outsiders, and requires their own manager's approval", async () => {
    const outsider = await createEmployee(app, org.admin, { managerId: org.manager.user.id });
    const outsiderSession = await login(app, outsider.email, "TestPass@123");

    const create = await app.inject({
      method: "POST",
      url: "/api/v1/knowledge",
      headers: authHeader(org.employee),
      payload: { scope: "GLOBAL", title: "Interesting Article", url: "https://example.com/article" },
    });
    expect(create.statusCode).toBe(201);
    const resource = JSON.parse(create.body).data;
    expect(resource.status).toBe("PENDING");

    // Not visible org-wide yet, even though scope is GLOBAL — it's pending.
    const asOutsider = await app.inject({ method: "GET", url: `/api/v1/knowledge/${resource.id}`, headers: authHeader(outsiderSession) });
    expect(asOutsider.statusCode).toBe(404);

    // Creator can see their own pending submission.
    const asCreator = await app.inject({ method: "GET", url: `/api/v1/knowledge/${resource.id}`, headers: authHeader(org.employee) });
    expect(asCreator.statusCode).toBe(200);

    // Employee cannot approve their own submission.
    const selfApprove = await app.inject({ method: "POST", url: `/api/v1/knowledge/${resource.id}/approve`, headers: authHeader(org.employee) });
    expect(selfApprove.statusCode).toBe(403);

    // An unrelated manager (not this employee's manager) cannot approve it either.
    const otherManagerUser = await createManager(app, org.admin);
    const otherManagerSession = await login(app, otherManagerUser.email, "TestPass@123");
    const wrongManagerApprove = await app.inject({ method: "POST", url: `/api/v1/knowledge/${resource.id}/approve`, headers: authHeader(otherManagerSession) });
    expect(wrongManagerApprove.statusCode).toBe(403);

    // The employee's own manager can approve it.
    const approve = await app.inject({ method: "POST", url: `/api/v1/knowledge/${resource.id}/approve`, headers: authHeader(org.manager) });
    expect(approve.statusCode).toBe(200);
    expect(JSON.parse(approve.body).data.status).toBe("APPROVED");

    // Now that it's approved and GLOBAL, the outsider can see it.
    const afterApproval = await app.inject({ method: "GET", url: `/api/v1/knowledge/${resource.id}`, headers: authHeader(outsiderSession) });
    expect(afterApproval.statusCode).toBe(200);

    // Approving twice should fail — already reviewed.
    const approveAgain = await app.inject({ method: "POST", url: `/api/v1/knowledge/${resource.id}/approve`, headers: authHeader(org.manager) });
    expect(approveAgain.statusCode).toBe(400);
  });

  it("rejecting a pending submission records a note and notifies the creator", async () => {
    const create = await app.inject({
      method: "POST",
      url: "/api/v1/knowledge",
      headers: authHeader(org.employee),
      payload: { scope: "GLOBAL", title: "Questionable Link", url: "https://example.com/spam" },
    });
    const resource = JSON.parse(create.body).data;

    const reject = await app.inject({
      method: "POST",
      url: `/api/v1/knowledge/${resource.id}/reject`,
      headers: authHeader(org.manager),
      payload: { note: "Not relevant to the team" },
    });
    expect(reject.statusCode).toBe(200);
    const rejected = JSON.parse(reject.body).data;
    expect(rejected.status).toBe("REJECTED");
    expect(rejected.rejectionNote).toBe("Not relevant to the team");

    const notifications = JSON.parse(
      (await app.inject({ method: "GET", url: "/api/v1/notifications?pageSize=20", headers: authHeader(org.employee) })).body,
    ).data;
    expect(notifications.items.some((n: { type: string }) => n.type === "RESOURCE_REJECTED")).toBe(true);
  });

  it("PROJECT scope is only visible to people who can see that project", async () => {
    const project = JSON.parse(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/projects",
          headers: authHeader(org.manager),
          payload: { name: "Knowledge Test Project" },
        })
      ).body,
    ).data;
    await app.inject({
      method: "POST",
      url: "/api/v1/tasks",
      headers: authHeader(org.manager),
      payload: { projectId: project.id, title: "A task", assigneeId: org.employee.user.id },
    });

    const outsider = await createEmployee(app, org.admin, { managerId: org.manager.user.id });
    const outsiderSession = await login(app, outsider.email, "TestPass@123");

    const create = await app.inject({
      method: "POST",
      url: "/api/v1/knowledge",
      headers: authHeader(org.manager),
      payload: { scope: "PROJECT", title: "Project Spec", url: "https://example.com/spec", projectId: project.id },
    });
    expect(create.statusCode).toBe(201);
    const resource = JSON.parse(create.body).data;
    expect(resource.status).toBe("APPROVED");
    expect(resource.projectName).toBe("Knowledge Test Project");

    const asAssignedEmployee = await app.inject({ method: "GET", url: `/api/v1/knowledge/${resource.id}`, headers: authHeader(org.employee) });
    expect(asAssignedEmployee.statusCode).toBe(200);

    const asUnassignedEmployee = await app.inject({ method: "GET", url: `/api/v1/knowledge/${resource.id}`, headers: authHeader(outsiderSession) });
    expect(asUnassignedEmployee.statusCode).toBe(404);
  });

  it("a manager cannot share a resource to a project they don't own", async () => {
    const otherManagerUser = await createManager(app, org.admin);
    const otherManagerSession = await login(app, otherManagerUser.email, "TestPass@123");
    const otherProject = JSON.parse(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/projects",
          headers: authHeader(otherManagerSession),
          payload: { name: "Not Yours" },
        })
      ).body,
    ).data;

    const create = await app.inject({
      method: "POST",
      url: "/api/v1/knowledge",
      headers: authHeader(org.manager),
      payload: { scope: "PROJECT", title: "Sneaky Share", url: "https://example.com/x", projectId: otherProject.id },
    });
    expect(create.statusCode).toBe(403);
  });

  it("search only returns resources the searcher is allowed to see", async () => {
    const otherManagerUser = await createManager(app, org.admin);
    const outsider = await createEmployee(app, org.admin, { managerId: otherManagerUser.id });
    const outsiderSession = await login(app, outsider.email, "TestPass@123");

    await app.inject({
      method: "POST",
      url: "/api/v1/knowledge",
      headers: authHeader(org.manager),
      payload: { scope: "TEAM", title: "Zzyzx Unique Search Term", url: "https://example.com/secret-team-doc" },
    });

    const asOwnEmployee = JSON.parse(
      (await app.inject({ method: "GET", url: "/api/v1/knowledge?search=Zzyzx", headers: authHeader(org.employee) })).body,
    ).data;
    expect(asOwnEmployee.items.length).toBeGreaterThan(0);

    const asOutsider = JSON.parse(
      (await app.inject({ method: "GET", url: "/api/v1/knowledge?search=Zzyzx", headers: authHeader(outsiderSession) })).body,
    ).data;
    expect(asOutsider.items.length).toBe(0);
  });

  it("deleting is restricted to the creator or an admin", async () => {
    const create = await app.inject({
      method: "POST",
      url: "/api/v1/knowledge",
      headers: authHeader(org.manager),
      payload: { scope: "GLOBAL", title: "Deletable", url: "https://example.com/deletable" },
    });
    const resource = JSON.parse(create.body).data;

    const wrongDelete = await app.inject({ method: "DELETE", url: `/api/v1/knowledge/${resource.id}`, headers: authHeader(org.employee) });
    expect(wrongDelete.statusCode).toBe(403);

    const rightDelete = await app.inject({ method: "DELETE", url: `/api/v1/knowledge/${resource.id}`, headers: authHeader(org.manager) });
    expect(rightDelete.statusCode).toBe(200);

    const afterDelete = await app.inject({ method: "GET", url: `/api/v1/knowledge/${resource.id}`, headers: authHeader(org.admin) });
    expect(afterDelete.statusCode).toBe(404);
  });
});
