import {
  ApplicationError,
  type ApiErrorBody,
  type ApplicationErrorCode,
} from "@finta/shared-kernel";

export type ApiErrorCode = ApplicationErrorCode;
export { ApplicationError as HttpError } from "@finta/shared-kernel";

export function json(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: ApiErrorBody["error"]["details"],
): ApplicationError {
  return new ApplicationError(status, code, message, details);
}

export async function parseJsonRequest<T>(request: Request): Promise<T> {
  const contentType = request.headers.get("content-type");

  if (!contentType?.toLowerCase().includes("application/json")) {
    throw apiError(
      415,
      "UNSUPPORTED_MEDIA_TYPE",
      "O Content-Type deve ser application/json",
    );
  }

  try {
    return (await request.json()) as T;
  } catch {
    throw apiError(400, "INVALID_JSON", "Corpo JSON malformado");
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof ApplicationError) {
    return json(error.body, { status: error.status });
  }

  console.error(error);

  return json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Ocorreu um erro inesperado",
      },
    },
    { status: 500 },
  );
}
