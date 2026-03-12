"use server";

import type {
  LoginInput,
  RegisterUserInput,
  AuthSessionResponseBody,
} from "@finta/identity-access";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_COOKIE_NAME, getBackendBaseUrl, sanitizeRedirectTo } from "@/lib/auth";
import type { ApiErrorBody } from "@finta/shared-kernel";
import type { LoginFormState, SignupFormState } from "@/components/auth/auth-form-state";

async function requestAuth<TInput extends LoginInput | RegisterUserInput>(
  path: "/auth/login" | "/auth/register",
  input: TInput,
) {
  const response = await fetch(`${getBackendBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(input),
    cache: "no-store",
  });

  const text = await response.text();
  const payload = text
    ? (JSON.parse(text) as ApiErrorBody | AuthSessionResponseBody)
    : null;

  return {
    ok: response.ok,
    status: response.status,
    payload,
  };
}

export async function loginAction(
  _previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const redirectTo = sanitizeRedirectTo(formData.get("redirectTo")?.toString());
  const email = formData.get("email")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  try {
    const result = await requestAuth("/auth/login", {
      email,
      password,
    });

    if (!result.ok) {
      const payload = result.payload as ApiErrorBody | null;
      const fieldErrors = payload?.error.details?.fieldErrors ?? {};

      return {
        formError:
          result.status === 401
            ? "Invalid email or password."
            : payload?.error.message ?? "Could not sign in.",
        fieldErrors: {
          email: fieldErrors.email,
          password: fieldErrors.password,
        },
      };
    }

    const payload = result.payload as AuthSessionResponseBody;
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, payload.data.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: payload.data.expiresIn,
    });
  } catch {
    return {
      formError: "Could not reach the server. Try again.",
      fieldErrors: {},
    };
  }

  redirect(redirectTo);
}

export async function registerAction(
  _previousState: SignupFormState,
  formData: FormData,
): Promise<SignupFormState> {
  const name = formData.get("name")?.toString().trim() ?? "";
  const email = formData.get("email")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const confirmPassword = formData.get("confirmPassword")?.toString() ?? "";

  if (password !== confirmPassword) {
    return {
      formError: null,
      fieldErrors: {
        confirmPassword: ["Passwords do not match."],
      },
    };
  }

  try {
    const result = await requestAuth("/auth/register", {
      name,
      email,
      password,
    });

    if (!result.ok) {
      const payload = result.payload as ApiErrorBody | null;
      const fieldErrors = payload?.error.details?.fieldErrors ?? {};

      return {
        formError: payload?.error.message ?? "Could not create your account.",
        fieldErrors: {
          name: fieldErrors.name,
          email: fieldErrors.email,
          password: fieldErrors.password,
        },
      };
    }

    const payload = result.payload as AuthSessionResponseBody;
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, payload.data.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: payload.data.expiresIn,
    });
  } catch {
    return {
      formError: "Could not reach the server. Try again.",
      fieldErrors: {},
    };
  }

  redirect("/");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  redirect("/login");
}
