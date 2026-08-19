import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { authHeader, createTestApp, seedOrg } from "../helpers";

describe("multi-tenant isolation", () => {
  let app: FastifyInstance;
  let orgA: Awaited<ReturnType<typeof seedOrg>>;
  let orgB: Awaited<ReturnType<typeof seedOrg>>;

  beforeAll(async () => {
    app = await createTestApp();
    orgA = await seedOrg(app);
    orgB = await seedOrg(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it("org B's admin cannot fetch org A's user by id", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/v1/users/${orgA.employee.user.id}`,
      headers: authHeader(orgB.admin),
    });
    expect(res.statusCode).toBe(404);
  });

  it("org B's admin does not see org A's users in the org-wide list", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/users?pageSize=100", headers: authHeader(orgB.admin) });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    const ids = body.data.items.map((u: { id: string }) => u.id);
    expect(ids).not.toContain(orgA.admin.user.id);
    expect(ids).not.toContain(orgA.employee.user.id);
  });

  it("a project created in org A is invisible to org B's manager", async () => {
    const create = await app.inject({
      method: "POST",
      url: "/api/v1/projects",
      headers: authHeader(orgA.manager),
      payload: { name: "Org A Secret Project" },
    });
    expect(create.statusCode).toBe(201);
    const project = JSON.parse(create.body).data;

    const getAsOrgB = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project.id}`,
      headers: authHeader(orgB.manager),
    });
    expect(getAsOrgB.statusCode).toBe(404);

    const listAsOrgB = await app.inject({
      method: "GET",
      url: "/api/v1/projects?pageSize=100",
      headers: authHeader(orgB.admin),
    });
    const ids = JSON.parse(listAsOrgB.body).data.items.map((p: { id: string }) => p.id);
    expect(ids).not.toContain(project.id);
  });

  it("a task in org A is invisible to org B, even by direct id lookup", async () => {
    const project = JSON.parse(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/projects",
          headers: authHeader(orgA.manager),
          payload: { name: "Org A Project" },
        })
      ).body,
    ).data;
    const task = JSON.parse(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/tasks",
          headers: authHeader(orgA.manager),
          payload: { projectId: project.id, title: "Org A Secret Task" },
        })
      ).body,
    ).data;

    const res = await app.inject({ method: "GET", url: `/api/v1/tasks/${task.id}`, headers: authHeader(orgB.manager) });
    expect(res.statusCode).toBe(404);
  });

  it("org B cannot start a DIRECT chat with an org A user (not a valid contact)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/chat/conversations",
      headers: authHeader(orgB.admin),
      payload: { type: "DIRECT", participantId: orgA.employee.user.id },
    });
    expect(res.statusCode).toBe(404);
  });

  it("org B's admin cannot edit a custom designation created by org A", async () => {
    const created = JSON.parse(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/designations",
          headers: authHeader(orgA.admin),
          payload: { name: "Org A Only Title", category: "Engineering" },
        })
      ).body,
    ).data;

    const res = await app.inject({
      method: "PATCH",
      url: `/api/v1/designations/${created.id}`,
      headers: authHeader(orgB.admin),
      payload: { category: "Hacked" },
    });
    expect(res.statusCode).toBe(403);

    const listAsOrgB = await app.inject({ method: "GET", url: "/api/v1/designations", headers: authHeader(orgB.admin) });
    const names = JSON.parse(listAsOrgB.body).data.map((d: { name: string }) => d.name);
    expect(names).not.toContain("Org A Only Title");
  });

  it("org B's admin cannot see org A's activity log entries", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/activities?pageSize=100", headers: authHeader(orgB.admin) });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    const orgIds = new Set(body.data.items.map((a: { organizationId: string }) => a.organizationId));
    expect(orgIds.has(orgA.admin.user.organizationId)).toBe(false);
  });
});
