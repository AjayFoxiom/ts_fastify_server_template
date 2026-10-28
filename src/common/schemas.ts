import { z } from "zod";

/**
 * Standard pagination query parameters schema
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  query: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;

/**
 * Standard UUID parameter schema
 */
export const idParamSchema = z.object({
  id: z.string().uuid("Invalid ID format: must be a valid UUID"),
});

export type IdParamInput = z.infer<typeof idParamSchema>;

/**
 * Pagination metadata schema
 */
export const paginationMetaSchema = z.object({
  totalDocs: z.number(),
  limit: z.number(),
  page: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

/**
 * Factory to create standardized single-item API success schemas
 */
export const createResponseSchema = <T extends z.ZodTypeAny>(
  dataSchema: T,
  message = "Operation completed successfully",
) =>
  z.object({
    success: z.literal(true),
    statusCode: z.number(),
    message: z.string().default(message),
    data: dataSchema,
  });

/**
 * Factory to create standardized paginated API success schemas
 */
export const createPaginatedResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T,
  message = "Data retrieved successfully",
) =>
  z.object({
    success: z.literal(true),
    statusCode: z.number(),
    message: z.string().default(message),
    data: z.array(itemSchema),
    pagination: paginationMetaSchema,
  });

/**
 * Standard message only response
 */
export const messageResponseSchema = z.object({
  success: z.literal(true),
  statusCode: z.number(),
  message: z.string(),
  data: z.any().optional(),
});

/**
 * Standard API error schema
 */
export const errorResponseSchema = z.object({
  success: z.boolean().default(false),
  statusCode: z.number(),
  message: z.string(),
  error: z.string(),
  errors: z.array(z.any()).optional(),
});
