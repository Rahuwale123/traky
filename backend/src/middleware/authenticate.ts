import type { FastifyReply, FastifyRequest } from "fastify";
import { UnauthorizedError } from "../shared/errors";
import type { AuthUserContext } from "../shared/types";

export async function authenticate(request: FastifyRequest, _reply: FastifyReply) {
  try {
    const payload = await request.jwtVerify<AuthUserContext>();
    request.authUser = payload;
  } catch {
    throw new UnauthorizedError("Invalid or expired access token");
  }
}
