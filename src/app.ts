import Fastify, { FastifyInstance, FastifyServerOptions } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import sensible from "@fastify/sensible";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from "fastify-type-provider-zod";

import { env, Env } from "./config/env.js";
import prismaPlugin from "./plugins/prisma.js";
import swaggerPlugin from "./plugins/swagger.js";
import registerRoutes from "./routes/index.js";
import setupErrorHandler from "./middleware/errorHandler.js";

export interface AppOptions {
  logger?: FastifyServerOptions["logger"];
  trustProxy?: boolean;
  configOverride?: Partial<Env>;
}

export const buildApp = async (opts: AppOptions = {}): Promise<FastifyInstance> => {
  const currentEnv = { ...env, ...opts.configOverride };

  const app = Fastify({
    trustProxy: opts.trustProxy ?? currentEnv.TRUST_PROXY,
    logger:
      opts.logger !== undefined
        ? opts.logger
        : {
            level: currentEnv.LOG_LEVEL,
            transport:
              currentEnv.NODE_ENV === "development"
                ? {
                    target: "pino/file",
                  }
                : undefined,
          },
  }).withTypeProvider<ZodTypeProvider>();

  // Set Zod validation and serialization compilers
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Global Error Handler setup (registered early before plugins/routes)
  setupErrorHandler(app);

  // Security Headers
  await app.register(helmet, {
    contentSecurityPolicy: currentEnv.NODE_ENV === "production" ? undefined : false,
  });

  // Strict CORS in Production
  const corsOrigin =
    currentEnv.NODE_ENV === "production" && currentEnv.CORS_ORIGIN === "*"
      ? false // In production, open wildcard is disabled unless explicit domains are specified
      : currentEnv.CORS_ORIGIN === "*"
        ? true
        : currentEnv.CORS_ORIGIN.split(",").map((s) => s.trim());

  await app.register(cors, {
    origin: corsOrigin,
    credentials: true,
  });

  // Rate Limiting
  await app.register(rateLimit, {
    max: currentEnv.RATE_LIMIT_MAX,
    timeWindow: currentEnv.RATE_LIMIT_TIME_WINDOW,
    errorResponseBuilder: (_req, context) => ({
      success: false,
      statusCode: 429,
      message: `Too many requests, please try again in ${context.after}.`,
      error: "Too Many Requests",
    }),
  });

  await app.register(sensible);

  // Multipart form data & file uploads
  await app.register(multipart, {
    limits: {
      fileSize: 15 * 1024 * 1024, // 15MB limit
    },
  });

  // Documentation & Database plugins
  await app.register(swaggerPlugin);
  await app.register(prismaPlugin);

  // Register all application routes with /api prefix
  await app.register(registerRoutes, { prefix: "/api" });

  // Root health probe convenience route
  app.get("/health", async (_request, reply) => reply.redirect("/api/health"));

  return app;
};

export default buildApp;
