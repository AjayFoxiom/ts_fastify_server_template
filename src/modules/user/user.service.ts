import { UserRepository } from "./user.repository.js";
import { CreateUserInput, UpdateUserInput, UserQueryInput } from "./user.schema.js";
import { AppError } from "../../utils/AppError.js";

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Business logic for creating a new user
   */
  async create(data: CreateUserInput) {
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new AppError("A user with this email already exists", 409);
    }
    return this.userRepository.create(data);
  }

  /**
   * Business logic for fetching a user by ID
   */
  async findById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  }

  /**
   * Business logic for finding a user by email
   */
  async findByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  /**
   * Business logic for paginated users search
   */
  async findMany(query: UserQueryInput) {
    return this.userRepository.findMany(query);
  }

  /**
   * Business logic for updating a user
   */
  async update(id: string, data: UpdateUserInput) {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new AppError("User not found", 404);
    }

    if (data.email && data.email !== existing.email) {
      const emailConflict = await this.userRepository.findByEmail(data.email);
      if (emailConflict) {
        throw new AppError("A user with this email already exists", 409);
      }
    }

    return this.userRepository.update(id, data);
  }

  /**
   * Business logic for deleting a user
   */
  async delete(id: string) {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new AppError("User not found", 404);
    }

    return this.userRepository.delete(id);
  }
}
