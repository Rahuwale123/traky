import type { Database } from "../../db/client";
import { designations } from "../../db/schema/index";

export class DesignationService {
  constructor(private readonly db: Database) {}

  /** Small, platform-seeded catalog — no pagination needed. */
  async list() {
    return this.db.query.designations.findMany({
      orderBy: (d, { asc }) => [asc(d.category), asc(d.name)],
    });
  }
}
