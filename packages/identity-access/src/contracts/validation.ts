import { createApplicationError } from "@finta/shared-kernel";
import { z } from "zod";

import {
  hasControlCharacters,
  normalizeDisplayText,
  normalizeEmailText,
} from "./text";

import type { LoginInput, RegisterUserInput } from "./auth";

const registerUserSchema = z
  .object({
    name: z
      .string()
      .transform(normalizeDisplayText)
      .refine((value) => !hasControlCharacters(value), {
        message: "O nome contém caracteres de controle inválidos",
      })
      .pipe(z.string().min(2).max(100)),
    email: z
      .string()
      .transform(normalizeEmailText)
      .refine((value) => !hasControlCharacters(value), {
        message: "O e-mail contém caracteres de controle inválidos",
      })
      .pipe(z.string().min(1).max(255).email()),
    password: z.string().min(8).max(72),
  })
  .strict();

const loginUserSchema = z
  .object({
    email: z
      .string()
      .transform(normalizeEmailText)
      .refine((value) => !hasControlCharacters(value), {
        message: "O e-mail contém caracteres de controle inválidos",
      })
      .pipe(z.string().min(1).max(255).email()),
    password: z.string().min(8).max(72),
  })
  .strict();

function toValidationError(error: z.ZodError) {
  return createApplicationError(
    422,
    "VALIDATION_ERROR",
    "Corpo da requisição inválido",
    {
      fieldErrors: error.flatten().fieldErrors,
    },
  );
}

export function parseRegisterUserInput(input: unknown): RegisterUserInput {
  const parsed = registerUserSchema.safeParse(input);

  if (parsed.success) {
    return parsed.data;
  }

  throw toValidationError(parsed.error);
}

export function parseLoginInput(input: unknown): LoginInput {
  const parsed = loginUserSchema.safeParse(input);

  if (parsed.success) {
    return parsed.data;
  }

  throw toValidationError(parsed.error);
}
