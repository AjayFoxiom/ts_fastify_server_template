# Fastify TypeScript Server Template 🚀

A battle-tested, modular, and production-ready REST API starter template built with **Fastify 5**, **TypeScript**, **Prisma ORM 7** (with PostgreSQL driver adapter), and **Zod** schema validation.

Designed specifically to be cloned as a reusable foundation for new backend microservices and APIs.

---

## ⚡ Quick Commands Cheat Sheet

```bash
# 📦 Setup & Runtime
nvm use                     # Switch to supported Node 22 (.nvmrc)
npm install                 # Install dependencies & auto-generate Prisma Client
cp .env.example .env        # Copy local environment config

# 🗄️ Database (Prisma)
npm run prisma:migrate      # Apply development migrations
npm run prisma:generate     # Regenerate Prisma Client
npm run prisma:studio       # Launch Prisma Studio database GUI
npm run prisma:deploy       # Apply migrations in production/CI

# 💻 Development & Building
npm run dev                 # Start local dev server with hot-reload (tsx watch)
npm run build               # Compile production bundle into ./dist (tsup)
npm start                   # Run compiled production server (node dist/server.js)

# 🧪 Testing & Code Quality
npm run typecheck           # Check TypeScript types (tsc --noEmit)
npm run lint                # Check code quality & dead code (ESLint 9+)
npm run format              # Auto-format all files (Prettier)
npm test                    # Run Vitest integration tests
npm run test:watch          # Run Vitest in interactive watch mode

# ⚡ Generator & Process Management
npm run gen:module <name>   # Scaffold new module in src/modules/<name>/
pm2 start ecosystem.config.cjs # Run production multi-core cluster (PM2)
pm2 logs                    # Stream live PM2 logs
pm2 stop all                # Stop PM2 cluster
```

---

## 📋 Checklist: Starting a New Server From This Template

Follow this quick 5-step checklist whenever you instantiate a new server from this template:

- [ ] **1. Node.js Runtime**:
  - Switch to the supported Node.js 22 runtime:
    ```bash
    nvm use
    ```
- [ ] **2. Project Identity**:
  - Update `name` in `package.json` (e.g. `"my-awesome-service"`).
  - Set `APP_NAME="my-awesome-service"` in your `.env`. This single setting automatically names your server, your Swagger documentation (`/docs`), and your PM2 cluster process (`ecosystem.config.cjs`).
- [ ] **3. Environment Secrets**:
  - Copy `.env.example` to `.env`: `cp .env.example .env`.
  - Provide a strong, unique `JWT_ACCESS_SECRET` (at least 32 characters). _Note: The server will refuse to start if this secret is missing or empty._
  - Configure `DATABASE_URL` with your PostgreSQL database credentials.
  - Set `CORS_ORIGIN` (must be explicitly configured in production; wildcard `*` is blocked in `NODE_ENV=production`).
- [ ] **4. Database Setup & Initial Migration**:
  - Edit `prisma/schema.prisma` with your application's domain models.
  - Apply the initial migration:
    ```bash
    npm run prisma:migrate
    ```
- [ ] **5. Verify Setup**:
  - Run typecheck and test suite:
    ```bash
    npm run typecheck
    npm test
    npm run dev
    ```

---

## 📁 Accurate Project Tree

```text
fastify_ts_server_template/
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions CI workflow (lint, test, build)
├── prisma/
│   ├── migrations/
│   │   └── 20261028000000_init/   # Initial PostgreSQL migration SQL
│   └── schema.prisma              # Prisma schema definition with password & User model
├── scripts/
│   └── generate-module.ts         # Module scaffold generator (npm run gen:module <name>)
├── src/
│   ├── app.ts                     # Injectable Fastify application factory buildApp(opts)
│   ├── server.ts                  # Server entrypoint with graceful shutdown & Pino logging
│   ├── common/
│   │   └── schemas.ts             # Reusable Zod schema factories (pagination, responses, errors)
│   ├── config/
│   │   └── env.ts                 # Validated Zod environment config (APP_NAME, secrets, limits)
│   ├── middleware/
│   │   └── errorHandler.ts        # Central error handler converting Zod & AppError to standard JSON
│   ├── modules/
│   │   ├── auth/                  # Authentication module (register, login, JWT)
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.schema.ts
│   │   │   └── auth.service.ts
│   │   └── user/                  # User management module
│   │       ├── user.controller.ts
│   │       ├── user.repository.ts
│   │       ├── user.routes.ts
│   │       ├── user.schema.ts
│   │       └── user.service.ts
│   ├── plugins/
│   │   ├── prisma.ts              # Prisma 7 client & PG connection pool plugin
│   │   └── swagger.ts             # Auto-generated OpenAPI / Swagger UI plugin
│   ├── routes/
│   │   └── index.ts               # Public scope (/auth, /health) & Protected scope (/users, /uploads)
│   └── utils/
│       ├── AppError.ts            # Custom operational error class
│       ├── authToken.ts           # JWT token verification preHandler & signing helper
│       ├── fetchData.ts           # Universal pagination utility & typed paginate<T>()
│       ├── responseHandler.ts     # Industry-standard JSON response helpers
│       ├── uploads.ts             # Pluggable multipart file upload handler
│       └── storage/               # Pluggable storage abstraction
│           ├── storage.interface.ts # StorageDriver interface
│           ├── localStorageDriver.ts# Local filesystem driver (saves to uploads/)
│           └── index.ts           # Storage driver resolver
├── tests/
│   └── app.test.ts                # Fastify integration test suite with app.inject()
├── .env.example                   # Baseline environment variables template
├── .gitignore                     # Ignores node_modules, dist, uploads, coverage, .env
├── .nvmrc                         # Node 22 runtime specification
├── .prettierignore
├── .prettierrc                    # Standardized Prettier configuration
├── ecosystem.config.cjs           # PM2 cluster configuration reading APP_NAME
├── eslint.config.js               # ESLint 9+ flat config with TypeScript parser
├── package.json                   # Scripts, dependencies, and engines (>=22.0.0)
├── prisma.config.ts               # Root Prisma 7 configuration file
├── tsconfig.json                  # Strict TypeScript configuration
├── tsup.config.ts                 # Production bundle configuration
└── vitest.config.ts               # Vitest test configuration
```

---

## 🧩 Architectural Highlights

### 1. Unified Single Identity

The application name is defined in one place:

- Set `APP_NAME="my-service"` in `.env` (or default from `package.json` `name`).
- Used everywhere:
  - Fastify logger name
  - Swagger UI documentation title (`${APP_NAME} Documentation`)
  - PM2 process cluster manager (`ecosystem.config.cjs`)

### 2. Public vs. Protected Scopes (Private by Default)

All route registration in `src/routes/index.ts` is divided into two distinct scopes:

- **Public Scope**: Accessible without authentication (e.g., `/health`, `/ready`, `/api/auth/register`, `/api/auth/login`).
- **Protected Scope**: Guarded with the `authToken` preHandler hook. **All new business modules are placed here by default**, ensuring endpoints are secure out of the box unless explicitly exempted.

### 3. Injectable `buildApp(opts)` for Real Testing

The server factory in `src/app.ts` exports `buildApp(opts?: AppOptions)` which accepts optional overrides (such as `{ prisma: mockPrisma, logger: false }`). Tests run against the in-memory Fastify instance using `app.inject()` with no socket listeners or port collisions required:

```typescript
import { buildApp } from "../src/app.js";

const app = await buildApp({ logger: false });
const res = await app.inject({ method: "GET", url: "/health" });
expect(res.statusCode).toBe(200);
```

### 4. Pluggable Storage Driver

File uploads are abstracted behind the `StorageDriver` interface in `src/utils/storage/storage.interface.ts`:

- **Default**: `LocalStorageDriver` storing files in the local `uploads/` directory (ignored by Git).
- **Extensible**: Add AWS S3, Cloudflare R2, or Google Cloud Storage simply by implementing `StorageDriver` without modifying controller or route code.

### 5. Standardized JSON Response Contract

All endpoints return consistent, industry-standard payloads:

**Success Response**:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Resource retrieved successfully",
  "data": { ... }
}
```

**Paginated Success Response**:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Resources retrieved successfully",
  "data": [ ... ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Error Response**:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "errors": [{ "field": "email", "message": "Invalid email address" }]
}
```

---

## ⚡ Module Generator

Scaffold a complete, cleanly structured module in one command:

```bash
npm run gen:module order
```

This automatically creates `src/modules/order/`:

1. `order.schema.ts` — Zod request/response validation schemas.
2. `order.repository.ts` — Data access layer with PrismaClient.
3. `order.service.ts` — Business logic and validation handling.
4. `order.controller.ts` — Request handlers and standard responses.
5. `order.routes.ts` — Fastify typed route plugin.

After generating, register the route in `src/routes/index.ts` under the protected scope:

```typescript
import { orderRoutes } from "../modules/order/order.routes.js";

// Inside registerRoutes protectedScope:
await protectedScope.register(orderRoutes, { prefix: "/orders" });
```

---

## 🔌 Minimal Core & Optional Add-ons

This template intentionally ships **only** what every production REST service needs:

- ✅ Authentication (Registration, Login, Password Hashing, JWT verification)
- ✅ User Management & Self Profile (`/me`)
- ✅ Health Probes (`/health`, `/ready`)
- ✅ Multipart Uploads with Storage Driver abstraction
- ✅ Rate Limiting, Helmet, Strict CORS, and Proxy Trusting

### Add When Needed:

To keep microservices lightweight, external infrastructure dependencies are left out by default:

- **Redis / Cache**: Add `ioredis` or `@fastify/redis` when caching or distributed session locks are required.
- **Background Queues**: Add `bullmq` or `pg-boss` when asynchronous job processing is needed.
- **Event Bus**: Add RabbitMQ, Kafka, or AWS SNS/SQS when event-driven choreography is required across microservices.

---

## 📜 Available NPM Scripts

| Script                    | Description                                            |
| ------------------------- | ------------------------------------------------------ |
| `npm run dev`             | Start development server with hot-reload (`tsx watch`) |
| `npm run build`           | Bundle application into `./dist` using `tsup`          |
| `npm start`               | Run production build (`node dist/server.js`)           |
| `npm test`                | Run integration test suite using Vitest                |
| `npm run test:watch`      | Run Vitest in watch mode                               |
| `npm run typecheck`       | Check TypeScript types (`tsc --noEmit`)                |
| `npm run lint`            | Lint codebase using ESLint 9+ flat config              |
| `npm run format`          | Format entire repository using Prettier                |
| `npm run gen:module <n>`  | Scaffold a new clean module in `src/modules/<n>`       |
| `npm run prisma:generate` | Regenerate Prisma Client                               |
| `npm run prisma:migrate`  | Apply pending development migrations                   |
| `npm run prisma:deploy`   | Apply migrations in production                         |
| `npm run prisma:studio`   | Open Prisma Studio database viewer                     |

---

---

## 🛠️ Tooling, Linting & Testing Guide

This template comes pre-configured with industry-standard developer tools:

### 1. Node Version Manager (`.nvmrc`)

Ensure everyone on your team and in CI/CD uses the exact same Node.js runtime:

```bash
# Automatically switches to Node.js 22 defined in .nvmrc
nvm use
```

### 2. Code Formatting (`.prettierrc`, `.prettierignore`)

Keep code styles, indentation, quotes, and commas consistent across the entire repository:

```bash
# Formats all TypeScript, JavaScript, JSON, and Markdown files
npm run format
```

### 3. Static Code Analysis & Linting (`eslint.config.js`)

Detect logic errors, dead code, and unused variables before runtime with ESLint 9+ flat config:

```bash
# Analyzes codebase for errors and stylistic issues
npm run lint
```

### 4. Automated Testing (`vitest.config.ts`)

Run fast, in-memory integration tests with Fastify's native `app.inject()`:

```bash
# Run all integration tests once (ideal for CI pipelines)
npm test

# Run tests in interactive watch mode while developing
npm run test:watch
```

---

## 🚀 Production Deployment with PM2 (`ecosystem.config.cjs`)

PM2 manages multi-core clustering, graceful reloading, and automatic restarts in production environments.

### Useful PM2 Commands:

```bash
# 1. Build the production TypeScript bundle
npm run build

# 2. Start all workers across all CPU cores in cluster mode
pm2 start ecosystem.config.cjs

# 3. View live cluster status and memory usage
pm2 status

# 4. Stream application logs
pm2 logs

# 5. Reload workers with zero downtime
pm2 reload ecosystem.config.cjs

# 6. Stop all running processes
pm2 stop all
```

---

## 🏷️ Versioning & Template Maintenance

- This repository is designed to be marked as a **GitHub Template Repository**.
- Releases should be tagged semantically (e.g. `v1.0.0`, `v1.1.0`) so that downstream services can inspect template improvements and changelogs.
