import { and, eq, ilike, isNull, or } from "drizzle-orm";
import type { Database } from "../../db/client";
import { designations } from "../../db/schema/index";
import { ConflictError, ForbiddenError, NotFoundError } from "../../shared/errors";
import type { CreateDesignationInput, ListDesignationsQuery, UpdateDesignationInput } from "./schemas";

export class DesignationService {
  constructor(private readonly db: Database) {}

  /** Every org sees the platform-wide defaults (organizationId NULL) plus its own custom titles. */
  async list(organizationId: string, query: ListDesignationsQuery = {}) {
    const conditions = [or(isNull(designations.organizationId), eq(designations.organizationId, organizationId))!];
    if (!query.includeInactive) conditions.push(eq(designations.isActive, true));

    return this.db.query.designations.findMany({
      where: and(...conditions),
      orderBy: (d, { asc }) => [asc(d.category), asc(d.name)],
    });
  }

  private async assertNoCollision(organizationId: string, name: string, excludeId?: string) {
    const existing = await this.db.query.designations.findMany({
      where: and(
        or(isNull(designations.organizationId), eq(designations.organizationId, organizationId)),
        ilike(designations.name, name),
      ),
    });
    if (existing.some((d) => d.id !== excludeId)) {
      throw new ConflictError(`A designation named "${name}" already exists`);
    }
  }

  async create(organizationId: string, input: CreateDesignationInput) {
    await this.assertNoCollision(organizationId, input.name);

    const [created] = await this.db
      .insert(designations)
      .values({ organizationId, name: input.name, category: input.category })
      .returning();
    if (!created) throw new Error("Failed to create designation");
    return created;
  }

  async update(organizationId: string, id: string, input: UpdateDesignationInput) {
    const existing = await this.db.query.designations.findFirst({ where: eq(designations.id, id) });
    if (!existing) throw new NotFoundError("Designation not found");
    // Platform-wide defaults (organizationId NULL) and other orgs' custom
    // titles are read-only from here — only this org's own titles are editable.
    if (existing.organizationId !== organizationId) {
      throw new ForbiddenError("You can only edit designations your own organization created");
    }

    if (input.name !== undefined && input.name.toLowerCase() !== existing.name.toLowerCase()) {
      await this.assertNoCollision(organizationId, input.name, id);
    }

    const [updated] = await this.db
      .update(designations)
      .set({
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        updatedAt: new Date(),
      })
      .where(eq(designations.id, id))
      .returning();
    if (!updated) throw new Error("Failed to update designation");
    return updated;
  }
}
