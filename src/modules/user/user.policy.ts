import { AuthUser } from "../../types/fastify.js";
import { AppError } from "../../utils/AppError.js";

/**
 * Returns true when `actor` is allowed to manage (update or delete) the resource
 * owned by `targetId`.
 *
 * Rules:
 * - ADMINs can manage any user.
 * - A USER can only manage their own account.
 */
export const canManageUser = (actor: AuthUser, targetId: string): boolean => {
  return actor.role === "ADMIN" || actor.id === targetId;
};

/**
 * Asserts that `actor` can manage `targetId`, throwing a 403 ForbiddenError otherwise.
 */
export const assertCanManageUser = (actor: AuthUser, targetId: string): void => {
  if (!canManageUser(actor, targetId)) {
    throw new AppError("You do not have permission to perform this action.", 403);
  }
};
