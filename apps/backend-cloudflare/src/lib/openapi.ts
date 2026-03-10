export function createOpenApiDocument(baseUrl: string) {
	return {
		openapi: "3.1.1",
		info: {
			title: "Finta Backend API",
			version: "1.0.0",
			description: "API documentation for the Cloudflare Worker backend.",
		},
		servers: [
			{
				url: baseUrl,
			},
		],
		paths: {
			"/auth/register": {
				post: {
					summary: "Register a new user",
					tags: ["Auth"],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/RegisterRequest",
								},
								example: {
									name: "Pedro Custodio",
									email: "pedro@example.com",
									password: "SenhaSegura123",
								},
							},
						},
					},
					responses: {
						"201": {
							description: "User created and authenticated",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/RegisterSuccessResponse",
									},
								},
							},
						},
						"400": {
							description: "Malformed JSON body",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ErrorResponse",
									},
								},
							},
						},
						"409": {
							description: "Email already in use",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ErrorResponse",
									},
								},
							},
						},
						"415": {
							description: "Unsupported media type",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ErrorResponse",
									},
								},
							},
						},
						"422": {
							description: "Validation error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ErrorResponse",
									},
								},
							},
						},
					},
				},
			},
		},
		components: {
			schemas: {
				RegisterRequest: {
					type: "object",
					additionalProperties: false,
					required: ["name", "email", "password"],
					properties: {
						name: {
							type: "string",
							minLength: 2,
							maxLength: 100,
						},
						email: {
							type: "string",
							format: "email",
							maxLength: 255,
						},
						password: {
							type: "string",
							minLength: 8,
							maxLength: 72,
							format: "password",
						},
					},
				},
				PublicUser: {
					type: "object",
					required: ["id", "name", "email", "createdAt"],
					properties: {
						id: {
							type: "integer",
						},
						name: {
							type: "string",
						},
						email: {
							type: "string",
							format: "email",
						},
						createdAt: {
							type: "string",
							format: "date-time",
						},
					},
				},
				RegisterSuccessResponse: {
					type: "object",
					required: ["data"],
					properties: {
						data: {
							type: "object",
							required: ["user", "token", "tokenType", "expiresIn"],
							properties: {
								user: {
									$ref: "#/components/schemas/PublicUser",
								},
								token: {
									type: "string",
								},
								tokenType: {
									type: "string",
									example: "Bearer",
								},
								expiresIn: {
									type: "integer",
									example: 3600,
								},
							},
						},
					},
				},
				ErrorResponse: {
					type: "object",
					required: ["error"],
					properties: {
						error: {
							type: "object",
							required: ["code", "message"],
							properties: {
								code: {
									type: "string",
									enum: [
										"INVALID_JSON",
										"UNSUPPORTED_MEDIA_TYPE",
										"VALIDATION_ERROR",
										"EMAIL_ALREADY_IN_USE",
										"INTERNAL_ERROR",
									],
								},
								message: {
									type: "string",
								},
								details: {
									type: "object",
									properties: {
										fieldErrors: {
											type: "object",
											additionalProperties: {
												type: "array",
												items: {
													type: "string",
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	};
}
