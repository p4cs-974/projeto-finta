import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "../lib/env";
import * as schema from "./schema";

const queryClient = postgres(env.DATABASE_URL, {
  prepare: false,
});

export const db = drizzle(queryClient, { schema });

export async function checkDatabaseHealth(): Promise<void> {
  await db.execute(sql`select 1`);
}
