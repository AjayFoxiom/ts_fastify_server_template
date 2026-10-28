import { FastifyInstance } from "fastify";
import { z } from "zod";
import { authRoutes } from "../modules/auth/auth.routes.js";
import { userRoutes } from "../modules/user/user.routes.js";
import { saveUploadedFile, validateFileType } from "../utils/uploads.js";
import { AppError } from "../utils/AppError.js";
import { authToken } from "../utils/authToken.js";
import { sendSuccess, sendCreated, sendError } from "../utils/responseHandler.js";

// ── Allowed MIME types for uploads ────────────────────────────────────────
const ALLOWED_UPLOAD_MIMES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
];

// ── Inline response schemas ───────────────────────────────────────────────
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

const readinessResponseSchema = z.object({
  success: z.boolean(),
  statusCode: z.number(),
  message: z.string(),
  data: z
    .object({
      database: z.enum(["connected", "disconnected"]),
      timestamp: z.string(),
    })
    .optional(),
});

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
    url: z.string().optional(),
  }),
});

export const registerRoutes = async (app: FastifyInstance): Promise<void> => {
  // Decorate app.authenticate so it reads app.config at call time (not import time).
  // This is the onRequest hook used by the protected scope.
  app.decorate("authenticate", authToken);

  // ── PUBLIC SCOPE ─────────────────────────────────────────────────────────
  await app.register(async (publicScope) => {
    publicScope.get(
      "/health",
      {
        schema: {
          tags: ["Health"],
          summary: "Liveness probe",
          description: "Returns process health, uptime, and current timestamp",
          // Public endpoint — opt out of global bearerAuth requirement in Swagger UI
          security: [],
          response: { 200: healthResponseSchema },
        },
      },
      async (_request, reply) => {
        return sendSuccess(
          reply,
          {
            status: "ok" as const,
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV ?? "development",
          },
          "Server is healthy",
        );
      },
    );

    publicScope.get(
      "/ready",
      {
        schema: {
          tags: ["Health"],
          summary: "Readiness probe",
          description: "Checks database connectivity to determine readiness",
          security: [],
          response: { 200: readinessResponseSchema, 503: readinessResponseSchema },
        },
      },
      async (_request, reply) => {
        try {
          await app.prisma.$queryRaw`SELECT 1`;
          return sendSuccess(
            reply,
            { database: "connected" as const, timestamp: new Date().toISOString() },
            "Database connection is ready",
          );
        } catch (error) {
          app.log.error({ err: error }, "Database readiness probe failed");
          return sendError(reply, "Database connection failed", 503, "Service Unavailable");
        }
      },
    );

    await publicScope.register(authRoutes, { prefix: "/auth" });
  });

  // ── PROTECTED SCOPE ───────────────────────────────────────────────────────
  // onRequest runs BEFORE body parsing and Zod validation.
  // Anonymous requests with malformed bodies get 401, not 400.
  await app.register(async (protectedScope) => {
    protectedScope.addHook("onRequest", app.authenticate);

    await protectedScope.register(userRoutes, { prefix: "/users" });

    // Upload endpoint — validates MIME type and cleans up partial files on abort
    protectedScope.post(
      "/uploads",
      {
        schema: {
          tags: ["Uploads"],
          summary: "Upload a single file",
          description: "Uploads a multipart form file to disk (Authenticated)",
          response: { 201: uploadResponseSchema },
        },
      },
      async (request, reply) => {
        const fileData = await request.file();
        if (!fileData) {
          throw new AppError("No file was provided in the request", 400);
        }

        // Validate MIME type before streaming to disk
        validateFileType(fileData, ALLOWED_UPLOAD_MIMES);

        const savedFile = await saveUploadedFile(fileData);
        return sendCreated(reply, savedFile, "File uploaded successfully");
      },
    );
  });
};

export default registerRoutes;
