/**
 * Prisma seed script
 * Run: npm run prisma:seed
 *
 * Creates an initial ADMIN user and a sample USER for local development.
 * Passwords are hashed with bcrypt (cost 12).
 */
import bcrypt from "bcryptjs";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database…");

  const adminEmail = "admin@example.com";
  const adminPassword = await bcrypt.hash("Admin1234!", 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: adminPassword,
      name: "Admin User",
      role: "ADMIN",
    },
  });

  const userEmail = "user@example.com";
  const userPassword = await bcrypt.hash("User1234!", 12);

  const regularUser = await prisma.user.upsert({
    where: { email: userEmail },
    update: {},
    create: {
      email: userEmail,
      password: userPassword,
      name: "Regular User",
      role: "USER",
    },
  });

  console.log(`✅ Seeded admin:   ${admin.email} (id: ${admin.id})`);
  console.log(`✅ Seeded user:    ${regularUser.email} (id: ${regularUser.id})`);
  console.log("✅ Seed complete");
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
