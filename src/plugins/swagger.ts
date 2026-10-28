import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { jsonSchemaTransform } from "fastify-type-provider-zod";
import { env } from "../config/env.js";

const swaggerPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: "Fastify TypeScript Server API",
        description: "Production-ready Fastify REST API with Prisma, PostgreSQL, and Zod",
        version: "1.0.0",
      },
      servers: [
        {
          url: `http://${env.HOST === "0.0.0.0" ? "localhost" : env.HOST}:${env.PORT}`,
          description: "API Server",
        },
      ],
      tags: [
        { name: "Health", description: "Health check and system status endpoints" },
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
    },
    staticCSP: true,
  });
};

export default fp(swaggerPlugin, {
  name: "swagger",
});
