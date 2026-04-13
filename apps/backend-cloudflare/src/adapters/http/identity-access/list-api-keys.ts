import type { AppEnv } from "../../../app-env";
import { requireAuth } from "../../../lib/auth";
import { json } from "../../../lib/http";
import { createApiKeyService } from "./shared";
import { parseAuthenticatedUserId } from "../shared";

export async function handleListApiKeys(
  request: Request,
  env: AppEnv,
): Promise<Response> {
  const auth = await requireAuth(request, env.JWT_SECRET, env.DB);
  const apiKeyService = createApiKeyService(env);
  const items = await apiKeyService.listForUser(parseAuthenticatedUserId(auth.sub));

  return json({
    data: items.map((item) => ({
      id: item.id,
      name: item.name,
      createdAt: item.createdAt,
    })),
  });
}
