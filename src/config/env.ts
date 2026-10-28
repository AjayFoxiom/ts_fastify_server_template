import { z } from "zod";

const envSchema = z.object({
  APP_NAME: z.string().default(process.env.npm_package_name ?? "fastify-server"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("0.0.0.0"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  CORS_ORIGIN: z.string().default("*"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_ACCESS_SECRET: z
    .string()
    .min(16, "JWT_ACCESS_SECRET is required and must be at least 16 characters long"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  UPLOAD_DIR: z.string().default("uploads"),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_TIME_WINDOW: z.string().default("1 minute"),
  /**
   * trustProxy hop count. 0 = disabled (server is directly internet-facing or behind nothing).
   * Set to 1 if behind one reverse proxy (nginx, ALB, …), 2 for two hops, etc.
   * Using a numeric hop count prevents spoofing: Fastify strips all but the last N IPs from
   * X-Forwarded-For, so the rate-limiter sees the real client address.
   * z.coerce.boolean() incorrectly turns the string "false" into true — use a number instead.
   */
  TRUST_PROXY: z.coerce.number().int().min(0).catch(0).default(0),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables.
 * Call with process.env (default) or an override map (tests, buildApp).
 * Does NOT run at import time — the singleton is gone.
 */
export const loadEnv = (source: Record<string, unknown> = process.env): Env => {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    console.error("❌ Invalid environment variables configuration:");
    console.error(result.error.format());
    throw new Error("Invalid environment variables");
  }

  return result.data;
};
