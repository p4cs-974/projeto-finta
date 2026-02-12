import { Elysia, t } from "elysia";
import { openapi } from "@elysiajs/openapi";
import { getPrice } from "./crypto/get-price";

const app = new Elysia()
  .use(openapi())
  .get("/", () => "Hello Teste😍")
  .get("/crypto/:symbol", ({ params: { symbol } }) => getPrice(symbol))
  .post("/", ({ body }) => body, {
    body: t.Object({
      name: t.String(),
    }),
  });

// aidioncei esse process !== "undefined" pq preciso dele pra poder dar deploy no vercel usando o bun, já q a gente fiz essa condicional do !process.env.
if (typeof process !== "undefined" && !process.env.VERCEL) {
  app.listen(3000);
  console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
  );
}

export default app;
