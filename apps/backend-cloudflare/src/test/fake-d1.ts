interface UserRecord {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

interface PublicUserRecord {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

interface ApiKeyRecord {
  id: number;
  user_id: number;
  key_hash: string;
  name: string;
  created_at: string;
}

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

interface FavoriteAssetRecord {
  id: number;
  user_id: number;
  symbol: string;
  asset_type: "stock" | "crypto";
  label: string;
  market: string | null;
  currency: string | null;
  logo_url: string | null;
  created_at: string;
}

interface UserActivityEventRecord {
  id: number;
  user_id: number;
  event_type:
    | "search_performed"
    | "asset_viewed"
    | "favorite_added"
    | "favorite_removed";
  symbol: string | null;
  asset_type: "stock" | "crypto" | null;
  label: string | null;
  search_query: string | null;
  created_at: string;
}

function sqliteNow(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

export function createFakeD1Database() {
  let nextId = 1;
  let nextApiKeyId = 1;
  let nextRecentId = 1;
  let nextFavoriteId = 1;
  let nextUserActivityEventId = 1;
  const users = new Map<number, UserRecord>();
  const apiKeys = new Map<number, ApiKeyRecord>();
  const recentSelections = new Map<number, RecentAssetSelectionRecord>();
  const favoriteAssets = new Map<number, FavoriteAssetRecord>();
  const userActivityEvents = new Map<number, UserActivityEventRecord>();

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
          "SELECT id, user_id, key_hash, name, created_at",
          "FROM api_keys",
          "WHERE user_id = ?",
          "ORDER BY created_at DESC, id DESC",
        ].join(" ")
      ) {
        const userId = Number(values[0]);
        const results = Array.from(apiKeys.values())
          .filter((item) => item.user_id === userId)
          .sort((left, right) => {
            const timeDiff =
              Date.parse(right.created_at) - Date.parse(left.created_at);
            return timeDiff !== 0 ? timeDiff : right.id - left.id;
          }) as T[];

        return {
          results,
          success: true,
          meta: {},
        };
      }

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
              Date.parse(right.last_selected_at) -
              Date.parse(left.last_selected_at);
            return timeDiff !== 0 ? timeDiff : right.id - left.id;
          })
          .slice(0, limit) as T[];

        return {
          results,
          success: true,
          meta: {},
        };
      }

      if (
        sql ===
        [
          "SELECT id, user_id, symbol, asset_type, label, market, currency, logo_url, created_at AS favorited_at",
          "FROM favorite_assets",
          "WHERE user_id = ?",
          "ORDER BY created_at DESC, id DESC",
        ].join(" ")
      ) {
        const userId = Number(values[0]);
        const results = Array.from(favoriteAssets.values())
          .filter((item) => item.user_id === userId)
          .sort((left, right) => {
            const timeDiff =
              Date.parse(right.created_at) - Date.parse(left.created_at);
            return timeDiff !== 0 ? timeDiff : right.id - left.id;
          })
          .map((item) => ({
            ...item,
            favorited_at: item.created_at,
          })) as T[];

        return {
          results,
          success: true,
          meta: {},
        };
      }

      if (
        sql ===
        [
          "SELECT id, user_id, event_type, symbol, asset_type, label, search_query, created_at",
          "FROM user_activity_events",
          "WHERE user_id = ?",
          "ORDER BY created_at DESC, id DESC",
          "LIMIT ?",
        ].join(" ")
      ) {
        const userId = Number(values[0]);
        const limit = Number(values[1]);
        const results = Array.from(userActivityEvents.values())
          .filter((item) => item.user_id === userId)
          .sort((left, right) => {
            const timeDiff =
              Date.parse(right.created_at) - Date.parse(left.created_at);
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
        const user = Array.from(users.values()).find(
          (candidate) => candidate.email === email,
        );

        return user ? ({ id: user.id } as T) : null;
      }

      if (
        sql ===
        [
          "SELECT id, user_id, key_hash, name, created_at",
          "FROM api_keys",
          "WHERE key_hash = ?",
          "LIMIT 1",
        ].join(" ")
      ) {
        const keyHash = String(values[0]);
        const apiKey = Array.from(apiKeys.values()).find(
          (candidate) => candidate.key_hash === keyHash,
        );

        return (apiKey ?? null) as T | null;
      }

      if (
        sql ===
        [
          "SELECT id, user_id, key_hash, name, created_at",
          "FROM api_keys",
          "WHERE id = ?",
          "LIMIT 1",
        ].join(" ")
      ) {
        const id = Number(values[0]);
        const apiKey = apiKeys.get(id);

        return (apiKey ?? null) as T | null;
      }

      if (
        sql ===
        "SELECT COUNT(*) AS total FROM api_keys WHERE user_id = ?"
      ) {
        const userId = Number(values[0]);
        const total = Array.from(apiKeys.values()).filter(
          (item) => item.user_id === userId,
        ).length;

        return { total } as T;
      }

      if (
        sql ===
        "SELECT id, name, email, password_hash, created_at FROM users WHERE email = ? LIMIT 1"
      ) {
        const email = String(values[0]);
        const user = Array.from(users.values()).find(
          (candidate) => candidate.email === email,
        );

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

      if (
        sql ===
        "SELECT id, name, email, created_at FROM users WHERE id = ? LIMIT 1"
      ) {
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

      if (
        sql ===
        [
          "SELECT id",
          "FROM favorite_assets",
          "WHERE user_id = ? AND symbol = ? AND asset_type = ?",
          "LIMIT 1",
        ].join(" ")
      ) {
        const userId = Number(values[0]);
        const symbol = String(values[1]);
        const assetType = values[2] as "stock" | "crypto";
        const favorite = Array.from(favoriteAssets.values()).find(
          (item) =>
            item.user_id === userId &&
            item.symbol === symbol &&
            item.asset_type === assetType,
        );

        return favorite ? ({ id: favorite.id } as T) : null;
      }

      if (
        sql ===
        [
          "SELECT id, user_id, symbol, asset_type, label, market, currency, logo_url, created_at",
          "FROM favorite_assets",
          "WHERE user_id = ? AND symbol = ? AND asset_type = ?",
          "LIMIT 1",
        ].join(" ")
      ) {
        const userId = Number(values[0]);
        const symbol = String(values[1]);
        const assetType = values[2] as "stock" | "crypto";
        const favorite = Array.from(favoriteAssets.values()).find(
          (item) =>
            item.user_id === userId &&
            item.symbol === symbol &&
            item.asset_type === assetType,
        );

        return (favorite ?? null) as T | null;
      }

      if (
        sql ===
        [
          "SELECT COUNT(*) AS total",
          "FROM user_activity_events",
          "WHERE user_id = ?",
          "AND event_type = ?",
          "AND created_at >= ?",
          "AND created_at < ?",
        ].join(" ")
      ) {
        const userId = Number(values[0]);
        const eventType = String(values[1]);
        const startAt = Date.parse(String(values[2]));
        const endAt = Date.parse(String(values[3]));
        const total = Array.from(userActivityEvents.values()).filter(
          (item) =>
            item.user_id === userId &&
            item.event_type === eventType &&
            Date.parse(item.created_at) >= startAt &&
            Date.parse(item.created_at) < endAt,
        ).length;

        return { total } as T;
      }

      throw new Error(`Unsupported query in fake D1 first(): ${sql}`);
    }

    async run(sql: string, values: unknown[]): Promise<FakeD1Result> {
      if (
        sql ===
        [
          "INSERT INTO api_keys",
          "(user_id, key_hash, name, created_at)",
          "VALUES (?, ?, ?, ?)",
        ].join(" ")
      ) {
        const id = nextApiKeyId;
        nextApiKeyId += 1;
        apiKeys.set(id, {
          id,
          user_id: Number(values[0]),
          key_hash: String(values[1]),
          name: String(values[2]),
          created_at: String(values[3]),
        });

        return {
          meta: {
            last_row_id: id,
          },
        };
      }

      if (sql === "DELETE FROM api_keys WHERE id = ?") {
        apiKeys.delete(Number(values[0]));

        return { meta: {} };
      }

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
              Date.parse(right.last_selected_at) -
              Date.parse(left.last_selected_at);
            return timeDiff !== 0 ? timeDiff : right.id - left.id;
          })
          .slice(keep)
          .map((item) => item.id);

        for (const id of idsToDelete) {
          recentSelections.delete(id);
        }

        return { meta: {} };
      }

      if (
        sql ===
        [
          "INSERT OR IGNORE INTO favorite_assets",
          "(user_id, symbol, asset_type, label, market, currency, logo_url, created_at)",
          "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        ].join(" ")
      ) {
        const userId = Number(values[0]);
        const symbol = String(values[1]);
        const assetType = values[2] as "stock" | "crypto";
        const label = String(values[3]);
        const market = values[4] == null ? null : String(values[4]);
        const currency = values[5] == null ? null : String(values[5]);
        const logoUrl = values[6] == null ? null : String(values[6]);
        const createdAt = String(values[7]);
        const existing = Array.from(favoriteAssets.values()).find(
          (item) =>
            item.user_id === userId &&
            item.symbol === symbol &&
            item.asset_type === assetType,
        );

        if (existing) {
          return { meta: { last_row_id: existing.id } };
        }

        const id = nextFavoriteId;
        nextFavoriteId += 1;
        favoriteAssets.set(id, {
          id,
          user_id: userId,
          symbol,
          asset_type: assetType,
          label,
          market,
          currency,
          logo_url: logoUrl,
          created_at: createdAt,
        });

        return { meta: { last_row_id: id } };
      }

      if (
        sql ===
        [
          "DELETE FROM favorite_assets",
          "WHERE user_id = ? AND symbol = ? AND asset_type = ?",
        ].join(" ")
      ) {
        const userId = Number(values[0]);
        const symbol = String(values[1]);
        const assetType = values[2] as "stock" | "crypto";
        const favorite = Array.from(favoriteAssets.values()).find(
          (item) =>
            item.user_id === userId &&
            item.symbol === symbol &&
            item.asset_type === assetType,
        );

        if (favorite) {
          favoriteAssets.delete(favorite.id);
        }

        return { meta: {} };
      }

      if (
        sql ===
        [
          "INSERT INTO user_activity_events",
          "(user_id, event_type, symbol, asset_type, label, search_query, created_at)",
          "VALUES (?, ?, ?, ?, ?, ?, ?)",
        ].join(" ")
      ) {
        const id = nextUserActivityEventId;
        nextUserActivityEventId += 1;
        userActivityEvents.set(id, {
          id,
          user_id: Number(values[0]),
          event_type: values[1] as UserActivityEventRecord["event_type"],
          symbol: values[2] == null ? null : String(values[2]),
          asset_type:
            values[3] == null ? null : (values[3] as "stock" | "crypto"),
          label: values[4] == null ? null : String(values[4]),
          search_query: values[5] == null ? null : String(values[5]),
          created_at: String(values[6]),
        });

        return { meta: { last_row_id: id } };
      }

      if (
        sql !==
        "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)"
      ) {
        throw new Error(`Unsupported query in fake D1 run(): ${sql}`);
      }

      const name = String(values[0]);
      const email = String(values[1]);
      const passwordHash = String(values[2]);

      if (
        Array.from(users.values()).some(
          (candidate) => candidate.email === email,
        )
      ) {
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
    getApiKeys() {
      return Array.from(apiKeys.values());
    },
    getRecentSelections() {
      return Array.from(recentSelections.values());
    },
    getFavoriteAssets() {
      return Array.from(favoriteAssets.values());
    },
    getUserActivityEvents() {
      return Array.from(userActivityEvents.values());
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
    seedApiKey(input: Omit<ApiKeyRecord, "id"> & { id?: number }): ApiKeyRecord {
      const id = input.id ?? nextApiKeyId;
      nextApiKeyId = Math.max(nextApiKeyId, id + 1);
      const record: ApiKeyRecord = {
        id,
        ...input,
      };
      apiKeys.set(id, record);

      return record;
    },
    seedFavoriteAsset(
      input: Omit<FavoriteAssetRecord, "id"> & { id?: number },
    ): FavoriteAssetRecord {
      const id = input.id ?? nextFavoriteId;
      nextFavoriteId = Math.max(nextFavoriteId, id + 1);
      const record: FavoriteAssetRecord = {
        id,
        ...input,
      };
      favoriteAssets.set(id, record);

      return record;
    },
    seedRecentSelection(
      input: Omit<RecentAssetSelectionRecord, "id"> & { id?: number },
    ): RecentAssetSelectionRecord {
      const id = input.id ?? nextRecentId;
      nextRecentId = Math.max(nextRecentId, id + 1);
      const record: RecentAssetSelectionRecord = {
        id,
        ...input,
      };
      recentSelections.set(id, record);

      return record;
    },
    seedUserActivityEvent(
      input: Omit<UserActivityEventRecord, "id"> & { id?: number },
    ): UserActivityEventRecord {
      const id = input.id ?? nextUserActivityEventId;
      nextUserActivityEventId = Math.max(nextUserActivityEventId, id + 1);
      const record: UserActivityEventRecord = {
        id,
        ...input,
      };
      userActivityEvents.set(id, record);

      return record;
    },
  };
}
