import type { AppEnv } from "../../../app-env";
import { requireAuth } from "../../../lib/auth";
import { parseAuthenticatedUserId } from "../shared";
import { createApiKeyService } from "./shared";

export async function handleRevokeApiKey(
  request: Request,
  env: AppEnv,
  apiKeyId: number,
): Promise<Response> {
  const auth = await requireAuth(request, env.JWT_SECRET, env.DB);
  const apiKeyService = createApiKeyService(env);

  await apiKeyService.revoke({
    id: apiKeyId,
    userId: parseAuthenticatedUserId(auth.sub),
  });

  return new Response(null, { status: 204 });
}
