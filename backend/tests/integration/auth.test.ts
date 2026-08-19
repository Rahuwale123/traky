import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { createTestApp, registerOrg } from "../helpers";

function extractRefreshCookie(res: { cookies: { name: string; value: string }[] }): string {
  const cookie = res.cookies.find((c) => c.name === "traky_refresh_token");
  if (!cookie) throw new Error("No refresh cookie in response");
  return cookie.value;
}

describe("auth", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("registering an org creates an ADMIN and returns a session", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register-org",
      payload: {
        organizationName: "Auth Test Co",
        adminFullName: "Auth Admin",
        adminEmail: "auth-admin@test.dev",
        adminPassword: "TestPass@123",
      },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.data.user.role).toBe("ADMIN");
    expect(body.data.accessToken).toBeTruthy();
    expect(extractRefreshCookie(res)).toBeTruthy();
  });

  it("rejects a duplicate email on register-org", async () => {
    await registerOrg(app, { adminEmail: "dupe@test.dev" });
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register-org",
      payload: {
        organizationName: "Another Co",
        adminFullName: "Someone Else",
        adminEmail: "dupe@test.dev",
        adminPassword: "TestPass@123",
      },
    });
    expect(res.statusCode).toBe(409);
  });

  it("rejects login with the wrong password without leaking whether the email exists", async () => {
    await registerOrg(app, { adminEmail: "wrongpass@test.dev" });
    const wrongPassword = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: "wrongpass@test.dev", password: "NotTheRightOne@123" },
    });
    const noSuchUser = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: "nobody-at-all@test.dev", password: "NotTheRightOne@123" },
    });
    expect(wrongPassword.statusCode).toBe(401);
    expect(noSuchUser.statusCode).toBe(401);
    expect(JSON.parse(wrongPassword.body).error.message).toBe(JSON.parse(noSuchUser.body).error.message);
  });

  it("rotates the refresh token on use and invalidates the old one", async () => {
    const registerRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register-org",
      payload: {
        organizationName: "Rotation Co",
        adminFullName: "Rotation Admin",
        adminEmail: "rotation@test.dev",
        adminPassword: "TestPass@123",
      },
    });
    const oldRefresh = extractRefreshCookie(registerRes);

    const refreshRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      cookies: { traky_refresh_token: oldRefresh },
    });
    expect(refreshRes.statusCode).toBe(200);
    const newRefresh = extractRefreshCookie(refreshRes);
    expect(newRefresh).not.toBe(oldRefresh);

    // The old token was single-use — reusing it must fail now.
    const reuseOld = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      cookies: { traky_refresh_token: oldRefresh },
    });
    expect(reuseOld.statusCode).toBe(401);

    // The new one still works.
    const useNew = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      cookies: { traky_refresh_token: newRefresh },
    });
    expect(useNew.statusCode).toBe(200);
  });

  it("logout revokes the refresh token", async () => {
    const registerRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register-org",
      payload: {
        organizationName: "Logout Co",
        adminFullName: "Logout Admin",
        adminEmail: "logout@test.dev",
        adminPassword: "TestPass@123",
      },
    });
    const refreshToken = extractRefreshCookie(registerRes);

    const logoutRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/logout",
      cookies: { traky_refresh_token: refreshToken },
    });
    expect(logoutRes.statusCode).toBe(200);

    const afterLogout = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      cookies: { traky_refresh_token: refreshToken },
    });
    expect(afterLogout.statusCode).toBe(401);
  });

  it("full password reset round trip: old password stops working, new one works, token is single-use", async () => {
    await registerOrg(app, { adminEmail: "reset-flow@test.dev", adminPassword: "OldPass@123" });

    const keysBefore = new Set(await app.redis.keys("pwreset:*"));
    const forgotRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/forgot-password",
      payload: { email: "reset-flow@test.dev" },
    });
    expect(forgotRes.statusCode).toBe(200);

    const keysAfter = await app.redis.keys("pwreset:*");
    const newKey = keysAfter.find((k) => !keysBefore.has(k));
    if (!newKey) throw new Error("No reset token was issued");
    const token = newKey.replace("pwreset:", "");

    const resetRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/reset-password",
      payload: { token, newPassword: "BrandNewPass@456" },
    });
    expect(resetRes.statusCode).toBe(200);

    const oldPasswordLogin = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: "reset-flow@test.dev", password: "OldPass@123" },
    });
    expect(oldPasswordLogin.statusCode).toBe(401);

    const newPasswordLogin = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: "reset-flow@test.dev", password: "BrandNewPass@456" },
    });
    expect(newPasswordLogin.statusCode).toBe(200);

    const reuseToken = await app.inject({
      method: "POST",
      url: "/api/v1/auth/reset-password",
      payload: { token, newPassword: "AnotherOne@789" },
    });
    expect(reuseToken.statusCode).toBe(400);
  });

  it("forgot-password responds identically whether or not the email is registered", async () => {
    const real = await app.inject({
      method: "POST",
      url: "/api/v1/auth/forgot-password",
      payload: { email: "some-real-admin@test.dev" },
    });
    const fake = await app.inject({
      method: "POST",
      url: "/api/v1/auth/forgot-password",
      payload: { email: "definitely-not-registered@test.dev" },
    });
    expect(real.statusCode).toBe(fake.statusCode);
    expect(real.body).toBe(fake.body);
  });
});
