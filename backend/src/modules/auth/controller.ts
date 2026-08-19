import type { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "./service";
import { ok } from "../../utils/response";
import { env } from "../../config/env";
import type { ForgotPasswordInput, LoginInput, RegisterOrgInput, ResetPasswordInput } from "./schemas";

const REFRESH_COOKIE = "traky_refresh_token";

function setRefreshCookie(reply: FastifyReply, token: string, maxAgeSeconds: number) {
  reply.setCookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/v1/auth",
    maxAge: maxAgeSeconds,
  });
}

function clearRefreshCookie(reply: FastifyReply) {
  reply.clearCookie(REFRESH_COOKIE, { path: "/api/v1/auth" });
}

export class AuthController {
  constructor(private readonly service: AuthService) {}

  registerOrg = async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await this.service.registerOrganization(request.body as RegisterOrgInput);
    setRefreshCookie(reply, session.refreshToken, session.refreshTtlSeconds);
    return reply.code(201).send(ok({ user: session.user, accessToken: session.accessToken }));
  };

  login = async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await this.service.login(request.body as LoginInput);
    setRefreshCookie(reply, session.refreshToken, session.refreshTtlSeconds);
    return reply.send(ok({ user: session.user, accessToken: session.accessToken }));
  };

  refresh = async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.cookies[REFRESH_COOKIE];
    const session = await this.service.refresh(token);
    setRefreshCookie(reply, session.refreshToken, session.refreshTtlSeconds);
    return reply.send(ok({ user: session.user, accessToken: session.accessToken }));
  };

  logout = async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.cookies[REFRESH_COOKIE];
    await this.service.logout(token);
    clearRefreshCookie(reply);
    return reply.send(ok({ loggedOut: true }));
  };

  me = async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send(ok({ authUser: request.authUser }));
  };

  forgotPassword = async (request: FastifyRequest, reply: FastifyReply) => {
    await this.service.forgotPassword(request.body as ForgotPasswordInput);
    return reply.send(ok({ sent: true }));
  };

  resetPassword = async (request: FastifyRequest, reply: FastifyReply) => {
    await this.service.resetPassword(request.body as ResetPasswordInput);
    return reply.send(ok({ reset: true }));
  };
}
