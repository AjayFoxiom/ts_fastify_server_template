import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";

describe("Server Integration Tests", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({
      logger: false,
    });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/health should return 200 with standard health status", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/health",
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.statusCode).toBe(200);
    expect(body.message).toBe("Server is healthy");
    expect(body.data.status).toBe("ok");
  });

  it("GET /health root shortcut should redirect to /api/health", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe("/api/health");
  });

  it("POST /api/auth/register should return 400 when body is invalid", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        email: "not-an-email",
        password: "short",
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.statusCode).toBe(400);
    expect(body.error).toBe("Bad Request");
    expect(Array.isArray(body.errors)).toBe(true);
  });

  it("GET /api/users/me should return 401 when unauthenticated (protected scope)", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/users/me",
    });

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.statusCode).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });
});
