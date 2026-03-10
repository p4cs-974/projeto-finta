import { Elysia, t } from "elysia";

import type { AccessTokenSigner } from "../lib/jwt";
import {
  AuthConflictError,
  AuthValidationError,
  registerUser,
} from "../services/auth-service";

const registerBodySchema = t.Object(
  {
    name: t.String({ minLength: 1, maxLength: 120 }),
    email: t.String({ minLength: 3, maxLength: 320 }),
    password: t.String({ minLength: 8, maxLength: 255 }),
  },
  { additionalProperties: false },
);

const publicUserSchema = t.Object({
  id: t.Number(),
  name: t.String(),
  email: t.String({ format: "email" }),
  createdAt: t.String({ format: "date-time" }),
});

const errorResponseSchema = t.Object({
  message: t.String(),
});

export const authRoutes = new Elysia({ prefix: "/auth" }).post(
  "/register",
  async (context) => {
    const { body, set } = context;
    const jwt = (context as typeof context & { jwt: AccessTokenSigner }).jwt;

    try {
      set.status = 201;

      return await registerUser(body, jwt);
    } catch (error) {
      if (error instanceof AuthValidationError || error instanceof AuthConflictError) {
        set.status = error.status;
        return { message: error.message };
      }

      set.status = 500;
      return { message: "Falha ao cadastrar usuario." };
    }
  },
  {
    body: registerBodySchema,
    response: {
      201: t.Object({
        user: publicUserSchema,
        accessToken: t.String(),
      }),
      400: errorResponseSchema,
      409: errorResponseSchema,
      500: errorResponseSchema,
    },
    detail: {
      tags: ["Auth"],
      summary: "Cadastrar usuario por email e senha",
    },
  },
);
