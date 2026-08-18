import { NotFoundError } from "../shared/errors";

/**
 * Every service query must filter by organization_id at the SQL level — this
 * is a defense-in-depth check for rows already fetched, so a query that
 * forgets the WHERE clause fails loudly instead of leaking cross-org data.
 * Returns NotFound (not Forbidden) so org membership isn't leaked either.
 */
export function assertSameOrg(resourceOrgId: string | null | undefined, requesterOrgId: string): void {
  if (!resourceOrgId || resourceOrgId !== requesterOrgId) {
    throw new NotFoundError("Resource not found");
  }
}
