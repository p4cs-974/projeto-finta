# Lab 8 — Construção de Serviços

## Serviços implementados

### Serviço de Autenticação

Responsável por cadastro, login e validação de sessão do usuário web. A implementação está no pacote `@finta/identity-access` e é exposta pelo Worker em `apps/backend-cloudflare`.

Endpoints principais:

- `POST /auth/register` — cadastra usuário e retorna sessão Bearer.
- `POST /auth/login` — autentica usuário e retorna sessão Bearer JWT.
- `GET /auth/me` — retorna dados do usuário autenticado.

### Serviço de Consulta de Cotação

Responsável por consultar cotações de ações e criptomoedas, reutilizando cache quando possível e recorrendo a provedores externos quando necessário. A implementação está no pacote `@finta/price-query` e é exposta pelo Worker em `apps/backend-cloudflare`.

Endpoints principais:

- `GET /ativos/:ticker` — consulta cotação ao vivo, protegida por Bearer JWT.
- `GET /ativos/:ticker/cache` — retorna cotação em cache quando existente.
- `GET /ativos/cache-search?q=...&type=...` — busca cotações já cacheadas.

## Arquitetura e coordenação

O estilo de coordenação adotado é **orquestração síncrona**. O backend controla a sequência da requisição: valida a autenticação antes de executar a consulta de cotação; em seguida, o serviço de cotação decide se usa cache KV ou se chama o provedor externo.

O fluxo principal é:

1. Usuário realiza login via `POST /auth/login`.
2. Serviço de Autenticação valida credenciais no D1 e emite Bearer JWT.
3. Usuário solicita cotação via `GET /ativos/:ticker` enviando `Authorization: Bearer <token>`.
4. Endpoint de cotação valida o token.
5. Serviço de Consulta de Cotação consulta o cache KV.
6. Se houver cache válido, retorna `source=cache`.
7. Se não houver cache, chama Brapi/CoinCap, salva snapshot no cache e retorna `source=live`.
8. Se houver cache expirado, retorna imediatamente `stale=true` e atualiza em background.

Diagrama PlantUML: [`diagramas/fluxo-autenticacao-cotacao.puml`](./diagramas/fluxo-autenticacao-cotacao.puml)

Imagem gerada: [`diagramas/fluxo-autenticacao-cotacao.png`](./diagramas/fluxo-autenticacao-cotacao.png)

## Execução

A partir da raiz do monorepo:

```bash
pnpm install
pnpm run dev
```

Executar todos os testes:

```bash
pnpm run test
```

Executar os testes usados como evidência do Lab 8:

```bash
pnpm --filter @finta/price-query test
pnpm --filter backend-cloudflare test
```

## Estratégia de testes

### Teste unitário

Serviço escolhido: **Serviço de Consulta de Cotação** (`@finta/price-query`).

Objetivo: validar a lógica interna de consulta, incluindo cache frio, cache quente, cache expirado/stale, atualização em background e busca por prefixo.

Arquivo de teste:

- `packages/price-query/src/application/price-query-service.test.ts`

Evidência:

- [`evidencias/teste-unitario-price-query.png`](./evidencias/teste-unitario-price-query.png)

### Teste de integração

Fluxo escolhido: **Autenticação → Consulta de Cotação** no backend Cloudflare Worker.

Objetivo: validar que endpoints de cotação exigem token Bearer válido e que, após a autenticação/autorização, o serviço consulta cache/provedor e retorna cotação com metadados.

Arquivo de teste:

- `apps/backend-cloudflare/src/index.test.ts`

Evidência:

- [`evidencias/teste-integracao-backend.png`](./evidencias/teste-integracao-backend.png)
