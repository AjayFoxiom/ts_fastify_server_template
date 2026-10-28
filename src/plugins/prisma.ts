import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// FastifyInstance augmentation lives in src/types/fastify.d.ts

const prismaPlugin: FastifyPluginAsync = async (fastify) => {
  // Read from app.config — the single source of truth set by buildApp().
  const { DATABASE_URL } = fastify.config;

  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  fastify.decorate("prisma", prisma);

  fastify.addHook("onClose", async () => {
    fastify.log.info("Disconnecting Prisma client and closing connection pool…");
    await prisma.$disconnect();
    await pool.end();
  });
};

export default fp(prismaPlugin, { name: "prisma" });
