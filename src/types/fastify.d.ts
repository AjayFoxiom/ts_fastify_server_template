import type { Env } from "../config/env.js";
import type { PrismaClient } from "@prisma/client";

/**
 * Slim user object attached to every authenticated request.
 * Deliberately excludes `password` so the hash never leaks into request context.
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  createdAt: Date;
  updatedAt: Date;
}

declare module "fastify" {
  interface FastifyInstance {
    /** Parsed & validated environment config — the single source of truth. */
    config: Env;
    /** Prisma client decorated by the prisma plugin. */
    prisma: PrismaClient;
    /** Auth hook: verifies Bearer token and populates request.user */
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    /** Present only on authenticated routes (after authenticate hook runs). */
    user?: AuthUser;
  }
}
