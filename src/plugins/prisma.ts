import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { env } from "../config/env.js";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const prismaPlugin: FastifyPluginAsync = async (fastify) => {
  const pool = new pg.Pool({
    connectionString: env.DATABASE_URL,
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  fastify.decorate("prisma", prisma);

  fastify.addHook("onClose", async () => {
    fastify.log.info("Disconnecting Prisma client and closing connection pool...");
    await prisma.$disconnect();
    await pool.end();
  });
};

export default fp(prismaPlugin, {
  name: "prisma",
});
