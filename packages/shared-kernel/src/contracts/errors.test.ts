import { describe, expect, it } from "vitest";

import {
  ApplicationError,
  createApplicationError,
  isApplicationError,
} from "./errors";

describe("shared-kernel errors", () => {
  it("builds application errors with the expected body shape", () => {
    const error = createApplicationError(
      422,
      "VALIDATION_ERROR",
      "Corpo da requisição inválido",
      {
        fieldErrors: {
          email: ["Invalid email"],
        },
      },
    );

    expect(error).toBeInstanceOf(ApplicationError);
    expect(error.body).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Corpo da requisição inválido",
        details: {
          fieldErrors: {
            email: ["Invalid email"],
          },
        },
      },
    });
    expect(isApplicationError(error)).toBe(true);
  });
});
