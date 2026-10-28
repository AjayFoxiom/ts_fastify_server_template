# Fastify + TypeScript + Prisma + Zod Server Template

A high-performance, modular, and production-ready REST API starter template built with **Fastify 5**, **TypeScript**, **Prisma ORM 7** (with PostgreSQL driver adapter), and **Zod** schema validation.

---

## 🚀 Features

- **Fastify v5**: High-throughput web framework with async/await and plugin architecture.
- **TypeScript & ESM**: Modern ES modules with strict typing and lightning-fast developer experience.
- **Prisma ORM v7**: Type-safe database queries with PostgreSQL connection pooling using `@prisma/adapter-pg`.
- **Zod Validation**: End-to-end runtime request and response validation via `fastify-type-provider-zod`.
- **OpenAPI / Swagger**: Auto-generated interactive Swagger UI docs at `/docs` with live request testing.
- **Security**: Built-in `@fastify/helmet` security headers and `@fastify/cors` cross-origin resource sharing.
- **Health Probes**: Kubernetes / load balancer ready `/health` (liveness) and `/ready` (database readiness).
- **Fast Tooling**: Development with `tsx watch` (hot-reloading) and production bundling with `tsup`.
- **Production Ready**: PM2 cluster configuration (`ecosystem.config.cjs`) and graceful shutdown lifecycle hooks.

---

## 📁 Project Structure

```text
fastify_ts_server_template/
├── prisma/
│   └── schema.prisma              # Prisma schema definition
├── src/
│   ├── config/
│   │   ├── env.ts                 # Type-safe environment validation with Zod
│   │   └── prisma.config.ts       # Prisma 7 configuration file
│   ├── middleware/
│   │   └── errorHandler.ts        # Central error handler middleware
│   ├── modules/
│   │   └── user/
│   │       ├── user.schema.ts     # Zod request/response schemas & types
│   │       ├── user.repository.ts # Database access queries (Prisma)
│   │       ├── user.service.ts    # Business logic & domain operations
│   │       ├── user.controller.ts # Route controller handlers
│   │       └── user.routes.ts     # Fastify route declarations
│   ├── plugins/
│   │   ├── prisma.ts              # Prisma & PostgreSQL pool plugin
│   │   └── swagger.ts             # OpenAPI / Swagger UI plugin
│   ├── routes/
│   │   └── index.ts               # Central routes registry (health, uploads, users)
│   ├── utils/
│   │   ├── AppError.ts            # Custom operational error class
│   │   ├── authToken.ts           # JWT authentication preHandler & token signing
│   │   ├── fetchData.ts           # Universal Prisma search & pagination utility
│   │   ├── responseHandler.ts     # Standardized JSON response helpers
│   │   └── uploads.ts             # File upload and storage helper functions
│   ├── app.ts                     # Fastify application factory
│   └── server.ts                  # Server entrypoint & graceful shutdown
├── .env                           # Local environment variables
├── .env.example                   # Environment variable template
├── .gitignore                     # Git ignore rules
├── ecosystem.config.ts            # PM2 TypeScript process configuration
├── package.json
├── tsconfig.json                  # TypeScript configuration
└── tsup.config.ts                 # Production build configuration
```

---

## 🛠️ Getting Started

### 1. Prerequisites
- **Node.js**: `v20.19.0` or higher (recommended: `v22+`)
- **PostgreSQL**: A running PostgreSQL instance or container

### 2. Configure Environment
Copy `.env.example` to `.env` and configure your database connection string:

```bash
cp .env.example .env
```

Example `.env`:
```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info
CORS_ORIGIN=*
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fastify_db?schema=public"
```

### 3. Initialize Prisma & Migrations
Generate Prisma client and run migrations against your database:

```bash
# Generate the Prisma client
npm run prisma:generate

# Run development migrations
npm run prisma:migrate
```

### 4. Run Development Server
Start the development server with live reload:

```bash
npm run dev
```

The server will be running at:
- **API**: [http://localhost:3000](http://localhost:3000)
- **Swagger Documentation**: [http://localhost:3000/docs](http://localhost:3000/docs)
- **Health Check**: [http://localhost:3000/health](http://localhost:3000/health)

---

## 📜 Available NPM Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server with hot-reload (`tsx watch`) |
| `npm run build` | Bundle application into `./dist` using `tsup` |
| `npm start` | Run production build (`node dist/server.js`) |
| `npm run typecheck` | Run TypeScript compiler type-checking without emitting files |
| `npm run prisma:generate` | Regenerate Prisma Client |
| `npm run prisma:migrate` | Create and apply migration in development |
| `npm run prisma:deploy` | Apply pending migrations in production |
| `npm run prisma:studio` | Open Prisma Studio GUI for database inspection |

---

## 📡 API Endpoints

### System & Health
- `GET /api/health` (or `/health`) - Liveness probe (uptime, status, timestamp)
- `GET /api/ready` - Readiness probe (checks PostgreSQL connectivity)

### Files
- `POST /api/uploads` - Upload a multipart form file

### Users
- `GET /api/users/me` - Get current authenticated user profile (`Authorization: Bearer <token>`)
- `POST /api/users` - Create a user (`{ email, name? }`)
- `GET /api/users` - List users with pagination (`?page=1&limit=10&search=...`)
- `GET /api/users/:id` - Get user by UUID
- `PATCH /api/users/:id` - Update user details
- `DELETE /api/users/:id` - Delete user by UUID

---

## 🚀 Production Deployment with PM2

Build the application and start with PM2 in cluster mode:

```bash
# Build production bundle
npm run build

# Start with PM2
pm2 start ecosystem.config.ts
```
