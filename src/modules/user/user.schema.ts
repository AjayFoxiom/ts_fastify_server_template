import { z } from "zod";
import {
  paginationQuerySchema,
  idParamSchema,
  createResponseSchema,
  createPaginatedResponseSchema,
  messageResponseSchema,
  errorResponseSchema,
} from "../../common/schemas.js";

// Re-export shared schemas so routes don't need two imports
export { messageResponseSchema, errorResponseSchema };

export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  /** bcrypt silently truncates at 72 bytes; max(72) rejects inputs that would be silently weakened. */
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(72, "Password must be at most 72 characters (bcrypt limit)"),
  name: z.string().min(1, "Name cannot be empty").optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  name: z.string().min(1, "Name cannot be empty").optional(),
});

/** Reuse the shared UUID param schema */
export const userParamsSchema = idParamSchema;

/**
 * Reuse the shared pagination schema but restrict sortBy to safe fields.
 * Open sortBy lets clients sort by `password`, turning the hash into a timing oracle.
 */
export const userQuerySchema = paginationQuerySchema.extend({
  sortBy: z.enum(["name", "email", "createdAt", "updatedAt"]).optional(),
});

/** Public-facing user shape — password is intentionally omitted. */
export const userResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  role: z.enum(["USER", "ADMIN"]),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/** Reuse the shared response factories */
export const singleUserResponseSchema = createResponseSchema(userResponseSchema, "User retrieved");
export const userListResponseSchema = createPaginatedResponseSchema(userResponseSchema, "Users retrieved");

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserParamsInput = z.infer<typeof userParamsSchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
