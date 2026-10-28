import { FastifyRequest } from "fastify";

export interface PrismaDelegate<T = any> {
  findMany(args?: any): Promise<T[]>;
  count(args?: any): Promise<number>;
}

export interface PaginationParams {
  page?: number | string;
  limit?: number | string;
  query?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  [key: string]: any;
}

export interface FetchDataOptions<TWhere = any, TOrderBy = any, TSelect = any, TInclude = any> {
  condition?: TWhere;
  sort?: TOrderBy;
  selectOptions?: TSelect;
  populate?: TInclude; // Prisma include relations
  searchFields?: string[]; // Array of string column names to search across
  allowedSortFields?: string[]; // Allowed column names to sort by
}

export interface PaginationResult<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Universal pagination, filtering, and search utility for Prisma models.
 */
export async function fetchData<T = any>(
  model: PrismaDelegate<T>,
  queryParams: PaginationParams | FastifyRequest,
  options: FetchDataOptions = {},
): Promise<PaginationResult<T>> {
  // Extract query params from Fastify request if passed directly
  const query: PaginationParams =
    "query" in queryParams && typeof (queryParams as any).query === "object"
      ? (queryParams as any).query
      : queryParams;

  const pageSize = Math.max(1, parseInt(String(query.limit ?? 10), 10) || 10);
  const pageNumber = Math.max(1, parseInt(String(query.page ?? 1), 10) || 1);
  const skip = (pageNumber - 1) * pageSize;
  const take = pageSize;

  // Extract search term from 'query' or 'search'
  const rawSearch = query.query || query.search;
  const searchTerm = typeof rawSearch === "string" ? rawSearch.trim() : "";

  // Build where conditions
  const where: Record<string, any> = options.condition ? { ...options.condition } : {};

  if (searchTerm && options.searchFields && options.searchFields.length > 0) {
    const searchConditions = options.searchFields.map((field) => ({
      [field]: {
        contains: searchTerm,
        mode: "insensitive",
      },
    }));

    if (Object.keys(where).length > 0) {
      where.AND = [options.condition, { OR: searchConditions }];
    } else {
      where.OR = searchConditions;
    }
  }

  // Active Dynamic Sorting (fixes the dead sortBy bug)
  let orderBy: any;
  if (query.sortBy) {
    const requestedSort = String(query.sortBy).trim();
    const isAllowed =
      !options.allowedSortFields || options.allowedSortFields.includes(requestedSort);
    if (isAllowed) {
      const direction = query.sortOrder === "asc" ? "asc" : "desc";
      orderBy = { [requestedSort]: direction };
    }
  }

  if (!orderBy) {
    orderBy = options.sort ?? { createdAt: "desc" };
  }

  // Execute count and findMany in parallel
  const [totalDocs, docs] = await Promise.all([
    model.count({ where }),
    model.findMany({
      where,
      skip,
      take,
      orderBy,
      ...(options.selectOptions ? { select: options.selectOptions } : {}),
      ...(options.populate && !options.selectOptions ? { include: options.populate } : {}),
    }),
  ]);

  const totalPages = Math.ceil(totalDocs / pageSize) || 1;
  const hasNextPage = pageNumber < totalPages;
  const hasPreviousPage = pageNumber > 1;

  return {
    docs,
    totalDocs,
    limit: pageSize,
    page: pageNumber,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  };
}

/**
 * Type-safe alias for fetchData
 */
export const paginate = fetchData;

export default fetchData;
