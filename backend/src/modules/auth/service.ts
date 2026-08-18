import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import type { Redis } from "ioredis";
import type { FastifyInstance } from "fastify";
import { organizations, users } from "../../db/schema/index";
import { hashPassword, verifyPassword } from "../../utils/password";
import { parseDurationSeconds } from "../../utils/duration";
import { ConflictError, UnauthorizedError } from "../../shared/errors";
import { REDIS_KEYS } from "../../shared/constants";
import { env } from "../../config/env";
import type { AuthUserContext } from "../../shared/types";
import type { LoginInput, RegisterOrgInput } from "./schemas";

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || randomUUID().slice(0, 8)
  );
}

function toAuthContext(user: typeof users.$inferSelect): AuthUserContext {
  return {
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role,
    managerId: user.managerId,
  };
}

export class AuthService {
  constructor(
    private readonly db: Database,
    private readonly redis: Redis,
    private readonly app: FastifyInstance,
  ) {}

  async registerOrganization(input: RegisterOrgInput) {
    const existing = await this.db.query.users.findFirst({ where: eq(users.email, input.adminEmail) });
    if (existing) throw new ConflictError("Email already in use");

    const baseSlug = slugify(input.organizationName);
    let slug = baseSlug;
    let attempt = 0;
    while (await this.db.query.organizations.findFirst({ where: eq(organizations.slug, slug) })) {
      attempt += 1;
      slug = `${baseSlug}-${attempt}`;
    }

    const passwordHash = await hashPassword(input.adminPassword);

    const result = await this.db.transaction(async (tx) => {
      const [org] = await tx
        .insert(organizations)
        .values({ name: input.organizationName, slug })
        .returning();
      if (!org) throw new Error("Failed to create organization");

      const [admin] = await tx
        .insert(users)
        .values({
          organizationId: org.id,
          email: input.adminEmail,
          passwordHash,
          fullName: input.adminFullName,
          role: "ADMIN",
        })
        .returning();
      if (!admin) throw new Error("Failed to create admin user");

      return { org, admin };
    });

    return this.issueSession(result.admin);
  }

  async login(input: LoginInput) {
    const user = await this.db.query.users.findFirst({ where: eq(users.email, input.email) });
    if (!user || user.deletedAt || !user.isActive) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) throw new UnauthorizedError("Invalid email or password");

    return this.issueSession(user);
  }

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) throw new UnauthorizedError("Missing refresh token");

    const raw = await this.redis.get(REDIS_KEYS.refreshToken(refreshToken));
    if (!raw) throw new UnauthorizedError("Refresh token expired or revoked");

    const session = JSON.parse(raw) as { userId: string };
    const user = await this.db.query.users.findFirst({ where: eq(users.id, session.userId) });
    if (!user || user.deletedAt || !user.isActive) {
      throw new UnauthorizedError("Invalid session");
    }

    // Rotate: invalidate the used refresh token and issue a fresh pair.
    await this.redis.del(REDIS_KEYS.refreshToken(refreshToken));
    return this.issueSession(user);
  }

  async logout(refreshToken: string | undefined) {
    if (refreshToken) {
      await this.redis.del(REDIS_KEYS.refreshToken(refreshToken));
    }
  }

  private async issueSession(user: typeof users.$inferSelect) {
    const authContext = toAuthContext(user);
    const accessToken = this.app.jwt.sign(authContext);

    const refreshToken = randomUUID() + randomUUID();
    const refreshTtlSeconds = parseDurationSeconds(env.JWT_REFRESH_EXPIRES_IN);
    await this.redis.set(
      REDIS_KEYS.refreshToken(refreshToken),
      JSON.stringify({ userId: user.id }),
      "EX",
      refreshTtlSeconds,
    );

    return {
      user: {
        id: user.id,
        organizationId: user.organizationId,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        managerId: user.managerId,
        designationId: user.designationId,
      },
      accessToken,
      refreshToken,
      refreshTtlSeconds,
    };
  }
}
