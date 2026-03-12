export type ApiErrorCode =
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
	| "VALIDATION_ERROR";

export interface ApiErrorBody {
	error: {
		code: ApiErrorCode;
		message: string;
		details?: {
			fieldErrors?: Record<string, string[] | undefined>;
		};
	};
}

export class HttpError extends Error {
	constructor(
		public readonly status: number,
		public readonly body: ApiErrorBody,
	) {
		super(body.error.message);
		this.name = "HttpError";
	}
}

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
): HttpError {
	return new HttpError(status, {
		error: {
			code,
			message,
			...(details ? { details } : {}),
		},
	});
}

export async function parseJsonRequest<T>(request: Request): Promise<T> {
	const contentType = request.headers.get("content-type");

	if (!contentType?.toLowerCase().includes("application/json")) {
		throw apiError(
			415,
			"UNSUPPORTED_MEDIA_TYPE",
			"Content-Type must be application/json",
		);
	}

	try {
		return (await request.json()) as T;
	} catch {
		throw apiError(400, "INVALID_JSON", "Malformed JSON body");
	}
}

export function errorResponse(error: unknown): Response {
	if (error instanceof HttpError) {
		return json(error.body, { status: error.status });
	}

	console.error(error);

	return json(
		{
			error: {
				code: "INTERNAL_ERROR",
				message: "An unexpected error occurred",
			},
		},
		{ status: 500 },
	);
}
