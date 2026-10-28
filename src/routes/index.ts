import { FastifyInstance } from "fastify";
import { z } from "zod";
import { userRoutes } from "../modules/user/user.routes.js";
import { saveUploadedFile } from "../utils/uploads.js";
import { AppError } from "../utils/AppError.js";
import { sendSuccess, sendCreated, sendError } from "../utils/responseHandler.js";

// Standard health response schema
const healthResponseSchema = z.object({
  success: z.literal(true),
  statusCode: z.number(),
  message: z.string(),
  data: z.object({
    status: z.literal("ok"),
    uptime: z.number(),
    timestamp: z.string(),
    environment: z.string(),
  }),
});

// Standard readiness response schema
const readinessResponseSchema = z.object({
  success: z.boolean(),
  statusCode: z.number(),
  message: z.string(),
  data: z.object({
    database: z.enum(["connected", "disconnected"]),
    timestamp: z.string(),
  }).optional(),
});

// Standard upload response schema
const uploadResponseSchema = z.object({
  success: z.literal(true),
  statusCode: z.number(),
  message: z.string(),
  data: z.object({
    filename: z.string(),
    originalFilename: z.string(),
    mimetype: z.string(),
    filepath: z.string(),
    size: z.number().optional(),
  }),
});

export const registerRoutes = async (app: FastifyInstance): Promise<void> => {
  // --- Health & Readiness Probes ---
  app.get(
    "/health",
    {
      schema: {
        tags: ["Health"],
        summary: "Liveness probe",
        description: "Returns process health, uptime, and current timestamp",
        response: {
          200: healthResponseSchema,
        },
      },
    },
    async (_request, reply) => {
      return sendSuccess(
        reply,
        {
          status: "ok" as const,
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || "development",
        },
        "Server is healthy"
      );
    }
  );

  app.get(
    "/ready",
    {
      schema: {
        tags: ["Health"],
        summary: "Readiness probe",
        description: "Checks database connectivity to determine readiness",
        response: {
          200: readinessResponseSchema,
          503: readinessResponseSchema,
        },
      },
    },
    async (_request, reply) => {
      try {
        await app.prisma.$queryRaw`SELECT 1`;
        return sendSuccess(
          reply,
          {
            database: "connected" as const,
            timestamp: new Date().toISOString(),
          },
          "Database connection is ready"
        );
      } catch (error) {
        app.log.error({ error }, "Database readiness probe failed");
        return sendError(
          reply,
          "Database connection failed",
          503,
          "Service Unavailable"
        );
      }
    }
  );

  // --- Uploads Route ---
  app.post(
    "/uploads",
    {
      schema: {
        tags: ["Uploads"],
        summary: "Upload a single file",
        description: "Uploads a multipart form file and saves to local disk",
        response: {
          201: uploadResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const fileData = await request.file();
      if (!fileData) {
        throw new AppError("No file was provided in the request", 400);
      }

      const savedFile = await saveUploadedFile(fileData);
      return sendCreated(reply, savedFile, "File uploaded successfully");
    }
  );

  // --- Domain Routes ---
  await app.register(userRoutes, { prefix: "/users" });
};

export default registerRoutes;
