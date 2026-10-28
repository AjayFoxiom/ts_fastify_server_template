import { FastifyReply, FastifyRequest } from "fastify";
import jwt, { SignOptions } from "jsonwebtoken";
import { AppError } from "./AppError.js";
import { AuthUser } from "../types/fastify.js";

// Re-export AuthUser for callers that imported from here previously.
export type { AuthUser };

export interface TokenPayload {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  iat?: number;
  exp?: number;
}

/**
 * Sign a new JWT access token.
 * Reads the secret from `app.config` via the Fastify instance so test overrides work.
 */
export const signToken = (
  fastify: { config: { JWT_ACCESS_SECRET: string; JWT_EXPIRES_IN: string } },
  payload: Omit<TokenPayload, "iat" | "exp">,
  options?: SignOptions,
): string => {
  return jwt.sign(payload, fastify.config.JWT_ACCESS_SECRET, {
    algorithm: "HS256",
    expiresIn: fastify.config.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    ...options,
  });
};

/**
 * Verify and decode a JWT token.
 * Algorithm is explicitly pinned to HS256 to prevent algorithm-confusion attacks.
 */
export const verifyToken = (token: string, secret: string): TokenPayload => {
  return jwt.verify(token, secret, { algorithms: ["HS256"] }) as TokenPayload;
};

/**
 * `onRequest` authentication hook for Fastify routes.
 *
 * Registered via `addHook("onRequest", app.authenticate)` on protected scopes.
 * Using onRequest (not preHandler) ensures unauthenticated requests are rejected
 * BEFORE body parsing and validation, so anonymous requests with bad bodies
 * get 401 instead of 400.
 */
export const authToken = async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
  const authHeader = request.headers.authorization;
  let token: string | undefined;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }

  if (!token) {
    throw new AppError("You are not logged in! Please provide a Bearer token to get access.", 401);
  }

  let decoded: TokenPayload;
  try {
    decoded = verifyToken(token, request.server.config.JWT_ACCESS_SECRET);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError("Your token has expired! Please log in again.", 401);
    }
    throw new AppError("Invalid authentication token.", 401);
  }

  // Fetch a slim projection — never load the password hash into request context.
  const currentUser = await request.server.prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!currentUser) {
    throw new AppError("The user belonging to this token no longer exists.", 401);
  }

  request.user = currentUser as AuthUser;
};

export default authToken;
