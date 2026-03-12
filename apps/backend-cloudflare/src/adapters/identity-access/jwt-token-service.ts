import type { ITokenService } from "@finta/identity-access";

import { ACCESS_TOKEN_TTL_SECONDS, signJwt } from "../../lib/jwt";

export class JwtTokenService implements ITokenService {
  constructor(private readonly secret: string) {}

  async issueAccessToken(input: { sub: string; email: string; name: string }) {
    const issuedAt = Math.floor(Date.now() / 1000);
    const token = await signJwt(
      {
        sub: input.sub,
        email: input.email,
        name: input.name,
        iat: issuedAt,
        exp: issuedAt + ACCESS_TOKEN_TTL_SECONDS,
      },
      this.secret,
    );

    return {
      token,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      tokenType: "Bearer" as const,
    };
  }
}
