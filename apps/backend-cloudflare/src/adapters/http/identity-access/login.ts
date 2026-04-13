import { AuthenticationService, parseLoginInput } from "@finta/identity-access";

import type { AppEnv } from "../../../app-env";
import { json, parseJsonRequest } from "../../../lib/http";
import { D1UserRepository } from "../../identity-access/d1-user-repository";
import { JwtTokenService } from "../../identity-access/jwt-token-service";
import { PasswordHasherAdapter } from "../../identity-access/password-hasher-adapter";
import { createApiKeyService } from "./shared";

export async function handleLogin(
  request: Request,
  env: AppEnv,
): Promise<Response> {
  const input = parseLoginInput(await parseJsonRequest(request));
  const service = new AuthenticationService({
    userRepository: new D1UserRepository(env.DB),
    passwordHasher: new PasswordHasherAdapter(),
    tokenService: new JwtTokenService(env.JWT_SECRET),
  });

  if (input.clientType === "cli") {
    const user = await service.authenticate(input);
    const apiKeyService = createApiKeyService(env);
    const apiKey = await apiKeyService.create({
      userId: user.id,
      keyName: input.deviceName
        ? `CLI - ${input.deviceName} - ${new Date().toISOString().slice(0, 10)}`
        : undefined,
      deviceName: input.deviceName,
    });

    return json({
      data: {
        user,
        apiKey,
        tokenType: "ApiKey",
      },
    });
  }

  const session = await service.login(input);

  return json({ data: session });
}
