import {
  parseRegisterUserInput,
  RegistrationService,
} from "@finta/identity-access";

import type { AppEnv } from "../../../app-env";
import { json, parseJsonRequest } from "../../../lib/http";
import { D1UserRepository } from "../../identity-access/d1-user-repository";
import { JwtTokenService } from "../../identity-access/jwt-token-service";
import { PasswordHasherAdapter } from "../../identity-access/password-hasher-adapter";

export async function handleRegister(
  request: Request,
  env: AppEnv,
): Promise<Response> {
  const input = parseRegisterUserInput(await parseJsonRequest(request));
  const service = new RegistrationService({
    userRepository: new D1UserRepository(env.DB),
    passwordHasher: new PasswordHasherAdapter(),
    tokenService: new JwtTokenService(env.JWT_SECRET),
  });
  const session = await service.register(input);

  return json({ data: session }, { status: 201 });
}
