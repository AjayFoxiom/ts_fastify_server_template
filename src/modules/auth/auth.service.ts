import bcrypt from "bcryptjs";
import { UserRepository } from "../user/user.repository.js";
import { RegisterInput, LoginInput, AuthResultData } from "./auth.schema.js";
import { AppError } from "../../utils/AppError.js";
import { signToken } from "../../utils/authToken.js";

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Register a new user with hashed password and generate JWT
   */
  async register(data: RegisterInput): Promise<AuthResultData> {
    const hashedPassword = await bcrypt.hash(data.password, 12);

    try {
      const user = await this.userRepository.create({
        email: data.email,
        password: hashedPassword,
        name: data.name,
      });

      const token = signToken({ id: user.id, email: user.email });

      return {
        user,
        token,
      };
    } catch (err: any) {
      if (err?.code === "P2002") {
        throw new AppError("A user with this email already exists", 409);
      }
      throw err;
    }
  }

  /**
   * Authenticate user with email and password
   */
  async login(data: LoginInput): Promise<AuthResultData> {
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      throw new AppError("Invalid email or password", 401);
    }

    const token = signToken({ id: user.id, email: user.email });

    return {
      user,
      token,
    };
  }
}
