# Backend Cloudflare

Backend API em Cloudflare Workers com D1.

## Endpoints disponíveis

`GET /docs`

Swagger UI para testar a API no navegador.

`GET /openapi.json`

Documento OpenAPI 3.1 consumido pelo Swagger UI.

`GET /ativos/{ticker}`

Retorna uma cotação resumida de um ativo da B3. Exige `Authorization: Bearer <jwt>`.

Exemplo:

```bash
curl --request GET \
  --url http://localhost:8787/ativos/PETR4 \
  --header "Authorization: Bearer <jwt>"
```

Resposta `200 OK`:

```json
{
  "data": {
    "ticker": "PETR4",
    "name": "Petroleo Brasileiro S.A. Petrobras",
    "market": "B3",
    "currency": "BRL",
    "price": 38.42,
    "change": -0.18,
    "changePercent": -0.47,
    "quotedAt": "2026-03-10T18:00:00.000Z",
    "logoUrl": "https://example.com/petr4.png"
  }
}
```

Erros relevantes:

- `401 INVALID_TOKEN`: bearer ausente, inválido ou expirado
- `404 ASSET_NOT_FOUND`: ticker não encontrado no provider
- `422 VALIDATION_ERROR`: ticker fora do padrão `^[A-Z]{4}[0-9]{1,2}(?:\\.[A-Z]{2,5})?$`
- `502 EXTERNAL_SERVICE_ERROR`: erro ou timeout na Brapi

`GET /ativos/{ticker}?type=crypto`

Retorna uma cotação resumida de criptoativos. Exige `Authorization: Bearer <jwt>`.

Observações:

- cotações de `stock` continuam na Brapi
- cotações de `crypto` usam CoinCap
- `GET /ativos/cache-search` continua somente em KV, sem consultar providers

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
BRAPI_TOKEN=your-brapi-token
COINCAP_API_KEY=your-coincap-api-key
```

Segredo remoto:

```bash
pnpm --filter backend-cloudflare exec wrangler secret put JWT_SECRET
pnpm --filter backend-cloudflare exec wrangler secret put BRAPI_TOKEN
pnpm --filter backend-cloudflare exec wrangler secret put COINCAP_API_KEY
```

## Comandos

```bash
pnpm --filter backend-cloudflare run seedLocalD1
pnpm --filter backend-cloudflare run dev
pnpm --filter backend-cloudflare run test
pnpm --filter backend-cloudflare run type-check
```
