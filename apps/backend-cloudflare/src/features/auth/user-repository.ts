export interface UserRecord {
	id: number;
	name: string;
	email: string;
	password_hash: string;
	created_at: string;
	updated_at: string;
}

export interface PublicUserRecord {
	id: number;
	name: string;
	email: string;
	created_at: string;
}

export async function findUserByEmail(
	db: D1Database,
	email: string,
): Promise<Pick<UserRecord, "id"> | null> {
	return (
		(await db
			.prepare("SELECT id FROM users WHERE email = ? LIMIT 1")
			.bind(email)
			.first<Pick<UserRecord, "id">>()) ?? null
	);
}

export async function findUserAuthByEmail(
	db: D1Database,
	email: string,
): Promise<
	Pick<UserRecord, "id" | "name" | "email" | "password_hash" | "created_at"> | null
> {
	return (
		(await db
			.prepare("SELECT id, name, email, password_hash, created_at FROM users WHERE email = ? LIMIT 1")
			.bind(email)
			.first<Pick<UserRecord, "id" | "name" | "email" | "password_hash" | "created_at">>()) ??
		null
	);
}

export async function insertUser(
	db: D1Database,
	input: {
		name: string;
		email: string;
		passwordHash: string;
	},
): Promise<number> {
	const result = await db
		.prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)")
		.bind(input.name, input.email, input.passwordHash)
		.run();

	const insertedId = result.meta.last_row_id;

	if (typeof insertedId !== "number") {
		throw new Error("D1 insert did not return last_row_id");
	}

	return insertedId;
}

export async function findPublicUserById(
	db: D1Database,
	id: number,
): Promise<PublicUserRecord | null> {
	return (
		(await db
			.prepare("SELECT id, name, email, created_at FROM users WHERE id = ? LIMIT 1")
			.bind(id)
			.first<PublicUserRecord>()) ?? null
	);
}

export function isUniqueConstraintError(error: unknown): boolean {
	return error instanceof Error && /unique constraint failed: users\.email/i.test(error.message);
}
