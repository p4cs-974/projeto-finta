"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

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
import Link from "next/link";
import { ChartLineIcon } from "./ui/chart-line";
import {
  loginAction,
} from "@/app/actions/auth";
import { initialLoginFormState } from "@/components/auth/auth-form-state";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Entrando..." : "Entrar"}
    </Button>
  );
}

export function LoginForm({
  className,
  redirectTo,
  ...props
}: React.ComponentProps<"div"> & {
  redirectTo?: string;
}) {
  const [state, formAction] = useActionState(loginAction, initialLoginFormState);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form action={formAction}>
        <input type="hidden" name="redirectTo" value={redirectTo ?? "/"} />
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <ChartLineIcon size={48} />
            <h1 className="text-xl font-bold">Entrar na Finta</h1>
            <FieldDescription>
              Use seu e-mail e sua senha para acessar sua conta.
            </FieldDescription>
          </div>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              name="email"
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
            <FieldLabel htmlFor="password">Senha</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={state.fieldErrors.password?.length ? true : undefined}
              required
            />
            <FieldError
              errors={state.fieldErrors.password?.map((message) => ({ message }))}
            />
          </Field>
          <Field>
            <SubmitButton />
            {state.formError ? <FieldError>{state.formError}</FieldError> : null}
            <FieldDescription className="text-center">
              Ainda não tem conta? <Link href="/signup">Cadastre-se</Link>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
