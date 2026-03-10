import type {
	PublicUserRecord,
	UserRecord,
} from "../features/auth/user-repository";

interface FakeD1Result {
	meta: {
		last_row_id?: number;
	};
}

function sqliteNow(): string {
	return new Date().toISOString().replace("T", " ").slice(0, 19);
}

export function createFakeD1Database() {
	let nextId = 1;
	const users = new Map<number, UserRecord>();

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

		async run(): Promise<FakeD1Result> {
			return this.database.run(this.sql, this.values);
		}
	}

	class FakeD1Database {
		prepare(sql: string) {
			return new FakePreparedStatement(sql, this);
		}

		async first<T>(sql: string, values: unknown[]): Promise<T | null> {
			if (sql === "SELECT id FROM users WHERE email = ? LIMIT 1") {
				const email = String(values[0]);
				const user = Array.from(users.values()).find((candidate) => candidate.email === email);

				return (user ? ({ id: user.id } as T) : null);
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
