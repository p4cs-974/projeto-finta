# Finta Backend

API REST em Bun + Elysia com OpenAPI, Drizzle ORM e Postgres.

## Requisitos

- Bun
- Postgres acessivel por `DATABASE_URL`
- `JWT_SECRET` obrigatorio para o servidor subir

## Variaveis de ambiente

Crie um arquivo `.env.local` em `apps/backend` com:

```bash
PORT=3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/finta
JWT_SECRET=troque-por-um-segredo-forte
```

## Scripts

```bash
bun run dev
bun run lint
bun run type-check
bun run db:generate
```

## Rotas principais

- `GET /`
- `GET /health/db`
- `GET /crypto/:symbol`
- `POST /auth/register`

Swagger:

- `http://localhost:3000/swagger`
- `http://localhost:3000/swagger/json`

## Cadastro

`POST /auth/register`

```json
{
  "name": "Pedro Silva",
  "email": " pedro@example.com ",
  "password": "StrongPass123!"
}
```

Resposta `201`:

```json
{
  "user": {
    "id": 1,
    "name": "Pedro Silva",
    "email": "pedro@example.com",
    "createdAt": "2026-03-09T12:00:00.000Z"
  },
  "accessToken": "<jwt>"
}
```

O endpoint normaliza `name` e `email`, faz hash da senha com `Bun.password.hash()` e nunca retorna campos sensiveis.
