import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const rawName = process.argv[2];

if (!rawName) {
  console.error("❌ Error: Module name is required.");
  console.error("Usage: npm run gen:module <name>");
  console.error("Example: npm run gen:module order");
  process.exit(1);
}

// Normalize name: "order" -> camel "order", Pascal "Order", kebab "order"
const cleanName = rawName
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9_-]/g, "");
const camelName = cleanName.replace(/[-_]([a-z])/g, (_, g) => g.toUpperCase());
const pascalName = camelName.charAt(0).toUpperCase() + camelName.slice(1);
const moduleDir = path.resolve(process.cwd(), "src", "modules", cleanName);

if (fs.existsSync(moduleDir)) {
  console.error(`❌ Error: Module directory already exists: src/modules/${cleanName}`);
  process.exit(1);
}

fs.mkdirSync(moduleDir, { recursive: true });

// 1. Schema
const schemaContent = `import { z } from "zod";
import {
  idParamSchema,
  paginationQuerySchema,
  createResponseSchema,
  createPaginatedResponseSchema,
  messageResponseSchema,
  errorResponseSchema,
} from "../../common/schemas.js";

// Params & Query Schemas
export const ${camelName}ParamsSchema = idParamSchema;

export const ${camelName}QuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
});

// Request Body Schemas
export const create${pascalName}Schema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
});

export const update${pascalName}Schema = create${pascalName}Schema.partial();

// Domain Model Schema
export const ${camelName}ModelSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Response Schemas
export const single${pascalName}ResponseSchema = createResponseSchema(${camelName}ModelSchema);
export const ${camelName}ListResponseSchema = createPaginatedResponseSchema(${camelName}ModelSchema);

// Export Type Inferences
export type ${pascalName}ParamsInput = z.infer<typeof ${camelName}ParamsSchema>;
export type ${pascalName}QueryInput = z.infer<typeof ${camelName}QuerySchema>;
export type Create${pascalName}Input = z.infer<typeof create${pascalName}Schema>;
export type Update${pascalName}Input = z.infer<typeof update${pascalName}Schema>;
export type ${pascalName}Model = z.infer<typeof ${camelName}ModelSchema>;

export { messageResponseSchema, errorResponseSchema };
`;

// 2. Repository
const repositoryContent = `import { PrismaClient } from "@prisma/client";
import { Create${pascalName}Input, Update${pascalName}Input } from "./${cleanName}.schema.js";

export class ${pascalName}Repository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string) {
    // Replace with your Prisma model query, e.g. this.prisma.${camelName}.findUnique
    return (this.prisma as any).${camelName}?.findUnique({ where: { id } }) ?? null;
  }

  async create(data: Create${pascalName}Input) {
    return (this.prisma as any).${camelName}?.create({ data }) ?? { id: "temp", ...data };
  }

  async update(id: string, data: Update${pascalName}Input) {
    return (this.prisma as any).${camelName}?.update({ where: { id }, data }) ?? { id, ...data };
  }

  async delete(id: string) {
    return (this.prisma as any).${camelName}?.delete({ where: { id } }) ?? { id };
  }
}
`;

// 3. Service
const serviceContent = `import { AppError } from "../../utils/AppError.js";
import { ${pascalName}Repository } from "./${cleanName}.repository.js";
import { Create${pascalName}Input, Update${pascalName}Input } from "./${cleanName}.schema.js";

export class ${pascalName}Service {
  constructor(private readonly repository: ${pascalName}Repository) {}

  async getById(id: string) {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new AppError("${pascalName} not found", 404);
    }
    return item;
  }

  async create(input: Create${pascalName}Input) {
    return this.repository.create(input);
  }

  async update(id: string, input: Update${pascalName}Input) {
    await this.getById(id);
    return this.repository.update(id, input);
  }

  async delete(id: string) {
    await this.getById(id);
    return this.repository.delete(id);
  }
}
`;

// 4. Controller
const controllerContent = `import { FastifyReply, FastifyRequest } from "fastify";
import { ${pascalName}Service } from "./${cleanName}.service.js";
import {
  ${pascalName}ParamsInput,
  ${pascalName}QueryInput,
  Create${pascalName}Input,
  Update${pascalName}Input,
} from "./${cleanName}.schema.js";
import { sendSuccess } from "../../utils/responseHandler.js";
// import { sendPaginated } from "../../utils/responseHandler.js";
// import { paginate } from "../../utils/fetchData.js";

export class ${pascalName}Controller {
  constructor(private readonly service: ${pascalName}Service) {}

  getAll = async (
    request: FastifyRequest<{ Querystring: ${pascalName}QueryInput }>,
    reply: FastifyReply,
  ) => {
    // If connected to a Prisma model delegate:
    // const result = await paginate((request.server.prisma as any).${camelName}, request.query, {
    //   allowedSortFields: ["createdAt", "title"],
    // });
    // return sendPaginated(reply, result);

    return sendSuccess(reply, {
      message: "${pascalName} list retrieved",
      data: [],
    });
  };

  getById = async (
    request: FastifyRequest<{ Params: ${pascalName}ParamsInput }>,
    reply: FastifyReply,
  ) => {
    const item = await this.service.getById(request.params.id);
    return sendSuccess(reply, {
      data: item,
      message: "${pascalName} retrieved successfully",
    });
  };

  create = async (
    request: FastifyRequest<{ Body: Create${pascalName}Input }>,
    reply: FastifyReply,
  ) => {
    const item = await this.service.create(request.body);
    return sendSuccess(reply, {
      statusCode: 201,
      data: item,
      message: "${pascalName} created successfully",
    });
  };

  update = async (
    request: FastifyRequest<{ Params: ${pascalName}ParamsInput; Body: Update${pascalName}Input }>,
    reply: FastifyReply,
  ) => {
    const item = await this.service.update(request.params.id, request.body);
    return sendSuccess(reply, {
      data: item,
      message: "${pascalName} updated successfully",
    });
  };

  delete = async (
    request: FastifyRequest<{ Params: ${pascalName}ParamsInput }>,
    reply: FastifyReply,
  ) => {
    await this.service.delete(request.params.id);
    return sendSuccess(reply, {
      message: "${pascalName} deleted successfully",
    });
  };
}
`;

// 5. Routes
const routesContent = `import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { ${pascalName}Repository } from "./${cleanName}.repository.js";
import { ${pascalName}Service } from "./${cleanName}.service.js";
import { ${pascalName}Controller } from "./${cleanName}.controller.js";
import {
  ${camelName}ParamsSchema,
  ${camelName}QuerySchema,
  create${pascalName}Schema,
  update${pascalName}Schema,
  single${pascalName}ResponseSchema,
  ${camelName}ListResponseSchema,
  messageResponseSchema,
  errorResponseSchema,
} from "./${cleanName}.schema.js";

export const ${camelName}Routes: FastifyPluginAsyncZod = async (fastify) => {
  const repository = new ${pascalName}Repository(fastify.prisma);
  const service = new ${pascalName}Service(repository);
  const controller = new ${pascalName}Controller(service);

  fastify.get(
    "/",
    {
      schema: {
        summary: "List ${pascalName}s",
        tags: ["${pascalName}"],
        querystring: ${camelName}QuerySchema,
        response: {
          200: ${camelName}ListResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.getAll,
  );

  fastify.get(
    "/:id",
    {
      schema: {
        summary: "Get ${pascalName} by ID",
        tags: ["${pascalName}"],
        params: ${camelName}ParamsSchema,
        response: {
          200: single${pascalName}ResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.getById,
  );

  fastify.post(
    "/",
    {
      schema: {
        summary: "Create ${pascalName}",
        tags: ["${pascalName}"],
        body: create${pascalName}Schema,
        response: {
          201: single${pascalName}ResponseSchema,
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.create,
  );

  fastify.put(
    "/:id",
    {
      schema: {
        summary: "Update ${pascalName}",
        tags: ["${pascalName}"],
        params: ${camelName}ParamsSchema,
        body: update${pascalName}Schema,
        response: {
          200: single${pascalName}ResponseSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.update,
  );

  fastify.delete(
    "/:id",
    {
      schema: {
        summary: "Delete ${pascalName}",
        tags: ["${pascalName}"],
        params: ${camelName}ParamsSchema,
        response: {
          200: messageResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.delete,
  );
};
`;

fs.writeFileSync(path.join(moduleDir, `${cleanName}.schema.ts`), schemaContent);
fs.writeFileSync(path.join(moduleDir, `${cleanName}.repository.ts`), repositoryContent);
fs.writeFileSync(path.join(moduleDir, `${cleanName}.service.ts`), serviceContent);
fs.writeFileSync(path.join(moduleDir, `${cleanName}.controller.ts`), controllerContent);
fs.writeFileSync(path.join(moduleDir, `${cleanName}.routes.ts`), routesContent);

console.log(`✅ Module '${cleanName}' created successfully in src/modules/${cleanName}/`);
console.log(`   - ${cleanName}.schema.ts`);
console.log(`   - ${cleanName}.repository.ts`);
console.log(`   - ${cleanName}.service.ts`);
console.log(`   - ${cleanName}.controller.ts`);
console.log(`   - ${cleanName}.routes.ts`);
console.log(`
👉 Next steps:
1. Add the Prisma model to 'prisma/schema.prisma' and run 'npm run prisma:migrate'.
2. Register the module in 'src/routes/index.ts':
   import { ${camelName}Routes } from "../modules/${cleanName}/${cleanName}.routes.js";
   // In protected scope (private by default):
   await protectedScope.register(${camelName}Routes, { prefix: "/${cleanName}s" });
`);
