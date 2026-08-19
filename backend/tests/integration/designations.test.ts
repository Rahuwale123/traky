import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { authHeader, createTestApp, seedOrg } from "../helpers";

describe("designations", () => {
  let app: FastifyInstance;
  let org: Awaited<ReturnType<typeof seedOrg>>;

  beforeAll(async () => {
    app = await createTestApp();
    org = await seedOrg(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it("manager can list but not create designations", async () => {
    const list = await app.inject({ method: "GET", url: "/api/v1/designations", headers: authHeader(org.manager) });
    expect(list.statusCode).toBe(200);

    const create = await app.inject({
      method: "POST",
      url: "/api/v1/designations",
      headers: authHeader(org.manager),
      payload: { name: "Rogue Title", category: "Engineering" },
    });
    expect(create.statusCode).toBe(403);
  });

  it("rejects a case-insensitive duplicate name", async () => {
    const first = await app.inject({
      method: "POST",
      url: "/api/v1/designations",
      headers: authHeader(org.admin),
      payload: { name: "Staff Engineer", category: "Engineering" },
    });
    expect(first.statusCode).toBe(201);

    const dupe = await app.inject({
      method: "POST",
      url: "/api/v1/designations",
      headers: authHeader(org.admin),
      payload: { name: "staff engineer", category: "Eng" },
    });
    expect(dupe.statusCode).toBe(409);
  });

  it("archiving hides a title from the default list but includeInactive still shows it", async () => {
    const created = JSON.parse(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/designations",
          headers: authHeader(org.admin),
          payload: { name: "Temp Title", category: "Ops" },
        })
      ).body,
    ).data;

    await app.inject({
      method: "PATCH",
      url: `/api/v1/designations/${created.id}`,
      headers: authHeader(org.admin),
      payload: { isActive: false },
    });

    const defaultList = JSON.parse((await app.inject({ method: "GET", url: "/api/v1/designations", headers: authHeader(org.manager) })).body).data;
    expect(defaultList.some((d: { id: string }) => d.id === created.id)).toBe(false);

    const withInactive = JSON.parse(
      (await app.inject({ method: "GET", url: "/api/v1/designations?includeInactive=true", headers: authHeader(org.admin) })).body,
    ).data;
    expect(withInactive.some((d: { id: string }) => d.id === created.id)).toBe(true);

    const restore = await app.inject({
      method: "PATCH",
      url: `/api/v1/designations/${created.id}`,
      headers: authHeader(org.admin),
      payload: { isActive: true },
    });
    expect(restore.statusCode).toBe(200);
    expect(JSON.parse(restore.body).data.isActive).toBe(true);
  });
});
