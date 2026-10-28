import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { jsonSchemaTransform } from "fastify-type-provider-zod";

const swaggerPlugin: FastifyPluginAsync = async (fastify) => {
  // Don't expose Swagger in production.
  if (fastify.config.NODE_ENV === "production") return;

  const { APP_NAME, HOST, PORT } = fastify.config;
  const displayHost = HOST === "0.0.0.0" ? "localhost" : HOST;

  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: `${APP_NAME} API`,
        description: `Production-ready REST API powered by ${APP_NAME}`,
        version: "1.0.0",
      },
      servers: [
        {
          url: `http://${displayHost}:${PORT}`,
          description: "API Server",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "Enter your Bearer token (the value returned by /auth/login)",
          },
        },
      },
      // Apply bearerAuth globally so every route in Swagger UI sends the token.
      // Individual public routes can override with security: [] to opt out.
      security: [{ bearerAuth: [] }],
      tags: [
        { name: "Health", description: "Health check and system status endpoints" },
        { name: "Auth", description: "Authentication endpoints (register, login)" },
        { name: "Users", description: "User management operations" },
        { name: "Uploads", description: "File upload operations" },
      ],
    },
    transform: jsonSchemaTransform,
  });

  await fastify.register(fastifySwaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
      persistAuthorization: true,
    },
    staticCSP: true,
  });
};

export default fp(swaggerPlugin, { name: "swagger" });
