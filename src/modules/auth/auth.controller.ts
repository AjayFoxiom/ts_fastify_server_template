import { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "./auth.service.js";
import { RegisterInput, LoginInput } from "./auth.schema.js";
import { sendCreated, sendSuccess } from "../../utils/responseHandler.js";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (request: FastifyRequest<{ Body: RegisterInput }>, reply: FastifyReply) => {
    const result = await this.authService.register(request.body);
    return sendCreated(reply, result, "User registered successfully");
  };

  login = async (request: FastifyRequest<{ Body: LoginInput }>, reply: FastifyReply) => {
    const result = await this.authService.login(request.body);
    return sendSuccess(reply, result, "Login successful");
  };
}
