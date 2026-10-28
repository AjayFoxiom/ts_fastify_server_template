import { PrismaClient, User, Prisma } from "@prisma/client";
import { CreateUserInput, UpdateUserInput, UserQueryInput } from "./user.schema.js";
import { fetchData, PaginationResult } from "../../utils/fetchData.js";

export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Create a new user record in the database
   */
  async create(data: CreateUserInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  /**
   * Find user by unique ID
   */
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Find user by unique email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find paginated users with multi-field search
   */
  async findMany(query: UserQueryInput): Promise<PaginationResult<User>> {
    return fetchData<User>(this.prisma.user, query, {
      searchFields: ["name", "email"],
      sort: { createdAt: query.sortOrder || "desc" },
    });
  }

  /**
   * Update an existing user record
   */
  async update(id: string, data: UpdateUserInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a user by ID
   */
  async delete(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Count users matching condition
   */
  async count(where?: Prisma.UserWhereInput): Promise<number> {
    return this.prisma.user.count({ where });
  }
}
