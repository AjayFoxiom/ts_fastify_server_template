import { z } from "zod";
import { userResponseSchema } from "../user/user.schema.js";
import { createResponseSchema } from "../../common/schemas.js";

export const registerSchema = z.object({
  /** Lowercased before DB write to prevent case-sensitive duplicate accounts. */
  email: z.string().email("Invalid email address").toLowerCase(),
  /**
   * bcrypt silently truncates at 72 bytes.
   * max(72) rejects inputs that would be silently weakened.
   */
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(72, "Password must be at most 72 characters (bcrypt limit)"),
  name: z.string().min(1, "Name cannot be empty").optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export const authResultDataSchema = z.object({
  user: userResponseSchema,
  token: z.string(),
});

export const authResponseSchema = createResponseSchema(
  authResultDataSchema,
  "Authentication successful",
);

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AuthResultData = z.infer<typeof authResultDataSchema>;
