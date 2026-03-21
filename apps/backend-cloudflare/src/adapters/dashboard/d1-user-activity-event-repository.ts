import type {
  DashboardActivityEvent,
  DashboardActivityType,
  IDashboardActivityEventRepository,
} from "@finta/dashboard";
import type { AssetType } from "@finta/shared-kernel";

interface UserActivityEventRecord {
  id: number;
  user_id: number;
  event_type: DashboardActivityType;
  symbol: string | null;
  asset_type: AssetType | null;
  label: string | null;
  search_query: string | null;
  created_at: string;
}

export class D1UserActivityEventRepository
  implements IDashboardActivityEventRepository
{
  constructor(private readonly db: D1Database) {}

  async listRecentEvents(userId: number, limit: number) {
    const result = await this.db
      .prepare(
        [
          "SELECT id, user_id, event_type, symbol, asset_type, label, search_query, created_at",
          "FROM user_activity_events",
          "WHERE user_id = ?",
          "ORDER BY created_at DESC, id DESC",
          "LIMIT ?",
        ].join(" "),
      )
      .bind(userId, limit)
      .all<UserActivityEventRecord>();

    return (result.results ?? []).map(
      (item): DashboardActivityEvent => ({
        type: item.event_type,
        symbol: item.symbol,
        assetType: item.asset_type,
        label: item.label,
        searchQuery: item.search_query,
        createdAt: item.created_at,
      }),
    );
  }

  async countEventsByTypeInRange(input: {
    userId: number;
    type: DashboardActivityType;
    startAt: string;
    endAt: string;
  }) {
    const result = await this.db
      .prepare(
        [
          "SELECT COUNT(*) AS total",
          "FROM user_activity_events",
          "WHERE user_id = ?",
          "AND event_type = ?",
          "AND created_at >= ?",
          "AND created_at < ?",
        ].join(" "),
      )
      .bind(input.userId, input.type, input.startAt, input.endAt)
      .first<{ total: number }>();

    return result?.total ?? 0;
  }

  async createEvent(input: {
    userId: number;
    type: DashboardActivityType;
    symbol?: string | null;
    assetType?: AssetType | null;
    label?: string | null;
    searchQuery?: string | null;
    createdAt: Date;
  }) {
    await this.db
      .prepare(
        [
          "INSERT INTO user_activity_events",
          "(user_id, event_type, symbol, asset_type, label, search_query, created_at)",
          "VALUES (?, ?, ?, ?, ?, ?, ?)",
        ].join(" "),
      )
      .bind(
        input.userId,
        input.type,
        input.symbol ?? null,
        input.assetType ?? null,
        input.label ?? null,
        input.searchQuery ?? null,
        input.createdAt.toISOString(),
      )
      .run();
  }
}
