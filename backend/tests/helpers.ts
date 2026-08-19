import { buildApp } from "../src/app";
import type { FastifyInstance } from "fastify";

export async function createTestApp(): Promise<FastifyInstance> {
  const app = await buildApp();
  await app.ready();
  return app;
}

export interface Session {
  accessToken: string;
  user: {
    id: string;
    organizationId: string;
    email: string;
    fullName: string;
    role: "ADMIN" | "MANAGER" | "EMPLOYEE";
    managerId: string | null;
    designationId: string | null;
  };
}

function unique(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseOrThrow(res: { statusCode: number; body: string }, expected: number, label: string) {
  if (res.statusCode !== expected) {
    throw new Error(`${label} failed: expected ${expected}, got ${res.statusCode} — ${res.body}`);
  }
  return JSON.parse(res.body).data;
}

export async function registerOrg(
  app: FastifyInstance,
  overrides: Partial<{ organizationName: string; adminFullName: string; adminEmail: string; adminPassword: string }> = {},
): Promise<Session> {
  const res = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register-org",
    payload: {
      organizationName: overrides.organizationName ?? unique("Test Org"),
      adminFullName: overrides.adminFullName ?? "Test Admin",
      adminEmail: overrides.adminEmail ?? `${unique("admin")}@test.dev`,
      adminPassword: overrides.adminPassword ?? "TestPass@123",
    },
  });
  return parseOrThrow(res, 201, "registerOrg");
}

export async function login(app: FastifyInstance, email: string, password: string): Promise<Session> {
  const res = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email, password } });
  return parseOrThrow(res, 200, "login");
}

export function authHeader(session: Session) {
  return { authorization: `Bearer ${session.accessToken}` };
}

export async function createManager(
  app: FastifyInstance,
  adminSession: Session,
  overrides: Partial<{ fullName: string; email: string; password: string; designationId: string }> = {},
) {
  const res = await app.inject({
    method: "POST",
    url: "/api/v1/users/managers",
    headers: authHeader(adminSession),
    payload: {
      fullName: overrides.fullName ?? "Test Manager",
      email: overrides.email ?? `${unique("manager")}@test.dev`,
      password: overrides.password ?? "TestPass@123",
      ...(overrides.designationId ? { designationId: overrides.designationId } : {}),
    },
  });
  return parseOrThrow(res, 201, "createManager");
}

export async function createEmployee(
  app: FastifyInstance,
  adminSession: Session,
  overrides: Partial<{ fullName: string; email: string; password: string; managerId: string; designationId: string }> = {},
) {
  const res = await app.inject({
    method: "POST",
    url: "/api/v1/users/employees",
    headers: authHeader(adminSession),
    payload: {
      fullName: overrides.fullName ?? "Test Employee",
      email: overrides.email ?? `${unique("employee")}@test.dev`,
      password: overrides.password ?? "TestPass@123",
      ...(overrides.managerId ? { managerId: overrides.managerId } : {}),
      ...(overrides.designationId ? { designationId: overrides.designationId } : {}),
    },
  });
  return parseOrThrow(res, 201, "createEmployee");
}

/** A fully populated org: admin, one manager, one employee reporting to that manager. */
export async function seedOrg(app: FastifyInstance) {
  const admin = await registerOrg(app);
  const managerUser = await createManager(app, admin);
  const managerSession = await login(app, managerUser.email, "TestPass@123");
  const employeeUser = await createEmployee(app, admin, { managerId: managerUser.id });
  const employeeSession = await login(app, employeeUser.email, "TestPass@123");
  return { admin, manager: managerSession, employee: employeeSession };
}
