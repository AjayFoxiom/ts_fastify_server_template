import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  APP_NAME: z.string().default(process.env.npm_package_name || "fastify-server"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("0.0.0.0"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  CORS_ORIGIN: z.string().default("*"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  // Required with NO default value - fails fast if not configured
  JWT_ACCESS_SECRET: z
    .string()
    .min(16, "JWT_ACCESS_SECRET is required and must be at least 16 characters long"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  UPLOAD_DIR: z.string().default("uploads"),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_TIME_WINDOW: z.string().default("1 minute"),
  TRUST_PROXY: z.coerce.boolean().default(true),
});

export type Env = z.infer<typeof envSchema>;

export const parseEnv = (customEnv: Record<string, unknown> = process.env): Env => {
  const result = envSchema.safeParse(customEnv);

  if (!result.success) {
    console.error("❌ Invalid environment variables configuration:");
    console.error(result.error.format());
    throw new Error("Invalid environment variables");
  }

  return result.data;
};

export const env = parseEnv();
