import bcrypt from "bcryptjs";
import { UserRepository } from "./user.repository.js";
import { CreateUserInput, UpdateUserInput, UserQueryInput } from "./user.schema.js";
import { AppError } from "../../utils/AppError.js";

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Atomic user creation with password hashing avoiding check-then-write race condition
   */
  async create(data: CreateUserInput) {
    const hashedPassword = await bcrypt.hash(data.password, 12);
    try {
      return await this.userRepository.create({
        ...data,
        password: hashedPassword,
      });
    } catch (err: any) {
      if (err?.code === "P2002") {
        throw new AppError("A user with this email already exists", 409);
      }
      throw err;
    }
  }

  /**
   * Fetch user by ID
   */
  async findById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  }

  /**
   * Fetch user by email
   */
  async findByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  /**
   * Paginated user search
   */
  async findMany(query: UserQueryInput) {
    return this.userRepository.findMany(query);
  }

  /**
   * Atomic user update
   */
  async update(id: string, data: UpdateUserInput) {
    try {
      return await this.userRepository.update(id, data);
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
   * User deletion
   */
  async delete(id: string) {
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
