# Backend Cloudflare

Backend API em Cloudflare Workers com D1.

## Endpoints disponíveis

`GET /docs`

Swagger UI para testar a API no navegador.

`GET /openapi.json`

Documento OpenAPI 3.1 consumido pelo Swagger UI.

`POST /auth/register`

Body JSON:

```json
{
  "name": "Pedro Custodio",
  "email": "pedro@example.com",
  "password": "SenhaSegura123"
}
```

Resposta `201 Created`:

```json
{
  "data": {
    "user": {
      "id": 1,
      "name": "Pedro Custodio",
      "email": "pedro@example.com",
      "createdAt": "2026-03-10T12:00:00.000Z"
    },
    "token": "<jwt>",
    "tokenType": "Bearer",
    "expiresIn": 3600
  }
}
```

## Ambiente

Segredo local em `apps/backend-cloudflare/.dev.vars`:

```dotenv
JWT_SECRET=dev-only-secret
```

Segredo remoto:

```bash
pnpm --filter backend-cloudflare wrangler secret put JWT_SECRET
```

## Comandos

```bash
pnpm --filter backend-cloudflare run seedLocalD1
pnpm --filter backend-cloudflare run dev
pnpm --filter backend-cloudflare run test
pnpm --filter backend-cloudflare run type-check
```
