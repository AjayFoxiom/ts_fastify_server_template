import "dotenv/config";
import Fastify, { FastifyInstance, FastifyServerOptions } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import sensible from "@fastify/sensible";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from "fastify-type-provider-zod";

import { loadEnv, Env } from "./config/env.js";
import prismaPlugin from "./plugins/prisma.js";
import swaggerPlugin from "./plugins/swagger.js";
import registerRoutes from "./routes/index.js";
import setupErrorHandler from "./middleware/errorHandler.js";

export interface AppOptions {
  logger?: FastifyServerOptions["logger"];
  /** Partial env overrides (used in integration tests to inject DATABASE_URL, JWT secret, etc.) */
  config?: Partial<Record<string, unknown>>;
  /** Optionally inject a pre-built Prisma client (for unit tests). */
  prisma?: Parameters<typeof prismaPlugin>[0] extends infer P ? P : never;
}

export const buildApp = async (opts: AppOptions = {}): Promise<FastifyInstance> => {
  // ── Single config source ──────────────────────────────────────────────────
  // Merging opts.config BEFORE parsing ensures the override goes through Zod
  // validation and coercion, so DATABASE_URL, JWT secret, etc. set in a test
  // actually reach every plugin that reads app.config.
  const config = loadEnv({ ...process.env, ...opts.config });

  // ── Fastify instance ──────────────────────────────────────────────────────
  // trustProxy: numeric hop count (0 = off). Fastify's TS types don't accept
  // a raw number, so we use a function that implements the same hop-count logic.
  // 0 hops → false; N hops → trust N IPs from the right of X-Forwarded-For.
  const trustProxyFn =
    config.TRUST_PROXY === 0
      ? false
      : (_addr: string, hopIndex: number) => hopIndex < config.TRUST_PROXY;

  const app = Fastify({
    trustProxy: trustProxyFn,
    logger:
      opts.logger !== undefined
        ? opts.logger
        : {
            level: config.LOG_LEVEL,
            transport:
              config.NODE_ENV === "development"
                ? { target: "pino/file" }
                : undefined,
            redact: ["req.headers.authorization"],
          },
  }).withTypeProvider<ZodTypeProvider>();

  // ── Compilers ─────────────────────────────────────────────────────────────
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // ── Decorate config first — every plugin can now read app.config ──────────
  app.decorate("config", config);

  // ── Error handler (registered early, before plugins/routes) ───────────────
  setupErrorHandler(app);

  // ── Security plugins ──────────────────────────────────────────────────────
  await app.register(helmet, {
    contentSecurityPolicy: config.NODE_ENV === "production" ? undefined : false,
  });

  const corsOrigin =
    config.NODE_ENV === "production" && config.CORS_ORIGIN === "*"
      ? false
      : config.CORS_ORIGIN === "*"
        ? true
        : config.CORS_ORIGIN.split(",").map((s) => s.trim());

  await app.register(cors, { origin: corsOrigin, credentials: true });

  await app.register(rateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_TIME_WINDOW,
    errorResponseBuilder: (_req, context) => ({
      success: false,
      statusCode: 429,
      message: `Too many requests, please try again in ${context.after}.`,
      error: "Too Many Requests",
    }),
  });

  await app.register(sensible);

  await app.register(multipart, {
    limits: { fileSize: 15 * 1024 * 1024 },
  });

  // ── Infrastructure plugins ────────────────────────────────────────────────
  await app.register(swaggerPlugin);
  await app.register(prismaPlugin);

  // ── Routes ────────────────────────────────────────────────────────────────
  await app.register(registerRoutes, { prefix: "/api" });

  app.get("/health", async (_request, reply) => reply.redirect("/api/health"));

  return app;
};

export default buildApp;
