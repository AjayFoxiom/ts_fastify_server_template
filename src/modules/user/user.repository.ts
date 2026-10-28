import { PrismaClient, User, Prisma } from "@prisma/client";
import { CreateUserInput, UpdateUserInput, UserQueryInput } from "./user.schema.js";
import { fetchData, PaginationResult } from "../../utils/fetchData.js";

/**
 * Fields clients are permitted to sort by.
 * Omitting `password` prevents timing-oracle attacks on the hash.
 * Any field not in this list is silently ignored (falls back to createdAt desc),
 * so invalid sortBy values no longer cause a 500.
 */
const USER_ALLOWED_SORT_FIELDS = ["name", "email", "createdAt", "updatedAt"] as const;

export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /** Create a new user record in the database */
  async create(data: CreateUserInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  /** Find user by unique ID */
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /** Find user by email (caller must normalize to lowercase first) */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /** Find paginated users with multi-field search and a strict sortBy allowlist */
  async findMany(query: UserQueryInput): Promise<PaginationResult<User>> {
    return fetchData<User>(this.prisma.user, query, {
      searchFields: ["name", "email"],
      allowedSortFields: [...USER_ALLOWED_SORT_FIELDS],
      sort: { createdAt: query.sortOrder ?? "desc" },
    });
  }

  /** Update an existing user record */
  async update(id: string, data: UpdateUserInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  /** Delete a user by ID */
  async delete(id: string): Promise<User> {
    return this.prisma.user.delete({ where: { id } });
  }

  /** Count users matching an optional condition */
  async count(where?: Prisma.UserWhereInput): Promise<number> {
    return this.prisma.user.count({ where });
  }
}
