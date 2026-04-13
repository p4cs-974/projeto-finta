import type { ApiKey, IApiKeyRepository } from "@finta/identity-access";

function toIsoString(value: string): string {
  if (value.includes("T")) {
    return new Date(value).toISOString();
  }

  return new Date(`${value.replace(" ", "T")}Z`).toISOString();
}

interface ApiKeyRecord {
  id: number;
  user_id: number;
  key_hash: string;
  name: string;
  created_at: string;
}

export class D1ApiKeyRepository implements IApiKeyRepository {
  constructor(private readonly db: D1Database) {}

  async create(input: {
    userId: number;
    keyHash: string;
    name: string;
    createdAt: string;
  }): Promise<number> {
    const result = await this.db
      .prepare(
        [
          "INSERT INTO api_keys",
          "(user_id, key_hash, name, created_at)",
          "VALUES (?, ?, ?, ?)",
        ].join(" "),
      )
      .bind(input.userId, input.keyHash, input.name, input.createdAt)
      .run();
    const insertedId = result.meta.last_row_id;

    if (typeof insertedId !== "number") {
      throw new Error("D1 insert did not return last_row_id");
    }

    return insertedId;
  }

  async findByHash(keyHash: string): Promise<ApiKey | null> {
    const record = await this.db
      .prepare(
        [
          "SELECT id, user_id, key_hash, name, created_at",
          "FROM api_keys",
          "WHERE key_hash = ?",
          "LIMIT 1",
        ].join(" "),
      )
      .bind(keyHash)
      .first<ApiKeyRecord>();

    return record ? this.toApiKey(record) : null;
  }

  async listByUserId(userId: number): Promise<ApiKey[]> {
    const result = await this.db
      .prepare(
        [
          "SELECT id, user_id, key_hash, name, created_at",
          "FROM api_keys",
          "WHERE user_id = ?",
          "ORDER BY created_at DESC, id DESC",
        ].join(" "),
      )
      .bind(userId)
      .all<ApiKeyRecord>();

    return (result.results ?? []).map((record) => this.toApiKey(record));
  }

  async findById(id: number): Promise<ApiKey | null> {
    const record = await this.db
      .prepare(
        [
          "SELECT id, user_id, key_hash, name, created_at",
          "FROM api_keys",
          "WHERE id = ?",
          "LIMIT 1",
        ].join(" "),
      )
      .bind(id)
      .first<ApiKeyRecord>();

    return record ? this.toApiKey(record) : null;
  }

  async delete(id: number): Promise<void> {
    await this.db
      .prepare("DELETE FROM api_keys WHERE id = ?")
      .bind(id)
      .run();
  }

  async countByUserId(userId: number): Promise<number> {
    const result = await this.db
      .prepare("SELECT COUNT(*) AS total FROM api_keys WHERE user_id = ?")
      .bind(userId)
      .first<{ total: number }>();

    return Number(result?.total ?? 0);
  }

  private toApiKey(record: ApiKeyRecord): ApiKey {
    return {
      id: record.id,
      userId: record.user_id,
      name: record.name,
      createdAt: toIsoString(record.created_at),
    };
  }
}
