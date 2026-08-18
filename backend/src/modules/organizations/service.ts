import { eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { organizations } from "../../db/schema/index";
import { NotFoundError } from "../../shared/errors";
import type { UpdateOrganizationInput } from "./schemas";

export class OrganizationService {
  constructor(private readonly db: Database) {}

  async getById(organizationId: string) {
    const org = await this.db.query.organizations.findFirst({ where: eq(organizations.id, organizationId) });
    if (!org || org.deletedAt) throw new NotFoundError("Organization not found");
    return org;
  }

  async update(organizationId: string, input: UpdateOrganizationInput) {
    await this.getById(organizationId);
    const [updated] = await this.db
      .update(organizations)
      .set({ name: input.name, updatedAt: new Date() })
      .where(eq(organizations.id, organizationId))
      .returning();
    if (!updated) throw new NotFoundError("Organization not found");
    return updated;
  }
}
