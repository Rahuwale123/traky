import { ForbiddenError } from "../shared/errors";

/** A manager may only act on projects/employees that belong to their own team. */
export function assertOwnTeamResource(resourceManagerId: string | null | undefined, requesterId: string): void {
  if (resourceManagerId !== requesterId) {
    throw new ForbiddenError("You do not manage this resource");
  }
}
