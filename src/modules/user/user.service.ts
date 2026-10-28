import bcrypt from "bcryptjs";
import { UserRepository } from "./user.repository.js";
import { CreateUserInput, UpdateUserInput, UserQueryInput } from "./user.schema.js";
import { AppError } from "../../utils/AppError.js";
import { assertCanManageUser } from "./user.policy.js";
import { AuthUser } from "../../types/fastify.js";

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Atomic user creation with password hashing.
   * Avoids check-then-write race conditions by relying on the DB unique index.
   */
  async create(data: CreateUserInput) {
    const hashedPassword = await bcrypt.hash(data.password, 12);
    try {
      return await this.userRepository.create({
        ...data,
        email: data.email.toLowerCase(),
        password: hashedPassword,
      });
    } catch (err: any) {
      if (err?.code === "P2002") {
        throw new AppError("A user with this email already exists", 409);
      }
      throw err;
    }
  }

  /** Fetch user by ID; throws 404 if not found. */
  async findById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  }

  /** Fetch user by email (case-insensitive). */
  async findByEmail(email: string) {
    return this.userRepository.findByEmail(email.toLowerCase());
  }

  /** Paginated user search. */
  async findMany(query: UserQueryInput) {
    return this.userRepository.findMany(query);
  }

  /**
   * Update a user.
   * @param actor - The authenticated user performing the action.
   * @param id    - The target user's ID.
   * @param data  - Fields to update.
   */
  async update(actor: AuthUser, id: string, data: UpdateUserInput) {
    assertCanManageUser(actor, id);
    try {
      return await this.userRepository.update(id, {
        ...data,
        ...(data.email ? { email: data.email.toLowerCase() } : {}),
      });
    } catch (err: any) {
      if (err?.code === "P2025") {
        throw new AppError("User not found", 404);
      }
      if (err?.code === "P2002") {
        throw new AppError("A user with this email already exists", 409);
      }
      throw err;
    }
  }

  /**
   * Delete a user.
   * @param actor - The authenticated user performing the action.
   * @param id    - The target user's ID.
   */
  async delete(actor: AuthUser, id: string) {
    assertCanManageUser(actor, id);
    try {
      return await this.userRepository.delete(id);
    } catch (err: any) {
      if (err?.code === "P2025") {
        throw new AppError("User not found", 404);
      }
      throw err;
    }
  }
}
