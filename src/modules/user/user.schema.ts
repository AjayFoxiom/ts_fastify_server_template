import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name cannot be empty").optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  name: z.string().min(1, "Name cannot be empty").optional(),
});

export const userParamsSchema = z.object({
  id: z.string().uuid("Invalid user ID (must be a valid UUID)"),
});

export const userQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  query: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const userResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const paginationMetaSchema = z.object({
  totalDocs: z.number(),
  limit: z.number(),
  page: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

export const singleUserResponseSchema = z.object({
  success: z.literal(true),
  statusCode: z.number(),
  message: z.string(),
  data: userResponseSchema,
});

export const userListResponseSchema = z.object({
  success: z.literal(true),
  statusCode: z.number(),
  message: z.string(),
  data: z.array(userResponseSchema),
  pagination: paginationMetaSchema,
});

export const messageResponseSchema = z.object({
  success: z.literal(true),
  statusCode: z.number(),
  message: z.string(),
  data: z.any().optional(),
});

export const errorResponseSchema = z.object({
  success: z.boolean().default(false),
  statusCode: z.number(),
  message: z.string(),
  error: z.string(),
  errors: z.array(z.any()).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserParamsInput = z.infer<typeof userParamsSchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
