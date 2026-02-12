import { Elysia, t } from "elysia";
import { openapi } from "@elysiajs/openapi";

const app = new Elysia()
  .use(openapi())

  // rota raiz
  .get("/", () => "Hello Teste😍")

  // rota POST de exemplo
  .post("/", ({ body }) => body, {
    body: t.Object({
      name: t.String(),
    }),
  })

  // rota dinâmica para criptos
  .get("/crypto/:symbol", ({ params }) => {
    return { symbol: params.symbol, price: "mockado" };
  });

app.listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);

