process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test_jwt_access_secret_super_secure_32_chars!";
process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/test_db";
