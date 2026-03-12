import type {
  AuthSessionResponseBody,
  LoginInput,
  RegisterUserInput,
} from "@finta/identity-access";

import { requestJson } from "@/lib/http-client";

export function login(input: LoginInput) {
  return requestJson<AuthSessionResponseBody>("/api/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export function register(input: RegisterUserInput) {
  return requestJson<AuthSessionResponseBody>("/api/auth/register", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });
}
