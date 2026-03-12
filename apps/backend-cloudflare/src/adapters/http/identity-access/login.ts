import { AuthenticationService, parseLoginInput } from "@finta/identity-access";

import type { AppEnv } from "../../../app-env";
import { json, parseJsonRequest } from "../../../lib/http";
import { D1UserRepository } from "../../identity-access/d1-user-repository";
import { JwtTokenService } from "../../identity-access/jwt-token-service";
import { PasswordHasherAdapter } from "../../identity-access/password-hasher-adapter";

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
  const session = await service.login(input);

  return json({ data: session });
}
