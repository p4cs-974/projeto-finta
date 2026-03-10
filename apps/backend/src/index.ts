import { jwt } from "@elysiajs/jwt";
import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";

import { checkDatabaseHealth } from "./db";
import { env } from "./lib/env";
import { authRoutes } from "./routes/auth";

const app = new Elysia()
  .use(
    openapi({
      documentation: {
        info: {
          title: "Finta Backend API",
          version: "1.0.0",
        },
      },
    }),
  )
  .use(
    jwt({
      name: "jwt",
      secret: env.JWT_SECRET,
      exp: "7d",
    }),
  )
  .use(authRoutes)
  .onError(({ code, set }) => {
    if (code === "VALIDATION") {
      set.status = 400;
      return {
        message: "Payload invalido.",
      };
    }
  })
  .get("/", () => ({ message: "Finta backend online." }), {
    detail: {
      tags: ["System"],
      summary: "Status basico da API",
    },
  })
  .get("/health/db", async ({ set }) => {
    try {
      await checkDatabaseHealth();
      return { status: "ok" };
    } catch {
      set.status = 500;
      return { status: "error" };
    }
  })
  .get("/crypto/:symbol", ({ params }) => {
    return { symbol: params.symbol, price: "mockado" };
  });

if (!process.env.VERCEL) {
  app.listen(env.PORT);
  console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
  );
}

export default app;
