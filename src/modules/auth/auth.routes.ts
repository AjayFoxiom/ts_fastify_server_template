import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { UserRepository } from "../user/user.repository.js";
import { AuthService } from "./auth.service.js";
import { AuthController } from "./auth.controller.js";
import { registerSchema, loginSchema, authResponseSchema } from "./auth.schema.js";
import { errorResponseSchema } from "../../common/schemas.js";

export const authRoutes: FastifyPluginAsyncZod = async (fastify) => {
  const userRepository = new UserRepository(fastify.prisma);
  // Pass the fastify instance so AuthService can read JWT config from app.config.
  const authService = new AuthService(userRepository, fastify);
  const authController = new AuthController(authService);

  fastify.post(
    "/register",
    {
      schema: {
        tags: ["Auth"],
        summary: "Register new user",
        description: "Registers a new user and returns access token",
        security: [],
        body: registerSchema,
        response: {
          201: authResponseSchema,
          400: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    authController.register,
  );

  fastify.post(
    "/login",
    {
      schema: {
        tags: ["Auth"],
        summary: "User login",
        description: "Authenticates user credentials and returns access token",
        security: [],
        body: loginSchema,
        response: {
          200: authResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    authController.login,
  );
};

export default authRoutes;
