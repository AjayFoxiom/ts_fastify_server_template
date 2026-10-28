import bcrypt from "bcryptjs";
import { UserRepository } from "../user/user.repository.js";
import { RegisterInput, LoginInput, AuthResultData } from "./auth.schema.js";
import { AppError } from "../../utils/AppError.js";
import { signToken } from "../../utils/authToken.js";

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly fastify: { config: { JWT_ACCESS_SECRET: string; JWT_EXPIRES_IN: string } },
  ) {}

  /**
   * Register a new user with hashed password and generate JWT.
   * Email is normalized to lowercase to prevent case-sensitive duplicate accounts.
   */
  async register(data: RegisterInput): Promise<AuthResultData> {
    const hashedPassword = await bcrypt.hash(data.password, 12);

    try {
      const user = await this.userRepository.create({
        email: data.email.toLowerCase(),
        password: hashedPassword,
        name: data.name,
      });

      const token = signToken(this.fastify, { id: user.id, email: user.email, role: user.role });

      return { user, token };
    } catch (err: any) {
      if (err?.code === "P2002") {
        throw new AppError("A user with this email already exists", 409);
      }
      throw err;
    }
  }

  /**
   * Authenticate user with email and password.
   *
   * Constant-time comparison: we always call bcrypt.compare even when the user
   * is not found (using a dummy hash) so the response time doesn't leak whether
   * an email exists in the database.
   */
  async login(data: LoginInput): Promise<AuthResultData> {
    // DUMMY_HASH is a pre-computed bcrypt hash of a fixed string.
    // It is used when no user is found so we always spend the bcrypt cost.
    const DUMMY_HASH = "$2b$12$invalidhashforconstanttime000000000000000000000000000";

    const user = await this.userRepository.findByEmail(data.email.toLowerCase());

    // Always run the expensive bcrypt comparison — prevents timing-based email enumeration.
    const passwordToCompare = user?.password ?? DUMMY_HASH;
    const isMatch = await bcrypt.compare(data.password, passwordToCompare);

    if (!user || !isMatch) {
      throw new AppError("Invalid email or password", 401);
    }

    const token = signToken(this.fastify, { id: user.id, email: user.email, role: user.role });

    return { user, token };
  }
}
