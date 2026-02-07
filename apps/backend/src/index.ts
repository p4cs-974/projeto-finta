import { Elysia, t } from "elysia";
import { openapi } from "@elysiajs/openapi";

export default new Elysia()
  .get("/", () => "Hello Vercel Function")
  .post("/", ({ body }) => body, {
    body: t.Object({
      name: t.String(),
    }),
  });

const app = new Elysia()
  .use(openapi())
  .get("/", () => "Hello Elysia")
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
