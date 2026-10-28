import { FastifyReply, FastifyRequest } from "fastify";
import { UserService } from "./user.service.js";
import {
  CreateUserInput,
  UpdateUserInput,
  UserParamsInput,
  UserQueryInput,
} from "./user.schema.js";
import { sendSuccess, sendCreated, sendPaginated } from "../../utils/responseHandler.js";

export class UserController {
  constructor(private readonly userService: UserService) {}

  createUser = async (request: FastifyRequest<{ Body: CreateUserInput }>, reply: FastifyReply) => {
    const user = await this.userService.create(request.body);
    return sendCreated(reply, user, "User created successfully");
  };

  getUsers = async (
    request: FastifyRequest<{ Querystring: UserQueryInput }>,
    reply: FastifyReply,
  ) => {
    const result = await this.userService.findMany(request.query);
    return sendPaginated(reply, result, "Users retrieved successfully");
  };

  getUserById = async (
    request: FastifyRequest<{ Params: UserParamsInput }>,
    reply: FastifyReply,
  ) => {
    const user = await this.userService.findById(request.params.id);
    return sendSuccess(reply, user, "User retrieved successfully");
  };

  updateUser = async (
    request: FastifyRequest<{
      Params: UserParamsInput;
      Body: UpdateUserInput;
    }>,
    reply: FastifyReply,
  ) => {
    const updatedUser = await this.userService.update(request.params.id, request.body);
    return sendSuccess(reply, updatedUser, "User updated successfully");
  };

  deleteUser = async (
    request: FastifyRequest<{ Params: UserParamsInput }>,
    reply: FastifyReply,
  ) => {
    await this.userService.delete(request.params.id);
    return sendSuccess(reply, null, "User deleted successfully");
  };
}
