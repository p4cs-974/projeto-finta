export type ApplicationErrorCode =
  | "API_KEY_LIMIT_REACHED"
  | "API_KEY_NOT_FOUND"
  | "ASSET_CACHE_MISS"
  | "ASSET_NOT_FOUND"
  | "EMAIL_ALREADY_IN_USE"
  | "EXTERNAL_SERVICE_ERROR"
  | "INTERNAL_ERROR"
  | "INVALID_CREDENTIALS"
  | "INVALID_JSON"
  | "INVALID_TOKEN"
  | "NOT_FOUND"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "UPSTREAM_UNAVAILABLE"
  | "VALIDATION_ERROR";

export interface ApplicationErrorDetails {
  fieldErrors?: Record<string, string[] | undefined>;
}

export interface ApiErrorBody {
  error: {
    code: ApplicationErrorCode;
    message: string;
    details?: ApplicationErrorDetails;
  };
}

export class ApplicationError extends Error {
  readonly body: ApiErrorBody;

  constructor(
    readonly status: number,
    readonly code: ApplicationErrorCode,
    message: string,
    readonly details?: ApplicationErrorDetails,
  ) {
    super(message);
    this.name = "ApplicationError";
    this.body = {
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    };
  }
}

export function createApplicationError(
  status: number,
  code: ApplicationErrorCode,
  message: string,
  details?: ApplicationErrorDetails,
) {
  return new ApplicationError(status, code, message, details);
}

export function isApplicationError(error: unknown): error is ApplicationError {
  return error instanceof ApplicationError;
}
