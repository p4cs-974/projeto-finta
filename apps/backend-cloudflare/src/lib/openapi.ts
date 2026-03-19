export function createOpenApiDocument(baseUrl: string) {
	return {
		openapi: "3.1.1",
		info: {
			title: "Finta Backend API",
			version: "1.0.0",
			description: "Documentação da API do backend em Cloudflare Worker.",
		},
		servers: [{ url: baseUrl }],
		paths: {
			"/auth/login": {
				post: {
					summary: "Autenticar um usuário existente",
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
					responses: buildAuthResponses("200", "Usuário autenticado"),
				},
			},
			"/auth/register": {
				post: {
					summary: "Cadastrar um novo usuário",
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
							description: "Usuário criado e autenticado",
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/AuthSuccessResponse" },
								},
							},
						},
						"400": errorContent("Corpo JSON malformado"),
						"409": errorContent("E-mail já está em uso"),
						"415": errorContent("Tipo de mídia não suportado"),
						"422": errorContent("Erro de validação"),
					},
				},
			},
			"/ativos/{ticker}": {
				get: {
					summary: "Obter uma cotação de ativo da B3 ou cripto por ticker",
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
							description: "Quando definido como crypto, consulta um criptoativo em vez de um ativo da B3.",
							schema: {
								type: "string",
								enum: ["crypto"],
							},
						},
					],
					responses: {
						"200": {
							description: "Cotação do ativo encontrada",
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
						"401": errorContent("Token bearer ausente, inválido ou expirado"),
						"404": errorContent("Ativo não encontrado"),
						"422": errorContent("Ticker, tipo ou símbolo inválido"),
						"502": errorContent("Erro ou timeout no provedor de ativos"),
					},
				},
			},
			"/ativos/{ticker}/cache": {
				get: {
					summary: "Consultar a cotação exata em cache de um ativo da B3 ou cripto",
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
							description: "Quando definido como crypto, consulta o cache de cripto.",
							schema: {
								type: "string",
								enum: ["crypto"],
							},
						},
					],
					responses: {
						"200": {
							description: "Cotação em cache encontrada",
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
						"401": errorContent("Token bearer ausente, inválido ou expirado"),
						"404": errorContent("Cotação do ativo não encontrada em cache"),
						"422": errorContent("Ticker, tipo ou símbolo inválido"),
					},
				},
			},
			"/users/me/recent-assets": {
				get: {
					summary: "Listar seleções recentes de ativos do usuário autenticado",
					tags: ["Assets"],
					security: [{ bearerAuth: [] }],
					responses: {
						"200": {
							description: "Seleções recentes",
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
						"401": errorContent("Token bearer ausente, inválido ou expirado"),
					},
				},
				post: {
					summary: "Salvar uma seleção recente de ativo do usuário autenticado",
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
							description: "Seleção recente salva",
						},
						"401": errorContent("Token bearer ausente, inválido ou expirado"),
						"422": errorContent("Corpo da requisição inválido"),
					},
				},
			},
			"/users/me/favorites": {
				post: {
					summary: "Adicionar um favorito do usuário autenticado",
					tags: ["Assets"],
					security: [{ bearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/SaveFavoriteRequest",
								},
								example: {
									symbol: "PETR4",
									type: "stock",
								},
							},
						},
					},
					responses: {
						"204": {
							description: "Favorito criado ou já existente",
						},
						"401": errorContent("Token bearer ausente, inválido ou expirado"),
						"404": errorContent("Ativo não encontrado"),
						"422": errorContent("Corpo da requisição inválido"),
						"502": errorContent("Erro ou timeout no provedor de ativos"),
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
				FavoriteAsset: {
					type: "object",
					required: [
						"symbol",
						"type",
						"label",
						"market",
						"currency",
						"logoUrl",
						"favoritedAt",
					],
					properties: {
						symbol: { type: "string", example: "PETR4" },
						type: { type: "string", enum: ["stock", "crypto"] },
						label: { type: "string", example: "Petrobras PN" },
						market: { type: ["string", "null"], example: "B3" },
						currency: { type: ["string", "null"], example: "BRL" },
						logoUrl: { type: ["string", "null"], format: "uri", example: "https://example.com/petr4.png" },
						favoritedAt: { type: "string", format: "date-time" },
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
				SaveFavoriteRequest: {
					type: "object",
					additionalProperties: false,
					required: ["symbol", "type"],
					properties: {
						symbol: { type: "string", example: "PETR4" },
						type: { type: "string", enum: ["stock", "crypto"] },
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
		"400": errorContent("Corpo JSON malformado"),
		"401": errorContent("Credenciais inválidas"),
		"415": errorContent("Tipo de mídia não suportado"),
		"422": errorContent("Erro de validação"),
	};
}
