"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { sanitizeRedirectTo, type AuthErrorResponse } from "@/lib/auth";
import Link from "next/link";

export function LoginForm({
  className,
  redirectTo,
  ...props
}: React.ComponentProps<"div"> & {
  redirectTo?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<"email" | "password", string[]>>
  >({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as AuthErrorResponse;

        if (response.status === 422) {
          const nextFieldErrors = payload.error.details?.fieldErrors ?? {};

          setFieldErrors({
            email: nextFieldErrors.email,
            password: nextFieldErrors.password,
          });
        }

        setFormError(
          response.status === 401
            ? "Invalid email or password."
            : payload.error.message,
        );
        return;
      }

      await response.json();
      const nextPath = sanitizeRedirectTo(redirectTo);

      startTransition(() => {
        router.push(nextPath);
        router.refresh();
      });
    } catch {
      setFormError("Could not reach the server. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-xl font-bold">Sign in to Finta</h1>
            <FieldDescription>
              Use your email and password to access your account.
            </FieldDescription>
          </div>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
              aria-invalid={fieldErrors.email?.length ? true : undefined}
              required
            />
            <FieldError
              errors={fieldErrors.email?.map((message) => ({ message }))}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
              aria-invalid={fieldErrors.password?.length ? true : undefined}
              required
            />
            <FieldError
              errors={fieldErrors.password?.map((message) => ({ message }))}
            />
          </Field>
          <Field>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing In..." : "Sign In"}
            </Button>
            {formError ? <FieldError>{formError}</FieldError> : null}
            <FieldDescription className="text-center">
              Don&apos;t have an account? <Link href="/signup">Sign up</Link>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
