export type AccessTokenPayload = {
  sub: string;
  email: string;
};

export type AccessTokenSigner = {
  sign(payload: AccessTokenPayload): Promise<string>;
};

export function signAccessToken(
  jwt: AccessTokenSigner,
  payload: AccessTokenPayload,
): Promise<string> {
  return jwt.sign(payload);
}
