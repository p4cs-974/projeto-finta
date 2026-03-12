import type {
	PublicUserRecord,
	UserRecord,
} from "../features/auth/user-repository";

interface FakeD1Result {
	meta: {
		last_row_id?: number;
	};
}

interface FakeD1AllResult<T> {
	results: T[];
	success: true;
	meta: Record<string, never>;
}

interface RecentAssetSelectionRecord {
	id: number;
	user_id: number;
	symbol: string;
	asset_type: "stock" | "crypto";
	label: string;
	market: string | null;
	currency: string | null;
	logo_url: string | null;
	last_selected_at: string;
}

function sqliteNow(): string {
	return new Date().toISOString().replace("T", " ").slice(0, 19);
}

export function createFakeD1Database() {
	let nextId = 1;
	let nextRecentId = 1;
	const users = new Map<number, UserRecord>();
	const recentSelections = new Map<number, RecentAssetSelectionRecord>();

	class FakePreparedStatement {
		constructor(
			private readonly sql: string,
			private readonly database: FakeD1Database,
			private readonly values: unknown[] = [],
		) {}

		bind(...values: unknown[]) {
			return new FakePreparedStatement(this.sql, this.database, values);
		}

		async first<T>(): Promise<T | null> {
			return this.database.first<T>(this.sql, this.values);
		}

		async all<T>(): Promise<FakeD1AllResult<T>> {
			return this.database.all<T>(this.sql, this.values);
		}

		async run(): Promise<FakeD1Result> {
			return this.database.run(this.sql, this.values);
		}
	}

	class FakeD1Database {
		prepare(sql: string) {
			return new FakePreparedStatement(sql, this);
		}

		async all<T>(sql: string, values: unknown[]): Promise<FakeD1AllResult<T>> {
			if (
				sql ===
				[
					"SELECT id, user_id, symbol, asset_type, label, market, currency, logo_url, last_selected_at",
					"FROM recent_asset_selections",
					"WHERE user_id = ?",
					"ORDER BY last_selected_at DESC, id DESC",
					"LIMIT ?",
				].join(" ")
			) {
				const userId = Number(values[0]);
				const limit = Number(values[1]);
				const results = Array.from(recentSelections.values())
					.filter((item) => item.user_id === userId)
					.sort((left, right) => {
						const timeDiff =
							Date.parse(right.last_selected_at) - Date.parse(left.last_selected_at);
						return timeDiff !== 0 ? timeDiff : right.id - left.id;
					})
					.slice(0, limit) as T[];

				return {
					results,
					success: true,
					meta: {},
				};
			}

			throw new Error(`Unsupported query in fake D1 all(): ${sql}`);
		}

		async first<T>(sql: string, values: unknown[]): Promise<T | null> {
			if (sql === "SELECT id FROM users WHERE email = ? LIMIT 1") {
				const email = String(values[0]);
				const user = Array.from(users.values()).find((candidate) => candidate.email === email);

				return (user ? ({ id: user.id } as T) : null);
			}

			if (sql === "SELECT id, name, email, password_hash, created_at FROM users WHERE email = ? LIMIT 1") {
				const email = String(values[0]);
				const user = Array.from(users.values()).find((candidate) => candidate.email === email);

				if (!user) {
					return null;
				}

				return {
					id: user.id,
					name: user.name,
					email: user.email,
					password_hash: user.password_hash,
					created_at: user.created_at,
				} as T;
			}

			if (sql === "SELECT id, name, email, created_at FROM users WHERE id = ? LIMIT 1") {
				const id = Number(values[0]);
				const user = users.get(id);

				if (!user) {
					return null;
				}

				const publicUser: PublicUserRecord = {
					id: user.id,
					name: user.name,
					email: user.email,
					created_at: user.created_at,
				};

				return publicUser as T;
			}

			throw new Error(`Unsupported query in fake D1 first(): ${sql}`);
		}

		async run(sql: string, values: unknown[]): Promise<FakeD1Result> {
			if (
				sql ===
				[
					"INSERT INTO recent_asset_selections",
					"(user_id, symbol, asset_type, label, market, currency, logo_url, last_selected_at)",
					"VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
					"ON CONFLICT(user_id, symbol, asset_type) DO UPDATE SET",
					"label = excluded.label,",
					"market = excluded.market,",
					"currency = excluded.currency,",
					"logo_url = excluded.logo_url,",
					"last_selected_at = excluded.last_selected_at",
				].join(" ")
			) {
				const userId = Number(values[0]);
				const symbol = String(values[1]);
				const assetType = values[2] as "stock" | "crypto";
				const label = String(values[3]);
				const market = values[4] == null ? null : String(values[4]);
				const currency = values[5] == null ? null : String(values[5]);
				const logoUrl = values[6] == null ? null : String(values[6]);
				const lastSelectedAt = String(values[7]);
				const existing = Array.from(recentSelections.values()).find(
					(item) =>
						item.user_id === userId &&
						item.symbol === symbol &&
						item.asset_type === assetType,
				);

				if (existing) {
					recentSelections.set(existing.id, {
						...existing,
						label,
						market,
						currency,
						logo_url: logoUrl,
						last_selected_at: lastSelectedAt,
					});

					return { meta: { last_row_id: existing.id } };
				}

				const id = nextRecentId;
				nextRecentId += 1;
				recentSelections.set(id, {
					id,
					user_id: userId,
					symbol,
					asset_type: assetType,
					label,
					market,
					currency,
					logo_url: logoUrl,
					last_selected_at: lastSelectedAt,
				});

				return { meta: { last_row_id: id } };
			}

			if (
				sql ===
				[
					"DELETE FROM recent_asset_selections",
					"WHERE user_id = ?",
					"AND id IN (",
					"SELECT id FROM recent_asset_selections",
					"WHERE user_id = ?",
					"ORDER BY last_selected_at DESC, id DESC",
					"LIMIT -1 OFFSET ?",
					")",
				].join(" ")
			) {
				const userId = Number(values[0]);
				const keep = Number(values[2]);
				const idsToDelete = Array.from(recentSelections.values())
					.filter((item) => item.user_id === userId)
					.sort((left, right) => {
						const timeDiff =
							Date.parse(right.last_selected_at) - Date.parse(left.last_selected_at);
						return timeDiff !== 0 ? timeDiff : right.id - left.id;
					})
					.slice(keep)
					.map((item) => item.id);

				for (const id of idsToDelete) {
					recentSelections.delete(id);
				}

				return { meta: {} };
			}

			if (sql !== "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)") {
				throw new Error(`Unsupported query in fake D1 run(): ${sql}`);
			}

			const name = String(values[0]);
			const email = String(values[1]);
			const passwordHash = String(values[2]);

			if (Array.from(users.values()).some((candidate) => candidate.email === email)) {
				throw new Error("UNIQUE constraint failed: users.email");
			}

			const id = nextId;
			nextId += 1;

			users.set(id, {
				id,
				name,
				email,
				password_hash: passwordHash,
				created_at: sqliteNow(),
				updated_at: sqliteNow(),
			});

			return {
				meta: {
					last_row_id: id,
				},
			};
		}
	}

	return {
		db: new FakeD1Database() as unknown as D1Database,
		getUsers() {
			return Array.from(users.values());
		},
		getRecentSelections() {
			return Array.from(recentSelections.values());
		},
		seedUser(input: Pick<UserRecord, "name" | "email" | "password_hash">) {
			const id = nextId;
			nextId += 1;
			users.set(id, {
				id,
				created_at: sqliteNow(),
				updated_at: sqliteNow(),
				...input,
			});

			return users.get(id)!;
		},
	};
}
