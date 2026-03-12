export function createOpenApiDocument(baseUrl: string) {
	return {
		openapi: "3.1.1",
		info: {
			title: "Finta Backend API",
			version: "1.0.0",
			description: "API documentation for the Cloudflare Worker backend.",
		},
		servers: [{ url: baseUrl }],
		paths: {
			"/auth/login": {
				post: {
					summary: "Authenticate an existing user",
					tags: ["Auth"],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/LoginRequest" },
								example: {
									email: "pedro@example.com",
									password: "SenhaSegura123",
								},
							},
						},
					},
					responses: buildAuthResponses("200", "User authenticated"),
				},
			},
			"/auth/register": {
				post: {
					summary: "Register a new user",
					tags: ["Auth"],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/RegisterRequest" },
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
									schema: { $ref: "#/components/schemas/AuthSuccessResponse" },
								},
							},
						},
						"400": errorContent("Malformed JSON body"),
						"409": errorContent("Email already in use"),
						"415": errorContent("Unsupported media type"),
						"422": errorContent("Validation error"),
					},
				},
			},
			"/ativos/{ticker}": {
				get: {
					summary: "Get a B3 or crypto asset quote by ticker",
					tags: ["Assets"],
					security: [{ bearerAuth: [] }],
					parameters: [
						{
							name: "ticker",
							in: "path",
							required: true,
							schema: {
								type: "string",
								example: "PETR4",
							},
						},
						{
							name: "type",
							in: "query",
							required: false,
							description: "When set to crypto, performs a crypto lookup instead of a B3 lookup.",
							schema: {
								type: "string",
								enum: ["crypto"],
							},
						},
					],
					responses: {
						"200": {
							description: "Asset quote found",
							content: {
								"application/json": {
									schema: {
										oneOf: [
											{ $ref: "#/components/schemas/AssetQuoteWithCacheResponse" },
											{ $ref: "#/components/schemas/CryptoAssetQuoteResponse" },
										],
									},
									examples: {
										b3: {
											value: {
												data: {
													ticker: "PETR4",
													name: "Petroleo Brasileiro S.A. Petrobras",
													market: "B3",
													currency: "BRL",
													price: 38.42,
													change: -0.18,
													changePercent: -0.47,
													quotedAt: "2026-03-10T18:00:00.000Z",
													logoUrl: "https://example.com/petr4.png",
												},
												cache: {
													key: "asset-quote:v1:PETR4",
													updatedAt: "2026-03-10T18:00:00.000Z",
													stale: false,
													source: "cache",
												},
											},
										},
										crypto: {
											value: {
												data: {
													symbol: "BTC",
													name: "Bitcoin",
													currency: "USD",
													price: 30.99,
													change: 0.42,
													changePercent: 1.37,
													quotedAt: "2026-03-11T00:38:08.000Z",
												},
												cache: {
													key: "crypto-quote:v1:BTC",
													updatedAt: "2026-03-11T00:38:08.000Z",
													stale: false,
													source: "cache",
												},
											},
										},
									},
								},
							},
						},
						"401": errorContent("Missing, invalid or expired bearer token"),
						"404": errorContent("Asset not found"),
						"422": errorContent("Invalid ticker, type or symbol"),
						"502": errorContent("Asset provider error or timeout"),
					},
				},
			},
			"/ativos/{ticker}/cache": {
				get: {
					summary: "Probe the exact cached quote for a B3 or crypto asset",
					tags: ["Assets"],
					security: [{ bearerAuth: [] }],
					parameters: [
						{
							name: "ticker",
							in: "path",
							required: true,
							schema: {
								type: "string",
								example: "PETR4",
							},
						},
						{
							name: "type",
							in: "query",
							required: false,
							description: "When set to crypto, probes the crypto cache.",
							schema: {
								type: "string",
								enum: ["crypto"],
							},
						},
					],
					responses: {
						"200": {
							description: "Cached quote found",
							content: {
								"application/json": {
									schema: {
										oneOf: [
											{ $ref: "#/components/schemas/AssetQuoteWithCacheResponse" },
											{ $ref: "#/components/schemas/CryptoAssetQuoteResponse" },
										],
									},
								},
							},
						},
						"401": errorContent("Missing, invalid or expired bearer token"),
						"404": errorContent("Asset cache miss"),
						"422": errorContent("Invalid ticker, type or symbol"),
					},
				},
			},
			"/users/me/recent-assets": {
				get: {
					summary: "List recent asset selections for the authenticated user",
					tags: ["Assets"],
					security: [{ bearerAuth: [] }],
					responses: {
						"200": {
							description: "Recent selections",
							content: {
								"application/json": {
									schema: {
										type: "object",
										required: ["data"],
										properties: {
											data: {
												type: "array",
												maxItems: 5,
												items: {
													$ref: "#/components/schemas/RecentAssetSelection",
												},
											},
										},
									},
								},
							},
						},
						"401": errorContent("Missing, invalid or expired bearer token"),
					},
				},
				post: {
					summary: "Store a recent asset selection for the authenticated user",
					tags: ["Assets"],
					security: [{ bearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/SaveRecentAssetSelectionRequest",
								},
							},
						},
					},
					responses: {
						"204": {
							description: "Recent selection stored",
						},
						"401": errorContent("Missing, invalid or expired bearer token"),
						"422": errorContent("Invalid request body"),
					},
				},
			},
		},
		components: {
			securitySchemes: {
				bearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
				},
			},
			schemas: {
				LoginRequest: {
					type: "object",
					additionalProperties: false,
					required: ["email", "password"],
					properties: {
						email: { type: "string", format: "email", maxLength: 255 },
						password: {
							type: "string",
							minLength: 8,
							maxLength: 72,
							format: "password",
						},
					},
				},
				RegisterRequest: {
					type: "object",
					additionalProperties: false,
					required: ["name", "email", "password"],
					properties: {
						name: { type: "string", minLength: 2, maxLength: 100 },
						email: { type: "string", format: "email", maxLength: 255 },
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
						id: { type: "integer" },
						name: { type: "string" },
						email: { type: "string", format: "email" },
						createdAt: { type: "string", format: "date-time" },
					},
				},
				AuthSuccessResponse: {
					type: "object",
					required: ["data"],
					properties: {
						data: {
							type: "object",
							required: ["user", "token", "tokenType", "expiresIn"],
							properties: {
								user: { $ref: "#/components/schemas/PublicUser" },
								token: { type: "string" },
								tokenType: { type: "string", example: "Bearer" },
								expiresIn: { type: "integer", example: 3600 },
							},
						},
					},
				},
				AssetQuote: {
					type: "object",
					required: [
						"ticker",
						"name",
						"market",
						"currency",
						"price",
						"change",
						"changePercent",
						"quotedAt",
						"logoUrl",
					],
					properties: {
						ticker: { type: "string", example: "PETR4" },
						name: { type: "string" },
						market: { type: "string", enum: ["B3"] },
						currency: { type: "string", example: "BRL" },
						price: { type: "number", example: 38.42 },
						change: { type: "number", example: -0.18 },
						changePercent: { type: "number", example: -0.47 },
						quotedAt: { type: "string", format: "date-time" },
						logoUrl: {
							type: ["string", "null"],
							format: "uri",
							example: "https://example.com/petr4.png",
						},
					},
				},
				CacheMeta: {
					type: "object",
					required: ["key", "updatedAt", "stale", "source"],
					properties: {
						key: { type: "string" },
						updatedAt: { type: "string", format: "date-time" },
						stale: { type: "boolean" },
						source: { type: "string", enum: ["cache", "live"] },
					},
				},
				AssetQuoteWithCacheResponse: {
					type: "object",
					required: ["data", "cache"],
					properties: {
						data: { $ref: "#/components/schemas/AssetQuote" },
						cache: { $ref: "#/components/schemas/CacheMeta" },
					},
				},
				CryptoAssetQuote: {
					type: "object",
					required: [
						"symbol",
						"name",
						"currency",
						"price",
						"change",
						"changePercent",
						"quotedAt",
					],
					properties: {
						symbol: { type: "string", example: "BTC" },
						name: { type: "string", example: "Bitcoin" },
						currency: { type: "string", example: "USD" },
						price: { type: "number", example: 30.99 },
						change: { type: "number", example: 0.42 },
						changePercent: { type: "number", example: 1.37 },
						quotedAt: { type: "string", format: "date-time" },
					},
				},
				CryptoAssetQuoteResponse: {
					type: "object",
					required: ["data", "cache"],
					properties: {
						data: { $ref: "#/components/schemas/CryptoAssetQuote" },
						cache: { $ref: "#/components/schemas/CacheMeta" },
					},
				},
				RecentAssetSelection: {
					type: "object",
					required: [
						"symbol",
						"type",
						"label",
						"market",
						"currency",
						"logoUrl",
						"lastSelectedAt",
					],
					properties: {
						symbol: { type: "string", example: "PETR4" },
						type: { type: "string", enum: ["stock", "crypto"] },
						label: { type: "string", example: "Petroleo Brasileiro S.A. Petrobras" },
						market: { type: ["string", "null"], example: "B3" },
						currency: { type: ["string", "null"], example: "BRL" },
						logoUrl: { type: ["string", "null"], format: "uri", example: "https://example.com/petr4.png" },
						lastSelectedAt: { type: "string", format: "date-time" },
					},
				},
				SaveRecentAssetSelectionRequest: {
					type: "object",
					additionalProperties: false,
					required: ["symbol", "type", "label"],
					properties: {
						symbol: { type: "string", example: "PETR4" },
						type: { type: "string", enum: ["stock", "crypto"] },
						label: { type: "string", example: "Petroleo Brasileiro S.A. Petrobras" },
						market: { type: ["string", "null"], example: "B3" },
						currency: { type: ["string", "null"], example: "BRL" },
						logoUrl: { type: ["string", "null"], format: "uri", example: "https://example.com/petr4.png" },
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
										"ASSET_CACHE_MISS",
										"ASSET_NOT_FOUND",
										"EXTERNAL_SERVICE_ERROR",
										"INVALID_CREDENTIALS",
										"INVALID_JSON",
										"INVALID_TOKEN",
										"UNSUPPORTED_MEDIA_TYPE",
										"VALIDATION_ERROR",
										"EMAIL_ALREADY_IN_USE",
										"INTERNAL_ERROR",
									],
								},
								message: { type: "string" },
								details: {
									type: "object",
									properties: {
										fieldErrors: {
											type: "object",
											additionalProperties: {
												type: "array",
												items: { type: "string" },
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

function errorContent(description: string) {
	return {
		description,
		content: {
			"application/json": {
				schema: {
					$ref: "#/components/schemas/ErrorResponse",
				},
			},
		},
	};
}

function buildAuthResponses(successStatus: "200", successDescription: string) {
	return {
		[successStatus]: {
			description: successDescription,
			content: {
				"application/json": {
					schema: { $ref: "#/components/schemas/AuthSuccessResponse" },
				},
			},
		},
		"400": errorContent("Malformed JSON body"),
		"401": errorContent("Invalid credentials"),
		"415": errorContent("Unsupported media type"),
		"422": errorContent("Validation error"),
	};
}
