# Finta Backend - Agent Guide

## Overview

The Finta backend is a RESTful API server built with **Elysia** - a high-performance Bun web framework.

- **Framework**: Elysia (latest)
- **Runtime**: Bun
- **Port**: 3000
- **Documentation**: OpenAPI/Swagger via `@elysiajs/openapi`

## Tech Stack

| Package | Purpose |
|---------|---------|
| `elysia` | Web framework |
| `@elysiajs/openapi` | Auto-generated OpenAPI docs |

## File Structure

```
apps/backend/
├── src/
│   └── index.ts          # Application entry point
├── package.json          # Dependencies & scripts
└── tsconfig.json         # TypeScript configuration
```

## Available Scripts

```bash
# Development with hot reload
bun run dev

# Run linter
bun run lint

# Run tests (not configured yet)
bun run test
```

## Development Guidelines

### Adding New Routes

```typescript
import { Elysia } from "elysia";

const app = new Elysia()
  .get("/api/users", () => {
    return [{ id: 1, name: "John" }];
  })
  .post("/api/users", async ({ body }) => {
    // Handle creation
    return { id: 2, ...body };
  });
```

### Route Organization

As the API grows, organize routes using Elysia's plugin system:

```typescript
// src/routes/users.ts
import { Elysia } from "elysia";

export const usersRoutes = new Elysia({ prefix: "/users" })
  .get("/", () => "List users")
  .get("/:id", ({ params: { id } }) => `User ${id}`);

// src/index.ts
import { usersRoutes } from "./routes/users";

const app = new Elysia()
  .use(openapi())
  .use(usersRoutes)
  .listen(3000);
```

### Validation

Elysia uses Standard Schema. Use TypeBox or Zod for runtime validation:

```typescript
import { Elysia, t } from "elysia";

app.post("/users", ({ body }) => body, {
  body: t.Object({
    name: t.String(),
    email: t.String({ format: "email" })
  })
});
```

## OpenAPI Documentation

The API documentation is auto-generated and available at:
- Swagger UI: `http://localhost:3000/swagger`
- OpenAPI JSON: `http://localhost:3000/swagger/json`

## Environment Variables

Create `.env.local` for local development:

```bash
PORT=3000
DATABASE_URL=
JWT_SECRET=
```

## Best Practices

1. **Always validate inputs** using Elysia's built-in validation
2. **Use TypeScript strictly** - avoid `any` types
3. **Organize routes** in separate files under `src/routes/`
4. **Business logic** should go in `src/services/`
5. **Database access** should go in `src/repositories/` or `src/db/`
