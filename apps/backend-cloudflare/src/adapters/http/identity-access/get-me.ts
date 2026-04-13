import { D1UserRepository } from "../../identity-access/d1-user-repository";

import type { AppEnv } from "../../../app-env";
import { requireAuth } from "../../../lib/auth";
import { json } from "../../../lib/http";
import { parseAuthenticatedUserId } from "../shared";

export async function handleGetMe(
  request: Request,
  env: AppEnv,
): Promise<Response> {
  const auth = await requireAuth(request, env.JWT_SECRET, env.DB);
  const userRepository = new D1UserRepository(env.DB);
  const user = await userRepository.findPublicUserById(
    parseAuthenticatedUserId(auth.sub),
  );

  return json({
    data: {
      user: user ?? {
        id: parseAuthenticatedUserId(auth.sub),
        name: auth.name,
        email: auth.email,
        createdAt: new Date(0).toISOString(),
      },
      ...(auth.apiKey ? { apiKey: auth.apiKey } : {}),
    },
  });
}
