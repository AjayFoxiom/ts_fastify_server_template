import { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { hasZodFastifySchemaValidationErrors } from "fastify-type-provider-zod";
import { AppError } from "../utils/AppError.js";
import { sendError } from "../utils/responseHandler.js";
import { env } from "../config/env.js";

const getErrorNameByStatus = (statusCode: number): string => {
  switch (statusCode) {
    case 400:
      return "Bad Request";
    case 401:
      return "Unauthorized";
    case 403:
      return "Forbidden";
    case 404:
      return "Not Found";
    case 409:
      return "Conflict";
    case 422:
      return "Unprocessable Entity";
    case 429:
      return "Too Many Requests";
    default:
      return statusCode >= 500 ? "Internal Server Error" : "Error";
  }
};

export const globalErrorHandler = (
  error: FastifyError | AppError | Error,
  _request: FastifyRequest,
  reply: FastifyReply
) => {
  // 1. Zod / Fastify Schema Validation Errors
  if (hasZodFastifySchemaValidationErrors(error as FastifyError)) {
    const fastifyErr = error as FastifyError;
    return sendError(
      reply,
      fastifyErr.message || "Validation failed",
      400,
      "Bad Request",
      fastifyErr.validation
    );
  }

  // 2. Custom Operational AppError
  if (error instanceof AppError) {
    return sendError(
      reply,
      error.message,
      error.statusCode,
      getErrorNameByStatus(error.statusCode)
    );
  }

  // 3. Prisma Known Request Errors
  const anyError = error as any;
  if (anyError?.code === "P2002") {
    const targetFields = anyError.meta?.target ? ` on field: ${anyError.meta.target}` : "";
    return sendError(
      reply,
      `A unique constraint violation occurred${targetFields}`,
      409,
      "Conflict"
    );
  }

  if (anyError?.code === "P2025") {
    return sendError(
      reply,
      "The requested record was not found",
      404,
      "Not Found"
    );
  }

  // 4. Fastify and Internal Server Errors
  const statusCode = (error as FastifyError).statusCode ?? 500;
  reply.log.error(error);

  const message =
    statusCode === 500 && env.NODE_ENV === "production"
      ? "An unexpected internal server error occurred"
      : error.message || "Internal Server Error";

  return sendError(
    reply,
    message,
    statusCode,
    error.name || getErrorNameByStatus(statusCode)
  );
};

export function setupErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler(globalErrorHandler);
}

export default setupErrorHandler;
