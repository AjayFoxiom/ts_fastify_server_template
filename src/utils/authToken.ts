import { FastifyReply, FastifyRequest } from "fastify";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { User } from "@prisma/client";
import { AppError } from "./AppError.js";
import { env } from "../config/env.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: User;
  }
}

export interface TokenPayload extends JwtPayload {
  id: string;
  email?: string;
}

/**
 * Sign a new JWT token
 */
export const signToken = (
  payload: { id: string; email?: string },
  options?: SignOptions
): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: (env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"],
    ...options,
  });
};

/**
 * Verify and decode JWT token
 */
export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
};

/**
 * Authentication preHandler hook for Fastify routes
 * Usage:
 *   fastify.get('/protected', { preHandler: [authToken] }, handler)
 */
export const authToken = async (
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> => {
  // 1) Extract Bearer token from authorization header
  const authHeader = request.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    throw new AppError("You are not logged in! Please provide a bearer token to get access.", 401);
  }

  // 2) Verify token
  let decoded: TokenPayload;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError("Your token has expired! Please log in again.", 401);
    }
    throw new AppError("Invalid authentication token.", 401);
  }

  // 3) Check if user exists in the database
  const currentUser = await request.server.prisma.user.findUnique({
    where: { id: decoded.id },
  });

  if (!currentUser) {
    throw new AppError("The user belonging to this token no longer exists.", 401);
  }

  // 4) Attach user to request
  request.user = currentUser;
};

/**
 * Optional authentication hook - attaches user if valid token exists, doesn't throw if missing
 */
export const optionalAuthToken = async (
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> => {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return;
  }

  const token = authHeader.split(" ")[1];
  if (!token) return;

  try {
    const decoded = verifyToken(token);
    const currentUser = await request.server.prisma.user.findUnique({
      where: { id: decoded.id },
    });
    if (currentUser) {
      request.user = currentUser;
    }
  } catch {
    // Silently ignore if token is optional
  }
};

export default authToken;
