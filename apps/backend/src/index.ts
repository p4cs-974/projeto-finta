import { Elysia, t } from "elysia";
import { openapi } from "@elysiajs/openapi";

const app = new Elysia()
  .use(openapi())
  .get("/", () => "Hello Teste😍")
  .post("/", ({ body }) => body, {
    body: t.Object({
      name: t.String(),
    }),
  })

  // rota dinâmica para criptos
  .get("/crypto/:symbol", ({ params }) => {
    return { symbol: params.symbol, price: "mockado" };
  });

if (!process.env.VERCEL) {
  app.listen(3000);
  console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
  );
}

export default app;
