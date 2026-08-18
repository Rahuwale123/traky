import type { FastifyReply, FastifyRequest } from "fastify";
import type { Role } from "../shared/constants";
import { ForbiddenError, UnauthorizedError } from "../shared/errors";

/** Must run after `authenticate`. Restricts a route to the given roles. */
export function authorize(allowedRoles: Role[]) {
  return async function authorizeHandler(request: FastifyRequest, _reply: FastifyReply) {
    if (!request.authUser) {
      throw new UnauthorizedError();
    }
    if (!allowedRoles.includes(request.authUser.role)) {
      throw new ForbiddenError("You do not have permission to perform this action");
    }
  };
}
