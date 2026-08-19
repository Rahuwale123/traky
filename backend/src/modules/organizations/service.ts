import { eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { organizations } from "../../db/schema/index";
import { NotFoundError } from "../../shared/errors";
import { recordActivity } from "../../shared/audit";
import type { UpdateOrganizationInput } from "./schemas";

export class OrganizationService {
  constructor(private readonly db: Database) {}

  async getById(organizationId: string) {
    const org = await this.db.query.organizations.findFirst({ where: eq(organizations.id, organizationId) });
    if (!org || org.deletedAt) throw new NotFoundError("Organization not found");
    return org;
  }

  async update(organizationId: string, actorId: string, input: UpdateOrganizationInput) {
    await this.getById(organizationId);
    const [updated] = await this.db
      .update(organizations)
      .set({
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, organizationId))
      .returning();
    if (!updated) throw new NotFoundError("Organization not found");

    await recordActivity(this.db, {
      organizationId,
      actorId,
      type: "ORGANIZATION_UPDATED",
      entityType: "organization",
      entityId: organizationId,
      metadata: { changes: input },
    });

    return updated;
  }
}
