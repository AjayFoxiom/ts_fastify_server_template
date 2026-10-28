import { FastifyReply } from "fastify";
import { PaginationResult } from "./fetchData.js";

/**
 * Standard API Success Response
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  pagination?: {
    totalDocs: number;
    limit: number;
    page: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Standard API Error Response
 */
export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  error: string;
  errors?: unknown[];
}

/**
 * Standard 200 OK success response
 */
export const sendSuccess = <T = unknown>(
  reply: FastifyReply,
  data?: T,
  message = "Operation completed successfully",
  statusCode = 200,
): FastifyReply => {
  const payload: ApiSuccessResponse<T> = {
    success: true,
    statusCode,
    message,
    data: (data !== undefined ? data : null) as T,
  };
  return reply.status(statusCode).send(payload);
};

/**
 * Standard 201 Created success response
 */
export const sendCreated = <T = unknown>(
  reply: FastifyReply,
  data?: T,
  message = "Resource created successfully",
): FastifyReply => {
  return sendSuccess(reply, data, message, 201);
};

/**
 * Standard 200 Paginated success response
 */
export const sendPaginated = <T = unknown>(
  reply: FastifyReply,
  paginationResult: PaginationResult<T>,
  message = "Data retrieved successfully",
  statusCode = 200,
): FastifyReply => {
  const { docs, ...pagination } = paginationResult;

  const payload: ApiSuccessResponse<T[]> = {
    success: true,
    statusCode,
    message,
    data: docs,
    pagination,
  };

  return reply.status(statusCode).send(payload);
};

/**
 * Standard Error response
 */
export const sendError = (
  reply: FastifyReply,
  message = "An error occurred",
  statusCode = 400,
  error = "Bad Request",
  errors?: unknown[],
): FastifyReply => {
  const payload: ApiErrorResponse = {
    success: false,
    statusCode,
    message,
    error,
    ...(errors && errors.length > 0 ? { errors } : {}),
  };
  return reply.status(statusCode).send(payload);
};

export default {
  sendSuccess,
  sendCreated,
  sendPaginated,
  sendError,
};
