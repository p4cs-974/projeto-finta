"use client";

import dynamic from "next/dynamic";
import { useActionState, useDeferredValue, useId, useState } from "react";
import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  registerAction,
} from "@/app/actions/auth";
import { initialSignupFormState } from "@/components/auth/auth-form-state";

const FacehashAvatar = dynamic(
  () =>
    import("@/components/signup/facehash-avatar").then(
      (module) => module.FacehashAvatar,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="size-[88px] border border-border bg-muted/40" aria-hidden="true" />
    ),
  },
);

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creating Account..." : "Create Account"}
    </Button>
  );
}

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [state, formAction] = useActionState(
    registerAction,
    initialSignupFormState,
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const fallbackId = useId();
  const avatarSeed = useDeferredValue(
    [fullName.trim(), email.trim().toLowerCase()].filter(Boolean).join(" | ") ||
      fallbackId,
  );

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>
            Enter your email below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <p className="text-xs font-medium text-muted-foreground">
                  Avatar Preview
                </p>
                <FacehashAvatar name={avatarSeed} />
              </div>
              <Field>
                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  aria-invalid={state.fieldErrors.name?.length ? true : undefined}
                  required
                />
                <FieldError
                  errors={state.fieldErrors.name?.map((message) => ({ message }))}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-invalid={state.fieldErrors.email?.length ? true : undefined}
                  required
                />
                <FieldError
                  errors={state.fieldErrors.email?.map((message) => ({ message }))}
                />
              </Field>
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      aria-invalid={
                        state.fieldErrors.password?.length ? true : undefined
                      }
                      required
                    />
                    <FieldError
                      errors={state.fieldErrors.password?.map((message) => ({
                        message,
                      }))}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">
                      Confirm Password
                    </FieldLabel>
                    <Input
                      id="confirm-password"
                      name="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      aria-invalid={
                        state.fieldErrors.confirmPassword?.length
                          ? true
                          : undefined
                      }
                      required
                    />
                    <FieldError
                      errors={state.fieldErrors.confirmPassword?.map(
                        (message) => ({
                          message,
                        }),
                      )}
                    />
                  </Field>
                </Field>
                <FieldDescription>
                  Must be at least 8 characters long.
                </FieldDescription>
              </Field>
              <Field>
                <SubmitButton />
                {state.formError ? <FieldError>{state.formError}</FieldError> : null}
                <FieldDescription className="text-center">
                  Already have an account? <Link href="/login">Sign in</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
