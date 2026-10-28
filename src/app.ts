import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import sensible from "@fastify/sensible";
import multipart from "@fastify/multipart";
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";

import { env } from "./config/env.js";
import prismaPlugin from "./plugins/prisma.js";
import swaggerPlugin from "./plugins/swagger.js";
import registerRoutes from "./routes/index.js";
import setupErrorHandler from "./middleware/errorHandler.js";

export const buildApp = async (): Promise<FastifyInstance> => {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV === "development"
          ? {
              target: "pino/file",
            }
          : undefined,
    },
  }).withTypeProvider<ZodTypeProvider>();

  // Set Zod validation and serialization compilers
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Global Error Handler setup (must be set before routes/plugins)
  setupErrorHandler(app);

  // Security headers & CORS
  await app.register(cors, {
    origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
    credentials: true,
  });

  await app.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === "production" ? undefined : false,
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
