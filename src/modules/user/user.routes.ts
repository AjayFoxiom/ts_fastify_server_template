import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { UserRepository } from "./user.repository.js";
import { UserService } from "./user.service.js";
import { UserController } from "./user.controller.js";
import { authToken } from "../../utils/authToken.js";
import {
  createUserSchema,
  updateUserSchema,
  userParamsSchema,
  userQuerySchema,
  singleUserResponseSchema,
  userListResponseSchema,
  messageResponseSchema,
  errorResponseSchema,
} from "./user.schema.js";
import { sendSuccess } from "../../utils/responseHandler.js";

export const userRoutes: FastifyPluginAsyncZod = async (fastify) => {
  const userRepository = new UserRepository(fastify.prisma);
  const userService = new UserService(userRepository);
  const userController = new UserController(userService);

  // Protected route using authToken preHandler
  fastify.get(
    "/me",
    {
      preHandler: [authToken],
      schema: {
        tags: ["Users"],
        summary: "Get current authenticated user",
        description: "Returns the profile of the currently logged-in user from the JWT Bearer token",
        response: {
          200: singleUserResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      return sendSuccess(reply, request.user!, "Profile retrieved successfully");
    }
  );

  fastify.post(
    "/",
    {
      schema: {
        tags: ["Users"],
        summary: "Create a new user",
        description: "Creates a user with unique email address and optional name",
        body: createUserSchema,
        response: {
          201: singleUserResponseSchema,
          400: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    userController.createUser
  );

  fastify.get(
    "/",
    {
      schema: {
        tags: ["Users"],
        summary: "List users",
        description: "Retrieves a paginated list of users with optional search filter",
        querystring: userQuerySchema,
        response: {
          200: userListResponseSchema,
        },
      },
    },
    userController.getUsers
  );

  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Users"],
        summary: "Get user by ID",
        description: "Retrieves details of a single user by UUID",
        params: userParamsSchema,
        response: {
          200: singleUserResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    userController.getUserById
  );

  fastify.patch(
    "/:id",
    {
      schema: {
        tags: ["Users"],
        summary: "Update user",
        description: "Updates an existing user's name or email",
        params: userParamsSchema,
        body: updateUserSchema,
        response: {
          200: singleUserResponseSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    userController.updateUser
  );

  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Users"],
        summary: "Delete user",
        description: "Deletes a user by UUID",
        params: userParamsSchema,
        response: {
          200: messageResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    userController.deleteUser
  );
};
