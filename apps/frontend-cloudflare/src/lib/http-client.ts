import type { ApiErrorBody } from "@finta/shared-kernel";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly body?: ApiErrorBody | null,
  ) {
    super(message);
  }
}

export async function requestJson<T>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    cache: "no-store",
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let payload: ApiErrorBody | T | null = null;

  if (text) {
    try {
      payload = JSON.parse(text) as ApiErrorBody | T;
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const errorPayload = payload as ApiErrorBody | null;
    throw new ApiRequestError(
      errorPayload?.error?.message ??
        `Request failed with status ${response.status}`,
      response.status,
      errorPayload?.error?.code,
      errorPayload,
    );
  }

  if (payload === null) {
    throw new ApiRequestError(
      "Server returned an invalid JSON response",
      response.status,
    );
  }

  return payload as T;
}
